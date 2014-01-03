/**
 * Logger using loggly
 */

var request = require('request');

module.exports = function(options, imports, register) {

	var url = options.url;

    register(null, {
        "logger": {
        	info: function(cmpt) {
        		var args = Array.prototype.slice.call(arguments, 1);

        		request({
        			url: url,
        			method: 'POST',
        			json: {
        				plugin: cmpt,
        				lines: args
        			}
        		}, function(err, rep, body) {
        			//console.log(body);
        		});
        	},

        	error: function(cmpt) {
        		var args = Array.prototype.slice.call(arguments, 1);

        		request({
        			url: url,
        			method: 'POST',
        			json: {
        				error: true,
        				plugin: cmpt,
        				lines: args
        			}
        		}, function(err, rep, body) {
        			//console.log(body);
        		});
        	}
        }
    });
};