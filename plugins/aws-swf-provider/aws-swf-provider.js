
var swf = require('aws-swf'),
    uuid = require('node-uuid');

var logger_prefix = "[aws-swf-provider]";


module.exports = function(options, imports, register) {

   var eventbus = imports.eventbus,
       logger = imports.logger;

   var swfClient = swf.createClient(options);


   /**
    * Task completed handler
    */
   eventbus.on('taskCompleted', function(token, task) {
      if(!!task.provider && task.provider.type === 'aws-swf') {
         swfClient.respondActivityTaskCompleted({
            taskToken: task.provider.taskToken,
            result: JSON.stringify( task.results )
         }, function(err) {
            if(err) {
               logger.error(logger_prefix, "SWF respondCompleted failed", err);
            }
            else {
               logger.info(logger_prefix, "Results sent to SWF ! Marking local task as done...");
            }
         });
      }
   });



/*var activityName = 'mutaskhub';
var domain = 'aws-swf-test-domain';
var taskList = 'mutaskhub-tasklist';*/



function registerActivityType() {

   console.log("Missing Activity type "+activityName+". Registering...");

    swfClient.client.registerActivityType({
        "defaultTaskHeartbeatTimeout": "NONE",
        "defaultTaskScheduleToCloseTimeout": "NONE",
        "defaultTaskScheduleToStartTimeout": "NONE",
        "defaultTaskStartToCloseTimeout": "NONE",
        "description": "Tasks sent to MuTaskHub to be performed by human beings.",

        "defaultTaskList": { "name": taskList },
        "domain": domain,
        "name": activityName,
        "version": "1.0"

    }, function(err, result) {

      console.log(err, result);
      if(err) {
        console.log("Error registering activity type "+activityName+".");
        console.log(err);
      }
      else {
        console.log("Registered Activity type "+activityName+".");
      }

    });

}



console.log("Testing presence of "+activityName+" activity type in SWF...");
swfClient.client.describeActivityType({
  "activityType": {
      "name": activityName,
      "version": "1.0"
  },
  "domain": config.domain
}, function(err, result) {

   if(err) {
      if(err.code == 'UnknownResourceFault') {
         registerActivityType();
      }
      else {
         console.log(err);
      }
      return;
   }


   if(result.typeInfo.status !== 'REGISTERED') {
      console.log("Unknown describeActivityType response for module '"+activityName+"'");
      console.log(result);
   }
   else {
      console.log("Activity type "+activityName+" already exists in SWF.");
   }

});




   /**
    * Activity poller
    */
   var activityPoller = new swf.ActivityPoller(options, swfClient);

   activityPoller.on('activityTask', function (activityTask) {

      var taskToken = activityTask.config.taskToken,
          activityType = activityTask.config.activityType.name,
          taskConfig;

      logger.info(logger_prefix, "Received new activity '"+activityType+"' : "+taskToken.substr(0,30)+"...");

      // parsing input JSON
      try {
         taskConfig = JSON.parse(activityTask.config.input);
      }
      catch(ex) {
         logger.error(logger_prefix, "activityTask input is not valid JSON. Ignoring task.");
         // TODO: respond Failed ?
         return;
      }

      // Setup the task structure :
      task.uuid = uuid.v4();
      taskConfig.provider = {
         type: 'aws-swf',
         taskToken: taskToken
      };

      // Creating the task
      eventbus.emit('newtask', task);
   });

   activityPoller.on('poll', function(d) {
      logger.info(logger_prefix, "polling for activity tasks...", d);
   });

   activityPoller.start();


   // on SIGINT event, close the poller properly
   /*process.on('SIGINT', function () {
      console.log('Got SIGINT ! Stopping activity poller after this request...please wait...');
      activityPoller.stop();
   });*/

   register(null, { "aws-swf-provider": {} });

};
