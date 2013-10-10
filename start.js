
/**
 * Logger
 */

var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	colorize: true
});


/**
 * Load configurations
 */
var config = require('./config.js');





/**
 * Loading core modules
 */

require('./modules/core/swf-poller')(config.core);
var app = require('./modules/core/server')(config.core);
var swf = require('aws-swf');
var swfClient = swf.createClient();



/**
 * The pollers
 */
require('./app/controllers/tasks_controller').controller(app);

require('./app/pollers/mturk-poller')(app.config);

