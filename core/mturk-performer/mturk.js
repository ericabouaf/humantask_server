/**
 * uses: https://github.com/jefftimesten/mturk
 *  BUT requires neyric's branch : https://github.com/neyric/mturk
 */

var mu = require('mu2'),
    fs = require('fs'),
    ejs = require('ejs'),
    async = require('async'),
    querystring = require('querystring');

var logger_prefix = "[mturk-performer]";

module.exports = function(options, imports, register) {

   var app = imports.httpserver.app,
       redisClient = imports.redis,
       logger = imports.logger,
       eventbus = imports.eventbus;

   var mturk = require('mturk')(options);

   /**
    * On mturk task event, store the task
    */
   eventbus.on('newtask', function(task) {
      if(!!task.performer && task.performer.type === 'mturk') {

         logger.info(logger_prefix, "Received new mturk task: ", task.uuid);

         redisClient.set(task.uuid, JSON.stringify(task), function(err) {
            // TODO: err handling
            //redisClient.rpush('open', task.uuid, function(err) {
               // TODO: err handling
               logger.info(logger_prefix, "Saved in redis !", err);


               // Create a HIT
               var mturkParams = task.performer,
                   price = new mturk.Price( String(mturkParams.reward), "USD");

               mturk.HITType.create(mturkParams.title, mturkParams.description, price, mturkParams.duration, mturkParams.options, function(err, hitType) {

                  var options = {maxAssignments: mturkParams.maxAssignments || 1},
                     lifeTimeInSeconds = 3600, // 1 hour
                     questionXML = externalUrlXml("http://"+app.config.host+":"+app.config.port+"/mturk/"+task.uuid, 800);

                  mturk.HIT.create(hitType.id, questionXML, lifeTimeInSeconds, {
                     requesterAnnotation: JSON.stringify({uuid: task.uuid})
                  }, function(err, hit) {
                     logger.info(logger_prefix, "HIT Created !", err);
                  });

               });


               var taskURL = 'http://'+app.config.host+':'+app.config.port+'/mturk/'+task.uuid;
               eventbus.emit('taskCreated', task, taskURL);
            //});

         });

      }
   });




   // Get the task from redis
   function taskFromUuid(req, res, next) {
      redisClient.get( req.param('uuid') , function(err, task) {

         if(!!err || task === null) {
            res.render('error', {
               locals: {
                  error: err,
                  taskToken: ""
               }
            });
            return;
         }

         req.task = JSON.parse(task);

         next();
      });
   }


   app.get('/mturk/:uuid', taskFromUuid, function(req, res) {
      var layout = 'mturk_layout.ejs';


      if(!req.task) {
         res.render('unavailable', {
            locals: {
               taskToken: ""
            }
         });
         return;
      }

      var input = req.task;

      if(input.template) {

         var stream = mu.renderText(input.template, input, {});

         var str = "";
         stream.on('data', function(data) { str += data; });
         stream.on('end', function() {
            fs.readFile(__dirname+'/views/'+layout, 'utf-8', function(error, content) {
               res.set('Content-Type', 'text/html');
               var body = ejs.render(content, {
                  body: str,
                  taskToken: req.task.uuid
               });
               res.send(body);
            });
         });

      }
      else {
         // Render the default task view
         res.render('defaultTaskView', {
            locals: {
               taskToken: req.task.uuid,
               activityTask: req.task
            }
         });
      }

   });



   logger.info(logger_prefix, "Start polling Mturk for reviewable HITs.");


   /**
    * HITReviewable handler
    */
   mturk.on('HITReviewable', function (hitId) {

      logger.info(logger_prefix, "New reviewable HIT : "+hitId);

      // Retrieve the hit
      mturk.HIT.get(hitId, function(err, hit) {
         if(err) {
            logger.error(logger_prefix, "Unable to get HIT "+hitId);
            logger.error(logger_prefix, err);
            return;
         }
         processHit(hit);
      });

   });



   /**
    * Process for one reviewable HIT
    */
   function processHit(hit) {

      var uuid;

      if(hit.requesterAnnotation && hit.requesterAnnotation.uuid) {
         uuid = hit.requesterAnnotation.uuid;
      }
      else {
         logger.error(logger_prefix, "HIT without uuid. Ignoring HIT.");
         return;
      }

      processMuTaskHit(hit, uuid);
   }

   /**
    * Process a valid MuTask HIT
    */
   function processMuTaskHit(hit, uuid) {

      var maxAssignments = parseInt(hit.maxAssignments, 10);

      // Get Assignements
      logger.info(logger_prefix, "Fetching HIT assignments...");
      hit.getAssignments({}, function(err, numResults, totalNumResults, pageNumber, assignments) {

         logger.info(logger_prefix, "Got assignements : ", numResults+" results", totalNumResults+" total results", "pageNumber: "+pageNumber);

         if(err) {
            logger.error(logger_prefix, "Unable to retrieve HIT assignments");
            logger.error(logger_prefix, err);
            return;
         }

         if(totalNumResults != maxAssignments) {
            logger.info(logger_prefix, "Assignments not completed yet. Waiting for more. ("+totalNumResults+"/"+maxAssignments+") ");
            return;
         }

         // TODO: fetch ALL assignements if needed !

         completeHit(hit, uuid, assignments);

     });

   }


   /**
    * When a HIT is fully completed
    */
   function completeHit(hit, uuid, assignments) {

      var maxAssignments = parseInt(hit.maxAssignments, 10);

      // auto-approve all assignements with assignmentStatus === 'Submitted'
      async.forEachSeries(assignments, function(assignment, cb) {
         if(assignment.assignmentStatus === 'Submitted') {
            logger.info(logger_prefix, "Approving assignment "+assignment.id);
            assignment.approve("Thank you !", cb);
         }
         else {
            cb();
         }
      }, function(err) {

         logger.info(logger_prefix, "All assignements approved !");

         // results
         var results = getResultsFromAssignments(assignments);
         if(maxAssignments == 1) {
            results = results[0];
         }

         /**
          * Find the MturkTask object
          */
         logger.info(logger_prefix, "Loading task...");

         redisClient.get( uuid , function(err, taskData) {

            var task = JSON.parse(taskData);

            if(!task) {
               logger.warn(logger_prefix, "Task not found ! Disposing HIT...");
               mturk.HIT.dispose(hit.id, function() {
                  logger.info(logger_prefix, "HIT disposed.");
               });
               return;
            }

            logger.info(logger_prefix, "Got task. Sending results...");


            task.results = results;


            logger.info(logger_prefix, "Results sent ! Disposing HIT...");

            mturk.HIT.dispose(hit.id, function() {
               logger.info(logger_prefix, "HIT disposed.");
            });

            eventbus.emit('taskCompleted', uuid, task);

         });

      });

   }


   register(null, {
      "mturk-performer": {}
   });

};



/**
 * Transforming the results from Mturk
 */
function getResultsFromAssignments(assignments) {
   var results = [];
   assignments.forEach(function(assignment) {
      var r = {};
      var a = assignment.answer.QuestionFormAnswers.Answer;
      if(!Array.isArray(a)) {
        a = [a];
      }
      a.forEach(function(mturkAnswer) {
         r[mturkAnswer.QuestionIdentifier] = mturkAnswer.FreeText;
      });
      results.push(r);
   });
   return results;
}



/**
 * Return the XML for an externalUrl HIT
 */
var externalUrlXml = function (url, frameHeight) {
   return '<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">' +
          '<ExternalURL>' + url + '</ExternalURL>' +
          '<FrameHeight>' + frameHeight + '</FrameHeight>' +
          '</ExternalQuestion>';
};


