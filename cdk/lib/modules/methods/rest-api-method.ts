import * as cdk from 'aws-cdk-lib';

function createApiMethod(
    scope: any, 
    method: string,
    api: cdk.aws_apigateway.RestApi,
    resourceName: string, 
    lambdaArn: string | null,
    authorizer?: cdk.aws_apigateway.IAuthorizer
) {
    if (lambdaArn) {
        const lambdaFunction = cdk.aws_lambda.Function.fromFunctionArn(
            scope,
            `${lambdaArn}-function`,
            lambdaArn
        );

        const rootResource = api.root;
        let resource = rootResource.getResource(resourceName);

        if (!resource) {
            resource = rootResource.addResource(resourceName);
        }
    
        // Define method options with or without an authorizer
        const methodOptions: cdk.aws_apigateway.MethodOptions = {
            authorizationType: authorizer 
                ? cdk.aws_apigateway.AuthorizationType.COGNITO
                : cdk.aws_apigateway.AuthorizationType.NONE,
            authorizer: authorizer ?? undefined,
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Headers': true,
                        'method.response.header.Access-Control-Allow-Methods': true,
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
            ],
        };

        resource.addMethod(
            method,
            new cdk.aws_apigateway.LambdaIntegration(lambdaFunction),
            methodOptions
        );
    }
}

export function createRestApiResource(
    scope: any,
    method: string,
    api: cdk.aws_apigateway.RestApi, 
    resourceName: string, 
    lambda: string | null, 
    authorizor?: cdk.aws_apigateway.Authorizer,
) {
    createApiMethod(scope, method, api, resourceName, lambda, authorizor);
    // Add additional methods or configurations for the resource
}