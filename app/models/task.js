
var swf = require('aws-swf'),
   redis = require('redis');


var redisClient = redis.createClient(),
    svc = swf.createClient();


/**
 * Abstract Task
 * @constructor
 */
var Task = exports.Task = function(taskToken, config) {
   this.taskToken = taskToken;
   this.config = config;
};

Task.redisClient = redisClient;

Task.prototype = {

   /**
    * Save the task in redis
    */
   save: function(cb) {
      redisClient.set(this.taskToken, JSON.stringify(this.config), cb);
   },


   /**
    * Send the response to SWF
    */
   respondCompleted: function(result, cb) {

      svc.client.respondActivityTaskCompleted({
         "taskToken": this.taskToken,
         "result": JSON.stringify( result )
      }, function (awsErr, result) {
         if(awsErr) {
            console.log("respondActivityTaskCompleted failed : ", awsErr);
            cb(awsErr);
            return;
         }
         cb();
      });

   }

    

};



Task.types = {};

Task.registerType = function(type, klass) {
   Task.types[type] = klass;
};

Task.klassForType = function(type) {
  return Task.types[type || 'local'];
};


/**
 * Find a task given its taskToken
 */
Task.find = function(taskToken, cb) {
   redisClient.get(taskToken, function(err, result) {
      if(err) {
        cb(err);
        return;
      }
      if(!result) {
        cb(null, null);
        return;
      }
      var config = JSON.parse(result),
          klass = Task.klassForType(config.type),
          task = new klass(taskToken, config);
      cb(null, task);
   });
};



/**
 * Create a new task. Instantiate either a LocalTask or MturkTask based on config.type
 */
Task.create = function(taskToken, config, cb) {

  console.log("Creating task locally : ", config);

  var klass = Task.klassForType(config.type),
      t = new klass(taskToken, config );
  t.save(cb);
};



/**
 * List open tasks
 */
Task.list =  function(count, cb) {

   redisClient.lrange('open', 0, count, function(err, results) {
      cb(err, results);
   });

};

