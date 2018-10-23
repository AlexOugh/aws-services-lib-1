
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');

function GMail() {

  var google = require('googleapis');
  var googleAuth = require('google-auth-library');

  var SCOPES = ['https://mail.google.com/'];

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {}

  me.authorize = function(input, main_function, callback) {

    /*
    var input = {
      region: region,
      clientId: '',
      clientSecret: '',
      redirectUrl: '',
      token: {},
      labelId: 'INBOX',
      userId: 'me',
      queryForMessageList: 'is:unread',
      messages: [],
      labelsToAdd: [],
      labelsToRemove: ['UNREAD'],
      tableName: 'alarmalerts',
      item: null
    };
    */

    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(input.clientId, input.clientSecret, input.redirectUrl);
    oauth2Client.credentials = input.token;
    input.auth = oauth2Client;
    main_function(input, callback);
  }

  me.listLabels = function(input, callback) {
    me.preRun(arguments.callee, input);
    me.authorize(input, _listLabels, callback);
  }

  function _listLabels(input, callback) {

    var params = {
      auth: input.auth,
      userId: input.userId,
    };
    var self = me.listLabels;

    var gmail = google.gmail('v1');
    if (callback) {
      gmail.users.messages.list(params, callback);
      return;
    }

    self.callbackFind = function(response) {
      if (response.labels.length == 0) {
        console.log('No labels found.');
        return null;
      }
      else {
        console.log('Labels:');
        for (var i = 0; i < response.labels.length; i++) {
          var label = response.labels[i];
          //console.log('- %s', label.name);
          console.log('%s', JSON.stringify(label));
        }
        return response.labels;
      }
    }

    self.addParams = function(found) {
      self.params.labels = found;
    }

    gmail.users.labels.list(params, me.callbackFind);
  }

  me.listMessages = function(input, callback) {
    me.preRun(arguments.callee, input);
    me.authorize(input, _listMessages, callback);
  }

  function _listMessages(input, callback) {

    var params = {
      auth: input.auth,
      userId: input.userId,
      labelIds: input.labelId,
    };
    if (input.queryForMessageList != null)  params.q = input.queryForMessageList;
    var self = me.listMessages;

    var gmail = google.gmail('v1');
    if (callback) {
      gmail.users.messages.list(params, callback);
      return;
    }

    self.callbackFind = function(response) {
      var messages = response.messages;
      if (messages == null || messages.length == 0) {
        console.log('No messages found.');
        return null;
      }
      else {
        console.log(messages.length + " messages found");
        console.log('Messages:');
        for (var i = 0; i < messages.length; i++) {
          console.log(JSON.stringify(messages[i]));
        }
        return messages;
      }
    }

    self.addParams = function(found) {
      self.params.messages = found;
    }

    gmail.users.messages.list(params, me.callbackFind);
  }

  me.getMessage = function(input, callback) {
    me.preRun(arguments.callee, input);
    me.authorize(input, _getMessage, callback);
  }

  function _getMessage(input, callback) {

    var params = {
      auth: input.auth,
      userId: input.userId,
      id: input.currentMessage.id,
    };
    var self = me.getMessage;

    var gmail = google.gmail('v1');
    if (callback) {
      gmail.users.messages.get(params, callback);
      return;
    }

    self.addParams = function(response) {
      var date = response.payload.headers.filter(function(header){ return header.name=='Date';})[0].value
      console.log(date);
      var decoded = new Buffer(response.payload.body.data, 'base64').toString('ascii');
      response.payload.body.data = decoded;
      console.log(response);
      self.params.currentMessage = response;
    }

    gmail.users.messages.get(params, me.callback);
  }
  /* { id: '14ef4ff9733bf509',
  threadId: '14ef4ff9733bf509',
  labelIds: [ 'INBOX', 'IMPORTANT', 'CATEGORY_UPDATES' ],
  snippet: 'You are receiving this email because your Amazon CloudWatch Alarm &quot;',
  historyId: '4068',
  internalDate: '1438629467000',
  payload:
   { partId: '',
     mimeType: 'text/plain',
     filename: '',
     headers:
     [ { name: 'Delivered-To', value: 'cto.sungardas@gmail.com' },
       { name: 'Received',
         value: 'by 10.13.255.66 with SMTP id p63csp1738170ywf;        Mon, 3 Aug 2015 12:17:47 -0700 (PDT)' },
       { name: 'X-Received',
         value: 'by 10.140.238.83 with SMTP id j80mr28805782qhc.68.1438629467740;        Mon, 03 Aug 2015 12:17:47 -0700 (PDT)' },
       { name: 'Return-Path',
         value: '<0000014ef4ff93e9-9443c3e0-0dcc-469a-95bc-7ac8a3d30487-000000@amazonses.com>' },
       { name: 'Received',
         value: 'from a10-69.smtp-out.amazonses.com (a10-69.smtp-out.amazonses.com. [54.240.10.69])        by mx.google.com with ESMTPS id z17si17844244qhd.109.2015.08.03.12.17.47        for <cto.sungardas@gmail.com>        (version=TLSv1 cipher=ECDHE-RSA-RC4-SHA bits=128/128);        Mon, 03 Aug 2015 12:17:47 -0700 (PDT)' },
       { name: 'Received-SPF',
         value: 'pass (google.com: domain of 0000014ef4ff93e9-9443c3e0-0dcc-469a-95bc-7ac8a3d30487-000000@amazonses.com designates 54.240.10.69 as permitted sender) client-ip=54.240.10.69;' },
       { name: 'Authentication-Results',
         value: 'mx.google.com;       spf=pass (google.com: domain of 0000014ef4ff93e9-9443c3e0-0dcc-469a-95bc-7ac8a3d30487-000000@amazonses.com designates 54.240.10.69 as permitted sender) smtp.mail=0000014ef4ff93e9-9443c3e0-0dcc-469a-95bc-7ac8a3d30487-000000@amazonses.com;       dkim=pass header.i=@amazonses.com;       dkim=pass header.i=@sns.amazonaws.com' },
       { name: 'DKIM-Signature',
         value: 'v=1; a=rsa-sha256; q=dns/txt; c=relaxed/simple; s=ug7nbtf4gccmlpwj322ax3p6ow6yfsug; d=amazonses.com; t=1438629467; h=Date:From:To:Message-ID:Subject:MIME-Version:Content-Type:Content-Transfer-Encoding:Feedback-ID; bh=oX/rIko2sMQdGBewrJ1i4bzZZO0KVr+St8KQWQSH1eQ=; b=Z/j2ZHQMxdMEccYytnKV4mSb+N2Q9BG4eJlTR2rPMaBdtqDgR7aV2ZK1FfV1rClM 24uKNY4xucA81Ku/12ihpd/Vx/b7iDr1ZGYldN4Ba8fcvxjQmV3j2HTWD2VbaXoIuTq Mdi5vDNoVu50ttFcFHrkMRfpkRjaK+GzaPjdsKG0=' },
       { name: 'DKIM-Signature',
         value: 'v=1; a=rsa-sha256; q=dns/txt; c=relaxed/simple; s=nphhk4jzf3x47mony5kkk43xmwpeh5gx; d=sns.amazonaws.com; t=1438629467; h=Date:From:To:Message-ID:Subject:MIME-Version:Content-Type:Content-Transfer-Encoding; bh=oX/rIko2sMQdGBewrJ1i4bzZZO0KVr+St8KQWQSH1eQ=; b=QQ60fKXsPWgJ1/p1t82UlWR5oJuomge/hm9XC8Spc8sIS69/iCW355NCNXdIzE7a bTdehqxuc/SFyqlbQ6XL/Q8dpBMfFoaJ/A9u4eDdKIXDtF3fIU9xGDftte1Nlr7A9N2 o7njuE+fyYEwcn3iR+nToPGPo/osy+6HZLesTUwA=' },
       { name: 'Date', value: 'Mon, 3 Aug 2015 19:17:47 +0000' },
       { name: 'From',
         value: 'AWS Notifications <no-reply@sns.amazonaws.com>' },
       { name: 'To', value: 'cto.sungardas@gmail.com' },
       { name: 'Message-ID',
         value: '<0000014ef4ff93e9-9443c3e0-0dcc-469a-95bc-7ac8a3d30487-000000@email.amazonses.com>' },
       { name: 'Subject',
         value: 'ALARM: "OverIncreasedPercentagesSimAlarm" in US - N. Virginia' },
       { name: 'MIME-Version', value: '1.0' },
       { name: 'Content-Type', value: 'text/plain; charset=UTF-8' },
       { name: 'Content-Transfer-Encoding', value: '7bit' },
       { name: 'x-amz-sns-message-id',
         value: '93138681-7350-52f8-a434-c8b8b3cb71c6' },
       { name: 'x-amz-sns-subscription-arn',
         value: 'arn:aws:sns:us-east-1:290093585298:OverIncreasedPercentagesSimTopic:6ad31130-3ff7-4f99-962f-1e829b706a1d' },
       { name: 'X-SES-Outgoing', value: '2015.08.03-54.240.10.69' },
       { name: 'Feedback-ID',
         value: '1.us-east-1.rLk2FYYR7ms1BvCiYXCIqXvY3U/J1vVW0G3YrYLy0pk=:AmazonSES' }
      ],
      body:
      { size: 1868,
        data: 'WW91IGFyZSByZWNlaXZpbmcgdG....' }
    },
    sizeEstimate: 4747 }*/

  me.changeLabel = function(input, callback) {
    me.preRun(arguments.callee, input);
    me.authorize(input, _changeLabel, callback);
  }

  function _changeLabel(input, callback) {

    var params = {
      auth: input.auth,
      userId: input.userId,
      id: input.currentMessage.id,
      resource: {
        addLabelIds: input.labelsToAdd,
        removeLabelIds: input.labelsToRemove
      }
    };
    console.log(params);
    var self = me.changeLabel;

    var gmail = google.gmail('v1');
    if (callback) {
      gmail.users.messages.modify(params, callback);
      return;
    }

    gmail.users.messages.modify(params, me.callback);
  }

}

module.exports = GMail
