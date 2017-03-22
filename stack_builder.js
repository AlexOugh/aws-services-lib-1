
var stack = new (require('./aws/stack.js'))();

function StackBuilder() {

  this.callback = callback;

  var me = this;

  function succeeded(input) {
    me.callback(null, true);
  }

  function failed(input) {
    me.callback(null, false);
  }

  function errored(err) {
    me.callback(err, null);
  }

  function callback(err, data) {
    if(err) console.log(err);
    else console.log(data);
  }

  function deleteStack(input) {
    stack.deleteStack(input, function(err, data) {
      if (err)  callback(err);
      else {
        stack.waitForComplete(input, function(err, data) {
          if (err)  callback(err);
          else callback(null, data);
        })
      }
    });
  }


  function waitForCompleteBeforeCreate(input) {
    stack.waitForComplete(input, function(err, data) {
      if (err) {
        stack.createStack(input);
      }
      else {
        if (input.status == "ROLLBACK_FAILED" || input.status == "ROLLBACK_COMPLETE") {
          stack.deleteStack(input);
        }
        else {
          updateStack(input);
        }
      }
    });
  }

  function waitForCompleteAfterDelete(input) {
    stack.waitForComplete(input, function(err, data) {
      if (err) {
        stack.createStack(input);
      }
      else {
        failed(input);
      }
    });
  }

  function updateStack(input) {
    stack.updateStack(input, function(err, data) {
      if (err) {
        console.log("error in update : " + err);
        if (err.toString().indexOf("No updates are to be performed.") >= 0) {
          console.log("no update is necessary, so just return true");
          succeeded(input);
        }
        else failed(input);
      }
      else {
        stack.waitForComplete(input);
      }
    });
  }

  function isCreateSucceeded(input) {
    if (input.status == "CREATE_COMPLETE" || input.status == "UPDATE_COMPLETE")  succeeded(input);
    failed(input);
  }

  function isDeleteSucceeded(input) {
    if (input.status == "DELETE_COMPLETE")  succeeded(input);
    failed(input);
  }

  me.launch = function(input, callback) {

    if(callback)  me.callback = callback;

    var flows = [
      {func:stack.findStack, success:waitForCompleteBeforeCreate, failure:stack.createStack, error:errored},
      {func:waitForCompleteBeforeCreate, success:null, failure:null, error:errored},
      {func:stack.deleteStack, success:waitForCompleteAfterDelete, failure:failed, error:errored},
      {func:waitForCompleteAfterDelete, success:null, failure:null, error:errored},
      {func:updateStack, success:null, failure:null, error:errored},
      {func:stack.createStack, success:stack.waitForComplete, failure:failed, error:errored},
      {func:stack.waitForComplete, success:isCreateSucceeded, failure:failed, error:errored},
    ];
    stack.flows = flows;

    flows[0].func(input);
  }

  me.update = function(input, callback) {

    if(callback)  me.callback = callback;

    var flows = [
      {func:stack.findStack, success:stack.updateStack, failure:failed, error:errored},
      {func:stack.updateStack, success:stack.waitForComplete, failure:failed, error:errored},
      {func:stack.waitForComplete, success:isUpdateSucceeded, failure:succeeded, error:errored},
    ];
    stack.flows = flows;

    flows[0].func(input);
  }

  me.drop = function(input, callback) {

    if(callback)  me.callback = callback;

    var flows = [
      {func:stack.findStack, success:stack.deleteStack, failure:succeeded, error:errored},
      {func:stack.deleteStack, success:stack.waitForComplete, failure:failed, error:errored},
      {func:stack.waitForComplete, success:isDeleteSucceeded, failure:succeeded, error:errored},
    ];
    stack.flows = flows;

    flows[0].func(input);
  }
}

module.exports = StackBuilder
