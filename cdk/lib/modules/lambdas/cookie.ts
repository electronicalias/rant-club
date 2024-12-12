import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export function buildCookieLambda(scope: any, props: any) {

    const basicExecutionRole = iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole');

    const cookieLambdaRole = new iam.Role(scope, 'cookieLambdaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })

    cookieLambdaRole.addManagedPolicy(basicExecutionRole);

    const cookieLambda = new lambda.Function(scope, 'cookieLambda', {
        runtime: lambda.Runtime.PYTHON_3_12,
        code: lambda.Code.fromAsset(path.join(__dirname, '../../../../backend/cookie'), {
            bundling: {
                image: lambda.Runtime.PYTHON_3_12.bundlingImage,
                command: [
                    'bash', '-c',
                    'pip install -r requirements.txt -t /asset-output && cp -a . /asset-output'
                ],
            },
        }),
        handler: 'app.handler',
        timeout: cdk.Duration.seconds(30),
        role: cookieLambdaRole,
    })

    // Grant Lambda access to S3
    props.audioBucket.grantReadWrite(cookieLambdaRole);

    return { cookieLambdaRole, cookieLambda }

}