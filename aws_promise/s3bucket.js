
var AWS = require('aws-sdk');

module.exports = {

  findService: function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3(params);
    return s3;
  },

  findBucket: function(input) {
    var s3 = this.findService(input);
    return s3.listBuckets().promise().then(data => {
      var buckets = data.Buckets.filter(bucket => bucket.Name == input.bucketName);
      if (buckets.length > 0) return buckets[0];
      else return null;
    });
  },
  // { Buckets:
  //     [ { Name: '290093585298.alextest1',
  //         CreationDate: Wed Jul 08 2015 10:41:42 GMT-0400 (EDT) },
  //       {  } ],
  //    Owner:
  //     { DisplayName: 'AS.US.AWScto+sasi12',
  //       ID: 'a2199891147e2e5908faf16dc092ba87bc022402976a5afc30449f1ab9835593' }
  //  }

  createBucket: function(input) {
    return this.findBucket(input).then(bucket => {
      if (bucket) return Promise.resolve();
      else {
        var s3 = this.findService(input);
        params = { Bucket: input.bucketName };
        return s3.createBucket(params).promise();
      }
    });
  },

  getObject: function(input) {
    var s3 = this.findService(input);
    var params = {
      Bucket: input.bucket,
      Key: input.key
    };
    return s3.getObject(params).promise();
  },

  putObject: function(input) {
    var s3 = this.findService(input);
    //if (!input.sourceFolder || !input.src) {
    //  console.log('no change in the zip file, so just return');
    //  return null;
    //}
    // read a zip file
    var fs = require("fs");
    var data = '';
    if (input.zipFile) {
      data = fs.readFileSync(input.zipFile);
    }
    if (input.data) {
      data = input.data;
    }
    console.log(data);
    var params = {
      Bucket: input.bucketName,
      Key: input.keyName,
      Body: data,
    };
    if (input.acl) {
      params.ACL = input.acl;
    }
    return s3.putObject(params).promise();
  },

  addBucketPolicy: function(input) {
    var s3 = this.findService(input);
    var policy = {
        "Id": "PolicyID-"+input.uid+"",
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": input.account,
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                "Effect": "Allow",
                "Resource": "arn:aws:s3:::"+input.bucketName+"/*",
                "Principal": {
                    "AWS": input.account
                }
            }
        ]
    };

    if (! input.policy ) input.policy = JSON.stringify(policy);
    var params = {
      Bucket: input.bucket,
      Policy: input.policy
    };
    return s3.putBucketPolicy(params).promise();
  },

  getBucketPolicy: function(input) {
    var s3 = this.findService(input);
    var params = {
      Bucket: input.bucket
    }
    return s3.getBucketPolicy(params).promise();
  },

  getBucketNotificationConfiguration: function(input) {
    var s3 = this.findService(input);
    var params = {
      Bucket: input.bucket
    };
    return s3.getBucketNotificationConfiguration(params).promise();
  },

  addNotification: function(input) {
    var s3 = this.findService(input);
    var topicConfigurations = [];
    var params = {
      Bucket: input.bucket
    };
    if ( input.lambdafunctionArn ) {
    	var lambdaFunctionConfigurations = [
		{
                    Events: [input.event],
                    LambdaFunctionArn: input.lambdafunctionArn,
                    Filter: {
                        Key: {
                            FilterRules: [
                                { Name: 'Prefix', Value: input.prefix},
                                { Name: 'Suffix', Value: input.suffix}
                            ]
                        }
                    },
                    Id: input.uid
                }
        ];
	params.NotificationConfiguration = {LambdaFunctionConfigurations: lambdaFunctionConfigurations};
    }
    if ( input.topicArn ) {
    	var topicConfigurations = [
		{
                    Events: [input.event],
                    TopicArn: input.topicArn,
                    Filter: {
                        Key: {
                            FilterRules: [
                                { Name: 'Prefix', Value: input.prefix},
                                { Name: 'Suffix', Value: input.suffix}
                            ]
                        }
                    },
                    Id: input.uid
                }
        ];
	params.NotificationConfiguration = {TopicConfigurations: topicConfigurations};
    }
    return s3.putBucketNotificationConfiguration(params).promise();
  },

  uploadObject: function(input) {
    var s3 = this.findService(input);
    var params = {
      Bucket: input.bucket,
      Key: input.fileName,
      Body: input.fileContent
    };
    return s3.upload(params).promise();
  }
}
