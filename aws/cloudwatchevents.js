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

    var params = {}
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

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.listRules(params, me.callbackFind);
  }
 
  me.listTargetsByRule = function(input, callback) {

    var params = {
	Rule: input.ruleName
    }
    console.log(params);

    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.listTargetsByRule(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data[0]) {
        console.log("found targets for rule");
        return outputs[0];
      }
      else {
        console.log("No targets found.");
        return null;
      }
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.listTargetsByRule(params, me.callbackFind);
  }

  me.listRuleNamesByTarget = function(input, callback) {

    var params = {
	TargetArn: input.targetArn
    }
    console.log(params);

    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.listRuleNamesByTarget(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data[0]) {
        console.log("found rule for target");
        return outputs[0];
      }
      else {
        console.log("No rule found.");
        return null;
      }
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.listRuleNamesByTarget(params, me.callbackFind);
  }

  me.createRule = function(input, callback) {

    var params = {
      Name: input.ruleName,
      Description: input.ruleDescription,
      EventPattern: input.eventPattern,
      RoleArn: input.roleArn,
   //   ScheduleExpression: 'STRING_VALUE',
      State: input.ruleState  //ENABLED | DISABLED
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
      		Id: input.targetId /* required */
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
    cloudwatchevents.deleteRule(params, me.callback);
  }

  me.removeTargets = function(input, callback) {

    var params = {
      Ids: [ input.targetId ],
      Rule: input.ruleName
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.removeTargets(params, callback);
      return;
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.removeTargets(params, me.callback);
  }
  
  me.describeRule = function(input, callback) {

    var params = {
      Name: input.ruleName
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.describeRule(params, callback);
      return;
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.describeRule(params, me.callback);
  }

  me.createEvent = function(input, callback) {

    var params = {
      Entries: [ input.eventEntries /* required */
 /*      {
        Detail: 'STRING_VALUE',
        DetailType: 'STRING_VALUE',
        Resources: [
         'STRING_VALUE',
        ],
        Source: 'STRING_VALUE',
        Time: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789
       } */
      ]
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchevents = me.findService(input);
      cloudwatchevents.putEvents(params, callback);
      return;
    }

    var cloudwatchevents = me.preRun(self, input);
    cloudwatchevents.putEvents(params, me.callback);
  }

}

module.exports = AWSCloudWatchEvents
