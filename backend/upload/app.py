import json
import base64
import boto3
import os

# S3 bucket name from the environment variables
BUCKET_NAME = os.environ.get('BUCKET_NAME')
s3_client = boto3.client('s3')


def handler(event, context):
    path = event['path']
    method = event['httpMethod']
    print(f'Path: {path} Method: {method}')
    headers = event['headers']
    print(f'Headers: {json.dumps(headers)}')

    auth_token = headers['Authorization'].split(' ')[1]
    print(f'Auth Token: {auth_token}')
    try:
        # Parse the JSON body
        body = json.loads(event['body'])

        # Validate inputs
        if 'filename' not in body or 'filedata' not in body:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",  # Allow all origins (can be restricted to specific ones)
                    "Access-Control-Allow-Methods": "OPTIONS, POST",  # Allowed methods
                    "Access-Control-Allow-Headers": "Content-Type",  # Allowed headers
                },
                "body": json.dumps({"error": "filename and filedata are required"})
            }

        # Decode the Base64 file data
        filename = body['filename']
        filedata = base64.b64decode(body['filedata'])

        # Upload to S3
        s3_client.put_object(Bucket=BUCKET_NAME, Key=filename, Body=filedata)

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # Allow all origins (can be restricted to specific ones)
                "Access-Control-Allow-Methods": "OPTIONS, POST",  # Allowed methods
                "Access-Control-Allow-Headers": "Content-Type",  # Allowed headers
            },
            "body": json.dumps({"message": f"File {filename} uploaded successfully"})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # Allow all origins (can be restricted to specific ones)
                "Access-Control-Allow-Methods": "OPTIONS, POST",  # Allowed methods
                "Access-Control-Allow-Headers": "Content-Type, Cookie",  # Allowed headers
            },
            "body": json.dumps({"error": str(e)})
        }
