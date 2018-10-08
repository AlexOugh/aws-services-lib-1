var AWS = require('aws-sdk');

module.exports = {

  findService: function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var lambda = new AWS.Lambda(params);
    return lambda;
  },

  findAccountPolicy: function(input) {
    var lambda = this.findService(input);
    var params = {
      FunctionName: input.functionArn,
    };
    return lambda.getPolicy(params).promise().then(data => {
      // { Policy: '{"Version":"2012-10-17","Statement":[{"Action":"lambda:InvokeFunction","Resource":"arn:aws:lambda:us-east-1:089476987273:function:SSOProxyElastigroup-SpotinstLambdaFunction-15P3UDNPADGF4","Effect":"Allow","Principal":{"AWS":"arn:aws:iam::290093585298:root"},"Sid":"Id-133"}],"Id":"default"}' }
      console.log(data);
      var lambdaArn = input.functionArn;
      console.log(lambdaArn);
      var policy = JSON.parse(data.Policy)
      return policy.Statement.filter(statement =>
        statement.Action == 'lambda:invokeFunction'
        && statement.Resource == lambdaArn
        && statement.Effect == 'Allow'
        && statement.Principal.AWS == 'arn:aws:iam::' + input.instanceAccount + ':root').length > 0;
    }).catch(err => {
      console.log(err);
      return Promise.resolve(false);
    });
  },

  addPermission: function(input) {
    var lambda = this.findService(input);
    var principal = (input.principal) ? input.principal : "sns.amazonaws.com";
    var statementId = (input.statementId) ? input.statementId : "sns_invoke";
    var params = {
      Action: "lambda:invokeFunction",
      FunctionName: input.functionArn,
      Principal: principal,
      StatementId: statementId,
    };
    if (input.sourceAccount) {
      params['SourceAccount'] = input.sourceAccount;
    }
    if (input.sourceArn) {
      params['SourceArn'] = input.sourceArn;
    }
    return lambda.addPermission(params).promise();
  },

  invokeFunction: function(input) {
    var lambda = this.findService(input);
    var invocationType= (input.invocationType) ? input.invocationType : "RequestResponse";
    var logType = (input.logType) ? input.logType : "Tail";
    var qualifier= (input.qualifier) ? input.qualifier : "$LATEST";
    var payload = JSON.stringify(input.payload);
    var params = {
      FunctionName: input.functionArn,
      ClientContext: input.clientContext, 
      InvocationType: invocationType, 
      LogType: logType, 
      Payload: payload, 
      Qualifier: qualifier 
    };
    return lambda.invoke(params).promise();
  },
  
  federate: function(input, callback) {
    var lambda = this.findService(input);
    var fedParams = {
      roles: input.roles,
      sessionName: input.sessionName,
      durationSeconds: input.durationSeconds
    }
    var params = {
      FunctionName: input.fedFunctionName,
      //ClientContext: 'STRING_VALUE',
      //InvocationType: 'Event | RequestResponse | DryRun',
      //LogType: 'None | Tail',
      Payload: JSON.stringify(fedParams),
      //Qualifier: 'STRING_VALUE'
    };
    return lambda.invoke(params).promise().then(function(data) {
      credentials = JSON.parse(data.Payload).body.Credentials;
      if (credentials) {
        return new AWS.Credentials({
          accessKeyId: credentials.AccessKeyId,
          secretAccessKey: credentials.SecretAccessKey,
          sessionToken: credentials.SessionToken
        });
      }
      else {
        throw new Error("failed to federate");
      }
    });
  }
}