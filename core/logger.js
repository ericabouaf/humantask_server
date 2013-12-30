/**
 * Logger
 */

var winston = require('winston');


module.exports = function(config) {

    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        colorize: true
    });

    return winston;
};