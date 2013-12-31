/**
 * Redis Client
 */

var redis = require('redis');

module.exports = function(options, imports, register) {

    var redisClient = redis.createClient();
    
    register(null, {
        "redis-client": redisClient
    });
};