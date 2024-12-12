import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
    public readonly audioBucket: s3.Bucket;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3 Bucket for audio files
        this.audioBucket = new s3.Bucket(this, 'RantAudioBucket', {
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // (Optional) DynamoDB Table for metadata
        new dynamodb.Table(this, 'RantMetadataTable', {
            partitionKey: { name: 'fileId', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
}
