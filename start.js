#!/usr/bin/env node

var config = require('./config.js'),
    coreConfig = config.core,
    
    logger = require('./core/logger')(coreConfig.logger),
    redisClient = require('./core/redis-client')(coreConfig.redisClient),
    swfClient = require('./core/aws-swf-client')(coreConfig.awsSwfClient),
    httpServer = require('./core/http-server')(coreConfig.httpServer),
    loadedModules = require('./core/module-loader')(config, httpServer, redisClient, swfClient);


require('./core/swf-register')(loadedModules, coreConfig.swfPoller, swfClient, function() {
    require('./core/swf-poller')(coreConfig.swfPoller, swfClient, loadedModules);
});
