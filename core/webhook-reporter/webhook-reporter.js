
var logger_prefix = '[webhook-reporter]';

module.exports = function(options, imports, register) {

	var eventbus = imports.eventbus,
		logger = imports.logger;


	eventbus.on('taskCompleted', function(token, responseData) {
		// TODO: when a task is completed, check to see if it has any reporter URL
		// if it has, send the request

		logger.info(logger_prefix, 'Got a new task completed event ! ', token, responseData);

	});


    register(null, {
        "webhook-reporter": {}
    });

};

