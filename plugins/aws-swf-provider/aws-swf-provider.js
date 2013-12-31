
var swf = require('aws-swf'),
    winston = require('winston');

var winston_prefix = "[SWF Poller]";


module.exports = function(options, imports, register) {

  var eventbus = imports.eventbus;

  var loadedModules = []; // ?

  var swfClient = swf.createClient(options);




  eventbus.on('taskCompleted', function(token, responseData) {
    
      /*swfClient.respondActivityTaskCompleted({
         "taskToken": req.param('taskToken'),
         "result": JSON.stringify( req.body )
      },  function(err) {*/

         /*if(err) {

            logger.error(logger_prefix, "SWF respondCompleted failed");
            logger.error(logger_prefix, err);

            res.render('core/localtask/views/error', { 
                layout: 'core/localtask/views/layout',
               locals: { 
                  error: err,
                  activityTask: null,
                  taskToken: "no"
               } 
            });


            // mark local task as done !
            removeFromOpen(req.param('taskToken'), function(err) {
                if(err) {
                  logger.error(logger_prefix, "Unable to mark task as done !");
                  logger.error(logger_prefix, err);
                  return;
                }
                logger.info(logger_prefix, "Task marked as done !");
             });

            return;
         }

         logger.info(logger_prefix, "Results sent to SWF ! Marking local task as done...");*/
  }





   var activityPoller = new swf.ActivityPoller(options, swfClient);


   /**
    * New Task handler
    */
   activityPoller.on('activityTask', function (activityTask) {

      var taskToken = activityTask.config.taskToken,
          taskConfig;

      winston.info(winston_prefix, "Received new activity '"+activityTask.config.activityType.name+"' : "+taskToken.substr(0,30)+"...");

      // Validate the activityType
      /*if( !loadedModules[activityTask.config.activityType.name] ) {
         winston.error(winston_prefix, "activityTask type '"+activityTask.config.activityType.name+"' is not handled by any module. Ignoring task.");
         // TODO: respond Failed ?
         return;
      }*/

      // parsing input JSON
      /*try {
         taskConfig = JSON.parse(activityTask.config.input);
      }
      catch(ex) {
         winston.error(winston_prefix, "activityTask input is not valid JSON. Ignoring task.");
         // TODO: respond Failed ?
         return;
      }*/



      // Creating the task
      winston.info(winston_prefix, "creating task...");
      var activityTypeName = activityTask.config.activityType.name;

      var hasListeners = eventbus.emit(activityTypeName, activityTask.config.input);

      //var module = loadedModules[];
      // TODO: publish an event instead !

      /*var createTask = module.createTask;

      createTask(taskToken, taskConfig, function(err, results) {
         if(err) {
            winston.error(winston_prefix, "Unable to create task !");
            winston.error(err);
            return;
         }
         winston.info(winston_prefix, "Task created !");
      });*/

   });

   /**
    * Polling message
    */
   activityPoller.on('poll', function(d) {
      winston.info(winston_prefix, "polling for activity tasks...", d);
   });

   activityPoller.start();

   // on SIGINT event, close the poller properly
   /*process.on('SIGINT', function () {
      console.log('Got SIGINT ! Stopping activity poller after this request...please wait...');
      activityPoller.stop();
   });*/

    register(null, {
        "aws-swf-provider": activityPoller
    });

};

