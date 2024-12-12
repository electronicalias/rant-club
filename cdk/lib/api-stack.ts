import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager'
import { Construct } from 'constructs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createRestApiDefaultResources } from './modules/methods/rest-api-default-methods';
import { createRestApiResource } from './modules/methods/rest-api-method';

interface ApiStackProps extends cdk.StackProps {
    uploadLambda: lambda.Function;
    cookieLambda: lambda.Function;
    uploadLambdaRole: iam.Role;
    cookieLambdaRole: iam.Role;
}

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const environment = this.node.tryGetContext('environment');

        if (environment === 'prod') {
            console.log('Production environment detected');
        } else {
            console.log('Development environment detected');
        }

        // Import or create an ACM Certificate
        const certificate = certificatemanager.Certificate.fromCertificateArn(this, 'Certificate', 'arn:aws:acm:us-east-1:326675554455:certificate/0d63f20a-8cfb-49c6-8ba9-67708e58cdd8');

        // Create a custom domain for the API Gateway
        const customDomain = new apigateway.DomainName(this, 'CustomDomain', {
            domainName: 'api.rant.club',
            certificate: certificate,
            endpointType: apigateway.EndpointType.EDGE,  // Ensure you're using an edge-optimized endpoint
            securityPolicy: apigateway.SecurityPolicy.TLS_1_2,  // Use a modern TLS policy
        });

        // Create API Gateway
        const api = new apigateway.RestApi(this, 'ApiGateway', {
            restApiName: 'RantClubAPI',
        });

        // Link the custom domain to the API
        new apigateway.BasePathMapping(this, 'BasePathMapping', {
            domainName: customDomain,
            restApi: api,
        });


		// Import the Lambda functions for the UI API
		const uploadLambda = cdk.aws_lambda.Function.fromFunctionArn(this, 'uploadLambda', props.uploadLambda.functionArn)
		const cookieLambda = cdk.aws_lambda.Function.fromFunctionArn(this, 'cookieLambda', props.cookieLambda.functionArn)

		// Import roles for lambdas
		const uploadLambdaRole = cdk.aws_iam.Role.fromRoleArn(this, 'uploadLambdaRole', props.uploadLambdaRole.roleArn);
		const cookieLambdaRole = cdk.aws_iam.Role.fromRoleArn(this, 'cookieLambdaRole', props.cookieLambdaRole.roleArn);

        // create Rest API methods
        const apiResources = [
            { path: 'upload', function: uploadLambda, action: 'POST', role: uploadLambdaRole, authorizer: undefined },
            { path: 'fetchCookie', function: cookieLambda, action: 'POST', role: cookieLambdaRole, authorizer: undefined },
        ]
        apiResources.forEach((resource) => {
            // Create default OPTIONS on path
            createRestApiDefaultResources(api, resource.path)

            // Create supported action on path
            createRestApiResource(this, resource.action, api, resource.path, resource.function.functionArn, resource.authorizer)

            if (resource.role) {
                resource.role.addToPrincipalPolicy(
                    new cdk.aws_iam.PolicyStatement({
                        actions: [`apigateway:${resource.action}`],
                        resources: [`arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}`]
                    })
                )
            }
        })

        props.uploadLambda.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
        props.cookieLambda.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'))

        // Add POST /upload endpoint
        // const uploadResource = api.root.addResource('upload');
        // uploadResource.addMethod('POST', new apigateway.LambdaIntegration(props.uploadLambda));
        // Enable CORS for the /upload resource
        // uploadResource.addCorsPreflight({
        //     allowOrigins: apigateway.Cors.ALL_ORIGINS,  // Allow all origins (you can specify a specific origin like 'http://localhost:5173' if you need)
        //     allowMethods: apigateway.Cors.ALL_METHODS,  // Allow all methods (GET, POST, OPTIONS, etc.)
        //     allowHeaders: apigateway.Cors.DEFAULT_HEADERS,  // Allow common headers like Content-Type, etc.
        // });

        // 1. Create an S3 bucket to store the React build files
        const siteBucket = new s3.Bucket(this, 'ReactAppBucket', {
            websiteIndexDocument: 'index.html', // The index file in the S3 bucket
            websiteErrorDocument: 'error.html', // Error file (if exists)
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Removes the bucket when the stack is deleted
        });

        // Create a CloudFront Origin Access Identity (OAI)
        const oai = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI');

        // Grant read
        siteBucket.grantRead(oai)

        // 2. Deploy the build files to the S3 bucket
        new s3deploy.BucketDeployment(this, 'DeployReactApp', {
            sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))], // Path to the build folder
            destinationBucket: siteBucket,
        });

        // 3. Create a CloudFront distribution to serve the static files
        const distribution = new cloudfront.CloudFrontWebDistribution(this, 'rant-club-cdk', {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: siteBucket,
                        originAccessIdentity: oai
                    },
                    behaviors: [
                        { isDefaultBehavior: true }
                    ],
                },
            ],
            viewerCertificate: {
                aliases: ['www.rant.club'],
                props: {
                    acmCertificateArn: 'arn:aws:acm:us-east-1:326675554455:certificate/0d63f20a-8cfb-49c6-8ba9-67708e58cdd8',
                    sslSupportMethod: 'sni-only'
                }
            }
        })

        // Output the URL of the CloudFront distribution (useful for accessing the website)
        new cdk.CfnOutput(this, 'SiteURL', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'The URL of the React app',
        });
    }
}
