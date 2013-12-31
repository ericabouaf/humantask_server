
var textmaster = require('./lib.js').textmaster;

var _redisClient;

module.exports = {

   createTask: function (taskToken, config, cb) {

      // Create the project and the documents within
      textmaster.create_project(config, function(err, results) {

         if(err) {
            console.log(err);
            cb(err);
            return;
         }

         var projectId = results.id;


         // save the taskToken from the id of the textmaster project
         _redisClient.hset('textmaster2tasktoken', projectId, taskToken, function(err, results) {

            if(err) {
               console.log(err);
               cb(err);
               return;
            }

            // Launch the project
            textmaster.launch_project(projectId, function(err, results) {

               //console.log(err, results);

               cb(err, results);
            });


         });


      });
       
   },

   
   start: function(app, redisClient, swfClient, moduleConfig) {

      _redisClient = redisClient;
      
      textmaster.setCredentials(moduleConfig.apikey, moduleConfig.apisecret);

      // Start the poller
      require('./poller')(app, redisClient, swfClient, moduleConfig);
   }

};

