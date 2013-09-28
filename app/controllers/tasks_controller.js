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