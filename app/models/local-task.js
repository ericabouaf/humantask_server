
var util = require('util'),
    Task = require('./task').Task,
    nodemailer = require('nodemailer'),
    querystring = require('querystring');


/**
 * LocalTask
 */
var LocalTask = exports.LocalTask = function(taskToken, config) {
    Task.call(this, taskToken, config);
};

util.inherits(LocalTask, Task);


LocalTask.prototype.save = function(cb) {
   var tt = this.taskToken;
   Task.redisClient.set(tt, JSON.stringify(this.config), function(err) {
      if(err) {
         cb(err);
         return;
      }
      Task.redisClient.rpush("open", tt, cb);
   });
};

   // TODO: when to send notifications ?

             // Send email notification
             /*var input = JSON.parse(activity.input);
             if(input["email-notification"]) {
                sendNotification(input["email-notification"], taskToken, app.config);
             }*/



Task.registerType('local', LocalTask);



/**
 * Send notifications
 */
function sendNotification(notification, taskToken, config) {

   var smtpTransport = nodemailer.createTransport("SMTP", config.mailer_transport);
   
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
         console.log(error);
      } else {
         console.log("HUMANTASK WORKER email notification sent: " + response.message);
      }
      // if you don't want to use this transport object anymore, uncomment following line
      smtpTransport.close(); // shut down the connection pool, no more messages
   });

}




            // TODO: delete task
            // LREM "open" 0 "acti2"
            /*redisClient.lrem('open', 0, req.param('taskToken') , function(err) {
               redisClient.rpush('failed', req.param('taskToken') , function(err) {
                 
                  // TODO:
                  cb();

               });

            });*/



         // Delete the activity from the 'open' list
         /*redisClient.lrem('open', 0, req.param('taskToken') , function(err) {
            if (err) { console.error(err); }

            redisClient.rpush('done', req.param('taskToken') , function(err) {

               if (err) { console.error(err); }
               res.redirect('/finished');

            });
         });*/