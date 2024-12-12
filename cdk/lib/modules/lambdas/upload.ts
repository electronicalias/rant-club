import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export function buildUploadLambda(scope: any, props: any) {

    const basicExecutionRole = iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole');

    const uploadLambdaRole = new iam.Role(scope, 'uploadLambdaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })

    uploadLambdaRole.addManagedPolicy(basicExecutionRole);

    const uploadLambda = new lambda.Function(scope, 'uploadLambda', {
        runtime: lambda.Runtime.PYTHON_3_12,
        code: lambda.Code.fromAsset(path.join(__dirname, '../../../../backend/upload'), {
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
        environment: {
            'BUCKET_NAME': props.audioBucket.bucketName,
        },
        role: uploadLambdaRole,
    })

    // Grant Lambda access to S3
    props.audioBucket.grantReadWrite(uploadLambdaRole);

    return { uploadLambdaRole, uploadLambda }

}