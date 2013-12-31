/**
 * AWS-SWF client
 */

var swf = require('aws-swf');

module.exports = function(options, imports, register) {

    var swfClient = swf.createClient(options);

    register(null, {
        "aws-swf-client": swfClient
    });

};