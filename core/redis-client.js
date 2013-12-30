/**
 * Redis Client
 */

var redis = require('redis');

module.exports = function(config) {
    return redis.createClient();
};