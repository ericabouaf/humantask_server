var mu = require('mu2'),
    fs = require('fs'),
    ejs = require('ejs'),
    winston = require('winston'),
    querystring = require('querystring');

var winston_prefix = "[LocalTask HTTP Server]";



module.exports = function(app, redisClient, swfClient, moduleConfig) {


  app.locals.querystring_escape = function(name) {
    return querystring.escape(name);
  };

	/**
	 * Task list
	 */
   app.get('/localtask', function(req, res) {


 	  redisClient.lrange('open', 0, 25, function(err, results) {

        // TODO: err handling

        res.render('localtask/views/index', { 
          layout: 'localtask/views/layout',
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
      res.render('localtask/views/finished', { 
      	layout: 'localtask/views/layout',
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
         res.render('localtask/views/defaultTaskView', {
            layout: 'localtask/views/layout',
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
      
      winston.info(winston_prefix, "Got task. Sending results to SWF...");


      swfClient.respondActivityTaskCompleted({
         "taskToken": req.param('taskToken'),
         "result": JSON.stringify( req.body )
      },  function(err) {

         if(err) {

            winston.error(winston_prefix, "SWF respondCompleted failed");
            winston.error(winston_prefix, err);

            res.render('localtask/views/error', { 
                layout: 'localtask/views/layout',
               locals: { 
                  error: err,
                  activityTask: null,
                  taskToken: "no"
               } 
            });


            // mark local task as done !
            removeFromOpen(req.param('taskToken'), function(err) {
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
         removeFromOpen(req.param('taskToken'), function(err) {
              if(err) {
                winston.error(winston_prefix, "Unable to mark task as done !");
                winston.error(winston_prefix, err);
                return;
              }
              winston.info(winston_prefix, "Task marked as done !");
         });

         res.redirect('/localtask/finished');

      });

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


};


