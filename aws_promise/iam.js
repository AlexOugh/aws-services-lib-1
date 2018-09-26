'use strict';

const AWS = require('aws-sdk');

module.exports = {
  findService(input) {
    let iam;
    if (input.creds) {
      const params = { credentials: input.creds };
      iam = new AWS.IAM(params);
    } else iam = new AWS.IAM();
    return iam;
  },

  addInlineRolePolicy(input) {
    const iam = this.findService(input);
    let params;

    if (input.policyDocument == 'undefined' || input.policyDocument == null) {
      const policy = {
        Version: '2012-10-17',
        Statement: {
          Effect: 'Allow',
          Resource: input.bucketArn,
          Action: ['s3:PutObject', 's3:GetObject']
        }
      };

      params = {
        PolicyName: `S3AccessPolicy-${input.account}`,
        RoleName: input.roleName,
        PolicyDocument: JSON.stringify(policy)
      };
    } else {
      params = {
        PolicyName: `${input.roleName}Policy`,
        RoleName: input.roleName,
        PolicyDocument: JSON.stringify(input.policyDocument)
      };
    }
    return iam.putRolePolicy(params).promise();
  }
};
