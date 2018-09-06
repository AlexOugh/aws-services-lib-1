'use strict'

var AWS = require('aws-sdk');

module.exports = {

  findService: function(input) {
    let iam;
    if (input.creds) {
      let params = {credentials:input.creds};
      iam = new AWS.IAM(params);
    }
    else
      iam = new AWS.IAM();
    return iam;
  },

  addInlineRolePolicy: function(input) {
    let iam  = this.findService(input);
    if (typeof input.policyDocument === 'undefined' || input.policyDocument === null) {
    let policy = {
          Version: "2012-10-17",
          Statement:{
              Effect: "Allow",
              Resource: input.bucketArn,
              Action: [
                  "s3:PutObject",
                  "s3:GetObject"
              ]
          }
      }
    
      let params = {
          PolicyName: "S3AccessPolicy-"+ input.account,
          RoleName: input.roleName,
          PolicyDocument: JSON.stringify(policy)
      };
    } 
    else {
      let params = {
          PolicyName: input.roleName+"Policy",
          RoleName: input.roleName,
          PolicyDocument: JSON.stringify(input.policyDocument)
      };
    }
    return iam.putRolePolicy(params).promise();
}
}
