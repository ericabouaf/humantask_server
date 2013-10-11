
/**
 * Load configurations
 */
var config = require('./config.js');
var coreConfig = config.core;

/**
 * Logger
 */

var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	colorize: true
});
var winston_prefix = "[Core]";

/**
 * Redis Client
 */

var redis = require('redis');
var redisClient = redis.createClient();

/**
 * AWS-SWF client
 */

var swf = require('aws-swf');
var swfClient = swf.createClient();

/**
 * Loading core modules
 */

var httpServer = require('./modules/core/http-server')(coreConfig.httpServer);

/**
 * Load the modules
 */

var loadedModules = {};

function loadModule(moduleName, moduleConfig) {
	try {
		var module = require('./modules/'+moduleName+'/'+moduleName+'.js');
		module.start(httpServer, redisClient, swfClient, moduleConfig);
		loadedModules[moduleName] = module;
		winston.info(winston_prefix, "Loaded module '"+moduleName+"'");
	}
	catch(ex) {
		winston.error(winston_prefix, "Failed to load module '"+moduleName+"'");	
		console.log(ex);
	}
};

for(var moduleName in config.modules) {
	if(config.modules.hasOwnProperty(moduleName)) {
		loadModule(moduleName, config.modules[moduleName]);
	}
}

/**
 * Start the AWS-SWF Activity Poller (register missing activity types if needed)
 */
require('./modules/core/swf-poller')(coreConfig.swfPoller, swfClient, loadedModules);
