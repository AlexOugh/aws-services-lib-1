var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSCloudWatchEvents() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {apiVersion: '2015-10-07',region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var cloudwatchevents = new AWS.CloudWatchEvents(params);
    return cloudwatchevents;
  }

  me.listRules = function(input, callback) {

    var params = input.NamePrefix;
    console.log(params);

    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.listRules(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data[0]) {
        console.log("found rules");
        return outputs[0];
      }
      else {
        console.log("ListRules returns None");
        return null;
      }
    }

    self.addParams = function(found) {
      self.params.NamePrefix = found;
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.listRules(params, me.callbackFind);
  }
 
  me.createRule = function(input, callback) {

    var params = {
      Name: input.name,
      Description: input.description,
      EventPattern: input.eventPattern,
      RoleArn: input.roleArn,
   //   ScheduleExpression: 'STRING_VALUE',
      State: input.state  //ENABLED | DISABLED
    };
    console.log(params);

    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.putRule(params, callback);
      return;
    }
    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.putRule(params, me.callback);
  }

  me.createTarget = function(input, callback) {
    
    var params = {
  	Rule: input.ruleName, /* required */
  	Targets: [ /* required */
    	  {
      		Arn: input.topicArn, /* required */
      		Id: input.id /* required */
      	/*	Input: input.inputstring,
      		InputPath: 'STRING_VALUE',
      		InputTransformer: {
        		InputTemplate: 'STRING_VALUE', // required 
   	     		InputPathsMap: {
          			'<InputTransformerPathKey>': 'STRING_VALUE',
          			/// '<InputTransformerPathKey>': ... 
        		}
      		}, */
	  }
  	]
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.putTargets(params, callback);
      return;
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.putTargets(params, me.callback);
  }

  me.deleteRule = function(input, callback) {

    var params = {
      Names:  input.ruleName
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.deleteRule(params, callback);
      return;
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.deleteAlarms(params, me.callback);
  }
}

module.exports = AWSCloudWatchEvents
