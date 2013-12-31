/**
 * Logger
 */

var winston = require('winston');

module.exports = function(options, imports, register) {

    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        colorize: true
    });

    register(null, {
        "logger": winston
    });
};