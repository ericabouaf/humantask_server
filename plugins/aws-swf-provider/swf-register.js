
var swf = require('aws-swf'),
    winston = require('winston');

var winston_prefix = "[SWF Register]";
var async = require('async');

module.exports = function(loadedModules, config, swfClient, cb) {


  async.forEachSeries(Object.keys(loadedModules), function(moduleName, cb) {
    
    winston.info(winston_prefix, "Testing presence of "+moduleName+" activity type in SWF...");

    swfClient.client.describeActivityType({
        "activityType": {
            "name": moduleName,
            "version": "1.0"
        },
        "domain": config.domain
    }, function(err, result) {

      if(err) {
        if(err.code == 'UnknownResourceFault') {

          winston.info(winston_prefix, "Missing Activity type "+moduleName+". Registering...");

          swfClient.client.registerActivityType({
              "defaultTaskHeartbeatTimeout": "NONE",
              "defaultTaskList": {
                  "name": config.taskList.name
              },
              "defaultTaskScheduleToCloseTimeout": "NONE",
              "defaultTaskScheduleToStartTimeout": "NONE",
              "defaultTaskStartToCloseTimeout": "NONE",
              //"description": "string",
              "domain": config.domain,
              "name": moduleName,
              "version": "1.0"
          }, function(err, result) {
            console.log(err, result);
            if(err) {
              winston.error(winston_prefix, "Error registering activity type "+moduleName+".");
              console.log(err);
            }
            else {
              winston.info(winston_prefix, "Registered Activity type "+moduleName+".");
            }
            cb();
          });

        }
        else {
          console.log(err);
          cb();
        }
      }
      else {
        if(result.typeInfo.status !== 'REGISTERED') {
          winston.error(winston_prefix, "Unknown describeActivityType response for module '"+moduleName+"'"); 
          console.log(result);
        }
        else {
          winston.info(winston_prefix, "Activity type "+moduleName+" already exists in SWF.");
        }
        cb();
      }

    });


  }, function(err) {
    startPoller();
  });

};