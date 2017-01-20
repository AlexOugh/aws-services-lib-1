
'use strict';

exports.handler = (event, context) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var method = event.httpMethod.toLowerCase();
  var paths = event.path.split('/');
  var path = paths[paths.length-1];
  var queryParams = event.queryStringParameters;
  var postData = (event.body) ? JSON.parse(event.body) : null;
  var authorizer = event.requestContext.authorizer;
  // { "refresh_token": "ffffffff-ffff-ffff-ffff-ffffffffffff", "principalId": "user|a1b2c3d4" }

  var credentials = null;
  if (event.headers.Credentials) {
    credentials = JSON.parse(event.headers.Credentials)
  }
  console.log(credentials);

  try {
    var params = postData;
    if (method == 'get') params = queryParams;
    params['Credentials'] = credentials;
    this[method](params, function(err, data) {
      if (err) {
        console.log(err);
        sendFailureResponse({error: 'not permitted'}, 403, context, authorizer);
      }
      else {
        console.log(data);
        sendSuccessResponse(data, context, authorizer);
      }
    });
  }
  catch(err) {
    console.log(err);
    sendNotPermittedMethodResponse(event.path, event.httpMethod, context, authorizer);
  }
}

function sendNotPermittedMethodResponse(path, method, context, authorizer) {
  var responseBody = {error: "not permitted method " + method + " in " + path};
  var statusCode = 404;
  sendResponse(responseBody, statusCode, context, authorizer);
}

function sendNotFoundResponse(path, method, context, authorizer) {
  var responseBody = {error: "invalid path " + path};
  var statusCode = 404;
  sendResponse(responseBody, statusCode, context, authorizer);
}

function sendSuccessResponse(retValue, context, authorizer) {
  var responseBody = retValue;
  var statusCode = 200;
  sendResponse(responseBody, statusCode, context, authorizer);
}

function sendFailureResponse(err, statusCode, context, authorizer) {
  var responseBody = err;
  sendResponse(responseBody, statusCode, context, authorizer);
}

function sendResponse(responseBody, statusCode, context, authorizer) {
  responseBody['__authorizer'] = authorizer
  var response = {
      statusCode: statusCode,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(responseBody)
  };
  console.log("response: " + JSON.stringify(response))
  context.succeed(response);
}
