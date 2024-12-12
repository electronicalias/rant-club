import * as apigateway from 'aws-cdk-lib/aws-apigateway'

function createCorsOptions(apiResource: apigateway.Resource) {
    // apiResource.addCorsPreflight({
    //     allowOrigins: apigateway.Cors.ALL_ORIGINS,  // Allow all origins (you can specify a specific origin like 'http://localhost:5173' if you need)
    //     allowMethods: apigateway.Cors.ALL_METHODS,  // Allow all methods (GET, POST, OPTIONS, etc.)
    //     allowHeaders: apigateway.Cors.DEFAULT_HEADERS,  // Allow common headers like Content-Type, etc.
    // })
    
    if (apiResource.path === '/upload') {
        console.log('Adding preflight for upload')
        apiResource.addCorsPreflight({
            allowOrigins: ['http://localhost:5173', 'api.rant.club', 'www.rant.club'],  // Allow all origins (you can specify a specific origin like 'http://localhost:5173' if you need)
            allowMethods: apigateway.Cors.ALL_METHODS,  // Allow all methods (GET, POST, OPTIONS, etc.)
            allowHeaders: [
                'Content-Type', // Allow common headers like Content-Type
                'Authorization', // Required for sending the session token
            ],
            allowCredentials: true
        })
    } else {
        apiResource.addCorsPreflight({
            allowOrigins: ['http://localhost:5173', 'https://api.rant.club'], // Add your allowed origins
            allowMethods: apigateway.Cors.ALL_METHODS,  // Allow all HTTP methods (GET, POST, OPTIONS, etc.)
            allowHeaders: apigateway.Cors.DEFAULT_HEADERS,  // Allow standard headers
        });
        // apiResource.addMethod(
        //     'OPTIONS',
        //     new apigateway.MockIntegration({
        //         integrationResponses: [
        //             {
        //                 statusCode: '200',
        //                 responseParameters: {
        //                     'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        //                     'method.response.header.Access-Control-Allow-Origin': "'http://localhost:5173, https://api.rant.club'",
        //                     'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST,GET,PUT,DELETE'",
        //                 },
        //             },
        //         ],
        //         requestTemplates: {
        //             'application/json': '{ "statusCode": 200 }',
        //         },
        //     }),
        //     {
        //         methodResponses: [
        //             {
        //                 statusCode: '200',
        //                 responseParameters: {
        //                     'method.response.header.Access-Control-Allow-Headers': true,
        //                     'method.response.header.Access-Control-Allow-Methods': true,
        //                     'method.response.header.Access-Control-Allow-Origin': true,
        //                 },
        //             },
        //         ],
        //     }
        // );
    }
}

export function createRestApiDefaultResources(api: apigateway.RestApi, resource: string) {
    const apiResource = api.root.addResource(resource);
    console.log('Resource Path: ', apiResource.path)
    createCorsOptions(apiResource);
    // Add additional methods or configurations for the resource
}