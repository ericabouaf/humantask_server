
var nodemailer = require('nodemailer'),
	querystring = require('querystring');



exports.controller = function(app) {




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




	// store the activity
	// TODO: validations
	// TODO: error handling
	// TODO: basic auth
	app.post('/activity', function(req, res){

	   var taskToken = req.param('taskToken');
	   var activity = req.param('activity');

	   console.log("New task !");

	   app.redisClient.set(taskToken, JSON.stringify(activity), function(err, results) {

	      app.redisClient.rpush("open", taskToken, function(err, results) {      

	         // Send email notification
	         var input = JSON.parse(activity.input);
	         if(input["email-notification"]) {
	            sendNotification(input["email-notification"], taskToken, app.config);
	         }

	         res.send('OK !');

	      });

	   });

	});


};