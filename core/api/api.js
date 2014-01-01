
var uuid = require('node-uuid');

var logger_prefix = "[api]";

module.exports = function(options, imports, register) {

   var app = imports.httpserver.app,
       eventbus = imports.eventbus,
       logger = imports.logger;

   /**
    * POST /task
    * Creates a new task
    *
    * curl -X POST http://localhost:3000/task
    */
   app.post('/task', function(req, res) {

      var task = req.body;

      task.uuid = uuid.v4();

      logger.info(logger_prefix, "Received new task ! ", task.uuid);

      eventbus.emit('newtask', task);

      res.json({error: null, msg: 'Ok !', uuid: task.uuid});
   });


   register(null, { "api": {} });
};
