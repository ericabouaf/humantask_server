
var winston = require('winston');
var winston_prefix = "[Core]";

module.exports = function(config, httpServer, redisClient, swfClient) {

    var loadedModules = {};

    function loadModule(moduleName, moduleConfig) {
        try {
            var module = require('../modules/'+moduleName+'/'+moduleName+'.js');
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

    return loadedModules;
};