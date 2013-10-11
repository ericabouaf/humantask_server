

var nodemailer = require('nodemailer'),
    querystring = require('querystring');


var smtpTransport, _redisClient;


module.exports = {

    createTask: function (taskToken, config, cb) {

      _redisClient.set(taskToken, JSON.stringify(config), function(err) {
      
         if(err) { cb(err); return; }

         _redisClient.rpush("open", taskToken, cb);

         if(config.emailNotification) {
            sendNotification(config.emailNotification, taskToken, moduleConfig);
         }
      });
       
   },


    start: function(app, redisClient, swfClient, moduleConfig) {

      _redisClient = redisClient;

      smtpTransport = nodemailer.createTransport("SMTP", moduleConfig.mailer_transport);

      require('./http-server')(app, redisClient, swfClient, moduleConfig);

    }


};



/**
 * Send notifications
 */
function sendNotification(notification, taskToken, config) {

   var mailOptions = {

      from: notification.from || config.mailer_transport.auth.email,
      to: notification.to,
      subject: notification.subject,


      text: "Hello world",
      html: "New task : <a href='http://" + config.server.host + ":" + config.server.port + "/localtask/activity/"+querystring.escape(taskToken)+"'>Click here to do the task !</a>"
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



