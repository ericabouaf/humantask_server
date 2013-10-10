
var swf = require('aws-swf'),
    winston = require('winston'),
    Task = require(__dirname + '/../models/task').Task,
    LocalTask = require(__dirname + '/../models/local-task').LocalTask,
    MturkTask = require(__dirname + '/../models/mturk-task').MturkTask;

var winston_prefix = "[SWF Poller]";

module.exports = function(config) {

   var activityPoller = new swf.ActivityPoller(config.swf_poller);

   /**
    * New Task handler
    */
   activityPoller.on('activityTask', function (activityTask) {

      // Re-poll immediatly
      activityPoller.poll();

      var taskToken = activityTask.config.taskToken,
          taskConfig;

      winston.info(winston_prefix, "Received new activityTask : "+taskToken.substr(0,30)+"...");

      // Validate the activityType
      if(activityTask.config.activityType.name != 'humantask') {
         winston.error(winston_prefix, "activityTask type is not 'humantask'. Ignoring task.");
         return;
      }

      try {
         taskConfig = JSON.parse(activityTask.config.input);
      }
      catch(ex) {
         winston.error(winston_prefix, "activityTask input is not valid JSON. Ignoring task.");
         return;
      }

      winston.info(winston_prefix, "creating task...");

      Task.create(taskToken, taskConfig, function(err, results) {
         if(err) {
            winston.error(winston_prefix, "Unable to create task !");
            winston.error(err);
            return;
         }
         winston.info(winston_prefix, "Task created !");
      });

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

};
