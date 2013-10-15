
var winston = require('winston');
var winston_prefix = "[Textmaster Poller]";

var textmaster = require('./lib.js').textmaster;

var poll_delay = 20000;

var _swfClient, _redisClient;


var TextmasterPoller = {


   respondCompleted: function(taskToken, projectId, cb) {

      // get the documents
      winston.info(winston_prefix, "Fetching documents...");
      textmaster.documents(projectId, function(err, documents) {

         //console.log(JSON.stringify(documents, null, 3) );

        // Mark task has completed
        _swfClient.respondActivityTaskCompleted({
             "taskToken": taskToken,
             "result": JSON.stringify( documents )
           }, function(err) {

           if(err) {
             winston.error(winston_prefix, "SWF respondCompleted failed");
             winston.error(winston_prefix, err);
             cb();
             return;
           }

           winston.info(winston_prefix, "Results sent to SWF !");
           cb();
           // TODO: mark the project as completed (or Archive it ?)
         
        });

      }); 

   },


   complete_project: function(project, cb) {
      // Retrieve the taskToken from redis
      _redisClient.hget('textmaster2tasktoken', project.id, function(err, taskToken) {
        TextmasterPoller.respondCompleted(taskToken, project.id, cb);
      });
   },


   complete_projects: function(projects, cb) {
      // TODO: use async and loop over projects
      var project = projects[0];
      TextmasterPoller.complete_project(project, cb);
   },



   fetch_projects_inreview: function(cb) {
      winston.info(winston_prefix, "Polling for projects in_review...");

      textmaster.projects_inreview(function(err, res) {
         if(res.count != 0) {
            winston.info(winston_prefix, "Got "+res.count+" projects in_review !");
            //console.log(JSON.stringify(res, null, 3));
            TextmasterPoller.complete_projects(res.projects, cb);
         }
      });
   }


};




module.exports = function(app, redisClient, swfClient, moduleConfig) {

   textmaster.setCredentials(moduleConfig.apikey, moduleConfig.apisecret);

   _swfClient = swfClient;
   _redisClient = redisClient;

   var pollForReview = function() {
      TextmasterPoller.fetch_projects_inreview(function() {
         setTimeout(pollForReview, poll_delay);
      });
   };
   pollForReview();

};

