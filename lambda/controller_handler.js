'use strict';
console.log('Loading function');

exports.handler = (event, context) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var method = event.httpMethod.toLowerCase();
  var paths = event.path.split('/');
  var path = paths[paths.length-1];
  var queryParams = event.queryStringParameters;
  if (queryParams == null)  queryParams = {};
  var postData = (event.body) ? event.body : {};
  if (postData && typeof(postData) == "string") postData = JSON.parse(postData);
  var authorizer = (event.requestContext) ? event.requestContext.authorizer: null;
  // { "refresh_token": "ffffffff-ffff-ffff-ffff-ffffffffffff", "principalId": "user|a1b2c3d4" }
  var resType = (event.resType) ? event.resType: null;

  // temporary fix for the CORS issue of Custom Authorizer in non 200 Http responses
  if (authorizer && authorizer.error) {
    // authorization is failed, so return failure response
    sendFailureResponse({error: authorizer.error}, 403, context, authorizer);
  }

  var credentials = null;
  if (event.headers.Credentials) {
    credentials = JSON.parse(new Buffer(event.headers.Credentials, 'base64').toString())
  }
  console.log(credentials);

  if (authorizer == null && credentials == null) {
    console.log("either Credentials or Customer Authorization result must be given");
    sendFailureResponse({error: 'not permitted'}, 403, context, authorizer, resType);
  }

  try {
    var params = postData;
    if (method == 'get') params = queryParams;
    params['Credentials'] = credentials;
    if (authorizer) params['userGuid'] = authorizer.user_guid;
    console.log('params : ', params);

    var controller = this.allocate_controller(path);
    console.log("controller: " + controller);

    // now check if the method exists in the found controller
    if (!(method in controller)) {
      sendNotPermittedMethodResponse(path, method, context, authorizer);
      return;
    }

    // run the method
    controller[method](params).then(data => {
      console.log(data);
      sendSuccessResponse(data, context, authorizer, resType);
    }).catch(err => {
      console.log(err);
      sendFailureResponse({error: err}, 500, context, authorizer, resType);
    });
  }
  catch(err) {
    console.log(err);
    sendNotPermittedMethodResponse(event.path, event.httpMethod, context, authorizer, resType);
  }
}

function sendNotPermittedMethodResponse(path, method, context, authorizer, resType) {
  var responseBody = {error: "not permitted method " + method + " in " + path};
  var statusCode = 404;
  sendResponse(responseBody, statusCode, context, authorizer, resType);
}

function sendNotFoundResponse(path, method, context, authorizer, resType) {
  var responseBody = {error: "invalid path " + path};
  var statusCode = 404;
  sendResponse(responseBody, statusCode, context, authorizer, resType);
}

function sendSuccessResponse(retValue, context, authorizer, resType) {
  var responseBody = retValue;
  var statusCode = 200;
  sendResponse(responseBody, statusCode, context, authorizer, resType);
}

function sendFailureResponse(err, statusCode, context, authorizer, resType) {
  var responseBody = err;
  sendResponse(responseBody, statusCode, context, authorizer, resType);
}

function sendResponse(responseBody, statusCode, context, authorizer, resType) {
  //if (authorizer) responseBody['__authorizer'] = authorizer
  var response = {
      statusCode: statusCode,
  };
  if (resType && resType == 'json') {
    response['body'] = responseBody;
  }
  else {
    response['headers'] = { "Access-Control-Allow-Origin": "*" };
    response['body'] = JSON.stringify(responseBody);
  }
  console.log("response: " + JSON.stringify(response))
  context.succeed(response);
}
