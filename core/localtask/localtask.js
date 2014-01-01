var mu = require('mu2'),
    fs = require('fs'),
    ejs = require('ejs'),
    querystring = require('querystring');


var logger_prefix = "[localtask]";


module.exports = function(options, imports, register) {

   var app = imports.httpserver.app,
       redisClient = imports.redis,
       eventbus = imports.eventbus,
       logger = imports.logger;


   /**
    * On 'localtask' event, store the task
    */
   eventbus.on('localtask', function(taskToken, config) {
      redisClient.set(taskToken, JSON.stringify(config), function(err) {
         if(err) {
         }
         else {

         }
      });
   });


   
   app.locals.querystring_escape = function(name) {
      return querystring.escape(name);
   };

   /**
    * Task list
    */
   app.get('/localtask', function(req, res) {
      redisClient.lrange('open', 0, 25, function(err, results) {

         // TODO: err handling
         res.render('core/localtask/views/index', { 
            layout: 'core/localtask/views/layout',
            locals: { 
               keys: results,
               taskToken: ""
            }
         });
   
      });
   });



   /**
    * Task finished
    */
   app.get('/localtask/finished', function(req, res) {
      res.render('core/localtask/views/finished', { 
        layout: 'core/localtask/views/layout',
         locals: { 
            taskToken: ""
         }
      });
   });





   // Get the task from redis
   function taskFromToken(req, res, next) {

      redisClient.get( req.param('taskToken') , function(err, task) {

         if(!!err || task === null) {
            res.render('error', { 
               locals: { 
                  error: err,
                  taskToken: ""
               } 
            });
            return;
         }

         req.task = JSON.parse(task);

         next();

      });

   }



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
      
      var input = req.task;
        
      if(input.template) {
         
         var stream = mu.renderText(input.template, input, {});

         var str = "";
         stream.on('data', function(data) { str += data; });
         stream.on('end', function() {
            fs.readFile(__dirname+'/views/'+layout, 'utf-8', function(error, content) {
               res.set('Content-Type', 'text/html');
               var body = ejs.render(content, {
                  body: str,
                  taskToken: querystring.escape(req.param('taskToken'))
               });
               res.send(body);
            });
         });
           
      }
      else {
         // Render the default task view
         res.render('core/localtask/views/defaultTaskView', {
            layout: 'core/localtask/views/layout',
            locals: { 
               taskToken: querystring.escape(req.param('taskToken')),
               activityTask: req.task
            } 
         });
      }   
     
   }

   app.get('/localtask/activity/:taskToken', taskFromToken, function(req, res) {
      display_activity(req, res, 'layout.ejs');
   });


   /**
    * Webservices to complete a local task
    */

   function removeFromOpen(taskToken, cb) {
      redisClient.lrem('open', 0, taskToken, function(err) {
         if (err) { cb(err); return; }
         redisClient.rpush('done', taskToken , cb);
      });
   };

   app.post('/localtask/:taskToken/completed', taskFromToken, function(req, res){
      
      logger.info(logger_prefix, "Got task. Sending the results...");

      var taskToken = req.param('taskToken');

       // mark local task as done !
       removeFromOpen(req.param('taskToken'), function(err) {
            if(err) {
              logger.error(logger_prefix, "Unable to mark task as done !");
              logger.error(logger_prefix, err);
              return;
            }
            logger.info(logger_prefix, "Task marked as done !");
       });

       res.redirect('/localtask/finished');

   });

   app.post('/localtask/:taskToken/canceled', taskFromToken, function(req, res){
      // TODO: send a RespondActivityTaskCanceled
      // TODO: delete the activity
      res.send('Hello World');
   });

   app.post('/localtask/:taskToken/failed', taskFromToken, function(req, res){
      // TODO: send a RespondActivityTaskFailed
      // TODO: delete the activity
      res.send('Hello World');
   });


   register(null, {
      "localtask": {}
   });

};

