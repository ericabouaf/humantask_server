


var sqs = new AWS.SQS();
sqs.getQueueAttributes(params, function (err, data) {
  if (err) {
    console.log(err); // an error occurred
  } else {
    console.log(data); // successful response
  }
});


