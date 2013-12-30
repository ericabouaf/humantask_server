/**
 * AWS-SWF client
 */

var swf = require('aws-swf');

module.exports = function(config) {
    return swf.createClient();
};