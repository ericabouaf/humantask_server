/* Main application entry file. Please note, the order of loading is important.
 * Configuration loading and booting of controllers and custom error handlers */

var express = require('express'),
    fs = require('fs'),
    mu = require('mu2'),
    fs = require('fs'),
    ejs = require('ejs'),
    querystring = require('querystring'),
    expressLayouts = require('express-ejs-layouts'),
    swf = require('aws-swf'),
    redis = require("redis"),
    nodemailer = require('nodemailer');


var redisClient = redis.createClient();

var app = express();

// Load configurations
app.config = require('./config.js');

app.configure(function(){
   app.use(express.static(__dirname + '/public'));
   app.set('views', __dirname + '/app/views');
   app.set('view engine', 'ejs');
   app.set('layout', 'layout'); // defaults to 'layout'     
   app.use(expressLayouts);
   app.use(express.bodyParser());
});



// Get the task from redis
function taskFromToken(req, res, next) {

   redisClient.get( req.param('taskToken') , function(err, reply) {

      if(!!err || reply === null) {
         res.render('error', { 
            locals: { 
               error: err,
               taskToken: ""
            } 
         });
         return;
      }

      req.task = JSON.parse(reply);

      next();

   });

}




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





/**
 * Task finished
 */
app.get('/finished', function(req, res) {
   res.render('finished', { 
      locals: { 
         taskToken: ""
      }
   });
});


/**
 * Display an activity
 */
app.get('/activity/:taskToken', taskFromToken, function(req, res) {
  
   if(!req.task) {
      res.render('unavailable', { 
         locals: { 
            taskToken: ""
         }
      });
      return;
   }

   // TODO: check if task has not timed-out (should be "STARTED")
  
   var activityTask = req.task;
   var input = JSON.parse(activityTask.input);
     
   if(input.template) {
      
      var stream = mu.renderText(input.template, input, {});

      var str = "";
      stream.on('data', function(data) { str += data; });
      stream.on('end', function() {
         fs.readFile(__dirname+'/app/views/layout.ejs', 'utf-8', function(error, content) {
            res.set('Content-Type', 'text/html');
            var body = ejs.render(content, {
               body: str,
               taskToken: querystring.escape(activityTask.taskToken)
            });
            res.send(body);
         });
      });
        
   }
   else {
      // Render the default task view
      res.render('defaultTaskView', {
         locals: { 
            taskToken: querystring.escape(activityTask.taskToken), 
            activityTask: activityTask
         } 
      });
   }   
  
});


/**
 * Webservices to complete or fail an activity task
 */
app.post('/:taskToken/completed', taskFromToken, function(req, res){
  
   var activityTask = req.task;
     
   // send a RespondActivityTaskCompleted
   //var svc = new AWS.SimpleWorkflow();
   var svc = swf.createClient();

   svc.client.respondActivityTaskCompleted({
      "taskToken": req.param('taskToken'),
      "result": JSON.stringify( req.body )
   }, function (awsErr, result) {

      if(awsErr) {
         console.log("respondActivityTaskCompleted failed : ", awsErr);
         console.log("respondActivityTaskCompleted failed : ", JSON.stringify( req.body ));

         // TODO: delete task
         redisClient.del( req.param('taskToken') , function(err) {
           
            res.render('error', { 
               locals: { 
                  error: awsErr,
                  activityTask: null,
                  taskToken: "no"
               } 
            });
         });
        
         return;
      }
        
      // Delete the activity
      redisClient.del( req.param('taskToken') , function(err) {
         if (err) { console.error(err); }
         res.redirect('/finished');
      });
        
   });
});

app.post('/:taskToken/canceled', taskFromToken, function(req, res){
   // TODO: send a RespondActivityTaskCanceled
   // TODO: delete the activity
   res.send('Hello World');
});

app.post('/:taskToken/failed', taskFromToken, function(req, res){
   // TODO: send a RespondActivityTaskFailed
   // TODO: delete the activity
   res.send('Hello World');
});



// store the activity
// TODO: validations
// TODO: error handling
// TODO: basic auth
app.post('/activity', function(req, res){

   var taskToken = req.param('taskToken');
   var activity = req.param('activity');

   console.log(taskToken);

   redisClient.set(taskToken, JSON.stringify(activity) );


   // Send email notification
   var input = JSON.parse(activity.input);
   if(input["email-notification"]) {
      sendNotification(input["email-notification"], taskToken, app.config);
   }

   res.send('OK !');
});


// start the server
app.listen(app.config.server.port, app.config.server.ip);

console.log("App started in '"+app.set('env')+"' environment !\n" +
            "Listening on http://"+app.config.server.host+":"+app.config.server.port);
