/**
 * Webhook-reporter
 * Send a POST request when a task is done with the results of the task.
 *
 * {
 *    ...
 *    "webhook-reporter": "http://url.of.the.webhook"
 * }
 *
 */
var request = require('request');

var logger_prefix = '[webhook-reporter]';

module.exports = function(options, imports, register) {

   var eventbus = imports.eventbus,
       logger = imports.logger;

   eventbus.on('taskCompleted', function(token, task) {
      if(task["webhook-reporter"]) {

         logger.info(logger_prefix, 'Got a new task completed event, sending webhook... ', token);

         var webhookUrl = task["webhook-reporter"];

         request({
            method: 'POST',
            url: webhookUrl,
            json: task
         }, function(err) {
            logger.info(logger_prefix, 'Sent request !', err);
         });

      }
   });

   register(null, { "webhook-reporter": {} });
};
