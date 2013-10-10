var mu = require('mu2'),
    fs = require('fs'),
    ejs = require('ejs'),
    winston = require('winston'),
    querystring = require('querystring'),
    Task = require('../models/task').Task,
    LocalTask = require('../models/local-task').LocalTask,
    MturkTask = require('../models/mturk-task').MturkTask;

var winston_prefix = "[HTTP Server]";

exports.controller = function(app) {


   // Get the task from redis
   function taskFromToken(req, res, next) {

      Task.find( req.param('taskToken') , function(err, task) {

         if(!!err || task === null) {
            res.render('error', { 
               locals: { 
                  error: err,
                  taskToken: ""
               } 
            });
            return;
         }

         req.task = task;

         next();

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


   function display_activity(req, res, layout) {
     
      if(!req.task) {
         res.render('unavailable', { 
            locals: { 
               taskToken: ""
            }
         });
         return;
      }  
      
      var input = req.task.config;
        
      if(input.template) {
         
         var stream = mu.renderText(input.template, input, {});

         var str = "";
         stream.on('data', function(data) { str += data; });
         stream.on('end', function() {
            fs.readFile(__dirname+'/../views/'+layout, 'utf-8', function(error, content) {
               res.set('Content-Type', 'text/html');
               var body = ejs.render(content, {
                  body: str,
                  taskToken: querystring.escape(req.task.taskToken)
               });
               res.send(body);
            });
         });
           
      }
      else {
         // Render the default task view
         res.render('defaultTaskView', {
            locals: { 
               taskToken: querystring.escape(req.task.taskToken), 
               activityTask: req.task
            } 
         });
      }   
     
   }

   app.get('/activity/:taskToken', taskFromToken, function(req, res) {
      display_activity(req, res, 'layout.ejs');
   });
   app.get('/mturk/:taskToken', taskFromToken, function(req, res) {
      display_activity(req, res, 'mturk_layout.ejs');
   });


   /**
    * Webservices to complete a local task
    */
   app.post('/:taskToken/completed', taskFromToken, function(req, res){
      
      winston.info(winston_prefix, "Got task. Sending results to SWF...");

      req.task.respondCompleted(req.body, function(err) {

         if(err) {

            winston.error(winston_prefix, "SWF respondCompleted failed");
            winston.error(winston_prefix, err);

            res.render('error', { 
               locals: { 
                  error: err,
                  activityTask: null,
                  taskToken: "no"
               } 
            });

            // mark local task as done !
            req.task.removeFromOpen(function(err) {
                if(err) {
                  winston.error(winston_prefix, "Unable to mark task as done !");
                  winston.error(winston_prefix, err);
                  return;
                }
                winston.info(winston_prefix, "Task marked as done !");
             });

            return;
         }

         winston.info(winston_prefix, "Results sent to SWF ! Marking local task as done...");

         // mark local task as done !
         req.task.removeFromOpen(function(err) {
              if(err) {
                winston.error(winston_prefix, "Unable to mark task as done !");
                winston.error(winston_prefix, err);
                return;
              }
              winston.info(winston_prefix, "Task marked as done !");
         });

         res.redirect('/finished');

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



   app.get('/', function(req, res) {

      Task.list(25, function(err, results) {
         var r = results.length + " results<br /><br />";
         results.forEach(function(key) {
            r += '<a href="/activity/'+querystring.escape(key)+'">'+key+'</a><br />';
         });

         res.send(r);

      });


   });



};
















var swf = require('aws-swf'),
   redis = require('redis');


var redisClient = redis.createClient(),
    svc = swf.createClient();


/**
 * Abstract Task
 * @constructor
 */
var Task = exports.Task = function(taskToken, config) {
   this.taskToken = taskToken;
   this.config = config;
};

Task.redisClient = redisClient;

Task.prototype = {

   /**
    * Save the task in redis
    */
   save: function(cb) {
      redisClient.set(this.taskToken, JSON.stringify(this.config), cb);
   },


   /**
    * Send the response to SWF
    */
   respondCompleted: function(result, cb) {

      svc.client.respondActivityTaskCompleted({
         "taskToken": this.taskToken,
         "result": JSON.stringify( result )
      }, cb);

   }

    

};



Task.types = {};

Task.registerType = function(type, klass) {
   Task.types[type] = klass;
};

Task.klassForType = function(type) {
  return Task.types[type || 'local'];
};


/**
 * Find a task given its taskToken
 */
Task.find = function(taskToken, cb) {
   redisClient.get(taskToken, function(err, result) {
      if(err) {
        cb(err);
        return;
      }
      if(!result) {
        cb(null, null);
        return;
      }
      var config = JSON.parse(result),
          klass = Task.klassForType(config.type),
          task = new klass(taskToken, config);
      cb(null, task);
   });
};



/**
 * Create a new task. Instantiate either a LocalTask or MturkTask based on config.type
 */
Task.create = function(taskToken, config, cb) {
  var klass = Task.klassForType(config.type),
      t = new klass(taskToken, config );
  t.save(cb);
};



/**
 * List open tasks
 */
Task.list =  function(count, cb) {

   redisClient.lrange('open', 0, count, function(err, results) {
      cb(err, results);
   });

};





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

