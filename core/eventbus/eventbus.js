/**
 * Provides a global event bus through the process (enables loose coupling)
 */
var EventEmitter = require('events').EventEmitter;

module.exports = function(options, imports, register) {
    var emitter = new EventEmitter();
    
    register(null, {
        "eventbus": {
            emit: emitter.emit,
            on: emitter.on
        }
    });
};