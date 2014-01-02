
var swf = require('aws-swf'),
    uuid = require('node-uuid');

var logger_prefix = "[aws-swf-provider]";
var activityName = 'mutaskhub';


module.exports = function(options, imports, register) {

   var eventbus = imports.eventbus,
       logger = imports.logger;

   var swfClient = swf.createClient(options);


   /**
    * Task completed handler => send the results to SWF
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


   /**
    * Register the activity type
    */
   function registerActivityType(cb) {

      logger.info(logger_prefix, "Missing Activity type "+activityName+". Registering...");

      swfClient.client.registerActivityType({
         "defaultTaskHeartbeatTimeout": "NONE",
         "defaultTaskScheduleToCloseTimeout": "NONE",
         "defaultTaskScheduleToStartTimeout": "NONE",
         "defaultTaskStartToCloseTimeout": "NONE",
         "description": "Tasks sent to MuTaskHub to be performed by human beings.",

         "defaultTaskList": options.taskList,
         "domain": options.domain,
         "name": activityName,
         "version": "1.0"

      }, function(err, result) {

         logger.info(logger_prefix, err, result);
         if(err) {
            logger.info(logger_prefix, "Error registering activity type "+activityName+".");
            logger.info(logger_prefix, err);
         }
         else {
            logger.info(logger_prefix, "Registered Activity type "+activityName+".");
         }
         cb();

      });

   }


   /**
    * Test if the activity type exists. Create it if necessary.
    */
   function makeSureActivityTypeRegistered(cb) {

      logger.info(logger_prefix, "Testing presence of "+activityName+" activity type in SWF...");

      swfClient.client.describeActivityType({
         "activityType": {
            "name": activityName,
            "version": "1.0"
         },
         "domain": options.domain
      }, function(err, result) {

         if(err) {
            if(err.code == 'UnknownResourceFault') {
               registerActivityType(cb);
            }
            else {
               logger.info(logger_prefix, err);
               cb();
            }
            return;
         }


         if(result.typeInfo.status !== 'REGISTERED') {
            logger.info(logger_prefix, "Unknown describeActivityType response for module '"+activityName+"'");
            logger.info(logger_prefix, result);
         }
         else {
            logger.info(logger_prefix, "Activity type "+activityName+" already exists in SWF.");
         }
         cb();

      });
   }


   /**
    * Start the Activity Poller for new tasks
    */
   function startPoller() {

      var activityPoller = new swf.ActivityPoller({
         domain: options.domain,
         taskList: options.taskList,
         identity: options.identity
      }, swfClient);

      activityPoller.on('activityTask', function (activityTask) {

         var taskToken = activityTask.config.taskToken,
             activityType = activityTask.config.activityType.name,
             taskConfig;

         logger.info(logger_prefix, "Received new activity '"+activityType+"' : "+taskToken.substr(0,30)+"...");

         if(activityType != activityName) {
            logger.info(logger_prefix, "Unknown activityType "+activityType+". Ignoring...");
            activityPoller.poll();
            return;
         }

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
         var task = taskConfig;
         task.uuid = uuid.v4();
         taskConfig.provider = {
            type: 'aws-swf',
            taskToken: taskToken
         };

         // Creating the task
         eventbus.emit('newtask', task);

         // We must poll again
         activityPoller.poll();
      });

      activityPoller.on('poll', function(d) {
         logger.info(logger_prefix, "polling for activity tasks...", d);
      });

      activityPoller.start();
   }



   makeSureActivityTypeRegistered(function() {

      startPoller();

      register(null, { "aws-swf-provider": {} });

   });

};
