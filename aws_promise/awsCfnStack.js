'use strict'

const AWS = require('aws-sdk');

module.exports = {

  findService: function(input) {
    let  params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      let credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    const cfn = new AWS.CloudFormation(params);
    return cfn;
  },

  findStackOutputs: function(input) {
    const cfn = this.findService(input);
    let params = {
        StackName: input.stackName
    };
    return cfn.describeStacks(params).promise();
}

}