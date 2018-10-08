
var stack = new (require('./aws/stack.js'))();

function StackBuilder() {

  var me = this;

  function succeeded(input) {
    input.callback(null, true);
  }

  function failed(input) {
    input.callback(null, false);
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
        console.log("#### error in waitForCompleteAfterDelete : " + err);
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
        if (input.nowait) return succeeded(input);
        else stack.waitForComplete(input);
      }
    });
  }

  function isCreateSucceeded(input) {
    if (input.status == "CREATE_COMPLETE" || input.status == "UPDATE_COMPLETE")  succeeded(input);
    else failed(input);
  }

  function isDeleteSucceeded(input) {
    if (input.status == "DELETE_COMPLETE")  succeeded(input);
    else failed(input);
  }

  me.launch = function(input, callback) {

    function errored(err) {
      input.callback(err, null);
    }

    function defaultCallback(err, data) {
      if(err) console.log(err);
      else console.log(data);
    }

    if(callback)  input.callback = callback;
    else input.callback = defaultCallback;

    var flows = [
      {func:stack.findStack, success:waitForCompleteBeforeCreate, failure:stack.createStack, error:errored},
      {func:waitForCompleteBeforeCreate, success:null, failure:null, error:errored},
      {func:stack.deleteStack, success:waitForCompleteAfterDelete, failure:failed, error:errored},
      {func:waitForCompleteAfterDelete, success:null, failure:null, error:errored},
      {func:updateStack, success:null, failure:null, error:errored}
    ];
    if (input.nowait) {
      flows.push({func:stack.createStack, success:succeeded, failure:failed, error:errored});
    }
    else {
      flows.push({func:stack.createStack, success:stack.waitForComplete, failure:failed, error:errored});
      flows.push({func:stack.waitForComplete, success:isCreateSucceeded, failure:failed, error:errored});
    }
    stack.flows = flows;

    flows[0].func(input);
  }

  me.update = function(input, callback) {

    function errored(err) {
      input.callback(err, null);
    }

    function defaultCallback(err, data) {
      if(err) console.log(err);
      else console.log(data);
    }

    if(callback)  input.callback = callback;
    else input.callback = defaultCallback;

    var flows = [
      {func:stack.findStack, success:stack.updateStack, failure:failed, error:errored},
    ];
    if (input.nowait) {
      flows.push({func:stack.updateStack, success:succeeded, failure:failed, error:errored});
    }
    else {
      flows.push({func:stack.updateStack, success:stack.waitForComplete, failure:failed, error:errored});
      flows.push({func:stack.waitForComplete, success:isCreateSucceeded, failure:failed, error:errored});
    }
    stack.flows = flows;

    flows[0].func(input);
  }

  me.drop = function(input, callback) {

    function errored(err) {
      input.callback(err, null);
    }

    function defaultCallback(err, data) {
      if(err) console.log(err);
      else console.log(data);
    }

    if(callback)  input.callback = callback;
    else input.callback = defaultCallback;

    var flows = [
      {func:stack.findStack, success:stack.deleteStack, failure:succeeded, error:errored},
    ];
    if (input.nowait) {
      flows.push({func:stack.deleteStack, success:succeeded, failure:failed, error:errored});
    }
    else {
      flows.push({func:stack.deleteStack, success:stack.waitForComplete, failure:failed, error:errored});
      flows.push({func:stack.waitForComplete, success:isDeleteSucceeded, failure:failed, error:errored});
    }
    stack.flows = flows;

    flows[0].func(input);
  }

  me.waitForlaunch = function(input, callback) {

    function errored(err) {
      input.callback(err, null);
    }

    function defaultCallback(err, data) {
      if(err) console.log(err);
      else console.log(data);
    }

    if(callback)  input.callback = callback;
    else input.callback = defaultCallback;

    var flows = [
      {func:stack.waitForComplete, success:isCreateSucceeded, failure:failed, error:errored}
    ];
    stack.flows = flows;

    flows[0].func(input);
  }

  me.waitForupdate = me.waitForlaunch;

  me.waitFordrop = function(input, callback) {

    function errored(err) {
      input.callback(err, null);
    }

    function defaultCallback(err, data) {
      if(err) console.log(err);
      else console.log(data);
    }

    if(callback)  input.callback = callback;
    else input.callback = defaultCallback;

    var flows = [
      {func:stack.waitForComplete, success:isDeleteSucceeded, failure:succeeded, error:errored}
    ];
    stack.flows = flows;

    flows[0].func(input);
  }
}

module.exports = StackBuilder
