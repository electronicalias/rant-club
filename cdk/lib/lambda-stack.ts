import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { buildUploadLambda } from './modules/lambdas/upload';
import { buildCookieLambda } from './modules/lambdas/cookie';

// props and values to pass to the stack
interface LambdaStackProps extends cdk.StackProps {
    audioBucket: s3.Bucket;
}

export class LambdaStack extends cdk.Stack {
    public readonly uploadLambda: lambda.Function;
    public readonly cookieLambda: lambda.Function;
    public readonly uploadLambdaRole: iam.Role;
    public readonly cookieLambdaRole: iam.Role;

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        // Lambda Function for API
        const { uploadLambda, uploadLambdaRole } = buildUploadLambda(this, props);
        const { cookieLambda, cookieLambdaRole } = buildCookieLambda(this, props);

        // export lambda values
        this.uploadLambda = uploadLambda;
        this.cookieLambda = cookieLambda;

        // export role values
        this.uploadLambdaRole = uploadLambdaRole;
        this.cookieLambdaRole = cookieLambdaRole;
    }
}