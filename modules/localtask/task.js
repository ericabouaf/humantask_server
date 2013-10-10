
var util = require('util'),
    Task = require('./task').Task,
    config = require(__dirname + '/../../config.js'),
    nodemailer = require('nodemailer'),
    querystring = require('querystring');

var smtpTransport = nodemailer.createTransport("SMTP", config.mailer_transport);

/**
 * LocalTask
 */
var LocalTask = exports.LocalTask = function(taskToken, config) {
    Task.call(this, taskToken, config);
};

util.inherits(LocalTask, Task);


LocalTask.prototype.save = function(cb) {
   var tt = this.taskToken;
   var that = this;
   Task.redisClient.set(tt, JSON.stringify(this.config), function(err) {
      if(err) {
         cb(err);
         return;
      }
      Task.redisClient.rpush("open", tt, cb);

      if(that.config.emailNotification) {
        sendNotification(that.config.emailNotification, tt, config);
      }

   });
};


// Delete the activity from the 'open' list
LocalTask.prototype.removeFromOpen = function(cb) {
  var tt = this.taskToken;
  Task.redisClient.lrem('open', 0, tt, function(err) {
      if (err) { cb(err); return; }
      Task.redisClient.rpush('done', tt , cb);
  });
};


Task.registerType('local', LocalTask);


/**
 * Send notifications
 */
function sendNotification(notification, taskToken, config) {

   var mailOptions = {

      from: notification.from || config.mailer_transport.auth.email,
      to: notification.to,
      subject: notification.subject,


      text: "Hello world",
      html: "New task : <a href='http://" + config.server.host + ":" + config.server.port + "/activity/"+querystring.escape(taskToken)+"'>Click here to do the task !</a>"
   };
   
   // send mail with defined transport object
   smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
        console.log("Unable to send notification !");
        console.log(error);
      } else {
        console.log("HUMANTASK WORKER email notification sent: " + response.message);
      }
   });

}

