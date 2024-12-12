import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { StorageStack } from '../lib/storage-stack';
import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

// Instantiate the stacks
const storageStack = new StorageStack(app, 'RantClubStorageStack');

// Stack for the lambdas
const lambdaStack = new LambdaStack(app, 'RantClubLambdaStack', {
    audioBucket: storageStack.audioBucket
});

// Lambda Stack Dependencies
lambdaStack.addDependency(storageStack);

// Stack for Authentication

// Stack fo the API
const apiStack = new ApiStack(app, 'RantClubApiStack', {
    uploadLambda: lambdaStack.uploadLambda,
    cookieLambda: lambdaStack.cookieLambda,
    uploadLambdaRole: lambdaStack.uploadLambdaRole,
    cookieLambdaRole: lambdaStack.cookieLambdaRole
});

// API Stack Dependencies
apiStack.addDependency(storageStack);
apiStack.addDependency(lambdaStack);

// Stack for the Front End