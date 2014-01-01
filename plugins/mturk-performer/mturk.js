/**
 * uses: https://github.com/jefftimesten/mturk
 *  BUT requires neyric's branch : https://github.com/neyric/mturk
 */

// TODO: remove the mturk-shortener (unnecessary now with uuid)


var mu = require('mu2'),
    fs = require('fs'),
    ejs = require('ejs'),
    async = require('async'),
    querystring = require('querystring');

var log_prefix = "[mturk-performer]";

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

         /*redisClient.set(task.uuid, JSON.stringify(task), function(err) {
            // TODO: err handling
            redisClient.rpush('open', task.uuid, function(err) {
               // TODO: err handling
               logger.info(logger_prefix, "Saved !", err);

               var taskURL = 'http://'+app.config.host+':'+app.config.port+'/localtask/activity/'+task.uuid;
               eventbus.emit('taskCreated', task, taskURL);
            });
         });*/


         /*redisClient.set(taskToken, JSON.stringify(config), function(err) {
           if(err) { cb(err); return; }


           // Create a HIT
            var mturkParams = config.mturk,
                price = new mturk.Price( String(mturkParams.reward), "USD");

            var mturkShortToken = taskToken.substr(0,200);

            redisClient.hset('mturk-shortener', mturkShortToken, taskToken, function(err, results) {

              mturk.HITType.create(mturkParams.title, mturkParams.description, price, mturkParams.duration, mturkParams.options, function(err, hitType) {

                 if(err) { cb(err); return; }

                 var options = {maxAssignments: mturkParams.maxAssignments || 1},
                     lifeTimeInSeconds = 3600, // 1 hour
                     questionXML = externalUrlXml("http://"+_app.config.host+":"+_app.config.port+"/mturk/"+querystring.escape(taskToken), 800);

                 mturk.HIT.create(hitType.id, questionXML, lifeTimeInSeconds, {
                    requesterAnnotation: JSON.stringify({taskToken: mturkShortToken })
                 }, function(err, hit) {

                    if(err) { cb(err); return; }
                    cb(null, {hitType: hitType, hit: hit});

                 });

              });

            });



         });*/

      }
   });




   // Get the task from redis
   function taskFromToken(req, res, next) {
      redisClient.get( req.param('taskToken') , function(err, task) {

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


   app.get('/mturk/:taskToken', taskFromToken, function(req, res) {
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
                  taskToken: querystring.escape(req.task.taskToken)
               });
               res.send(body);
            });
         });

      }
      else {
         // Render the default task view
         res.render('defaultTaskView', {
            locals: {
               taskToken: querystring.escape(req.task.taskToken),
               activityTask: req.task
            }
         });
      }

   });



   logger.info(logger_prefix, "Start polling Mturk for reviewable HITs.");


   var findByShortToken = function(mturkShortToken, cb) {
      redisClient.hget('mturk-shortener', mturkShortToken, function(err, taskToken) {
         redisClient.get(taskToken, function(err, task) {
            cb(err, task, taskToken);
         });
      });
   };

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

      // TaskToken
      var mturkShortToken;
      if(hit.requesterAnnotation && hit.requesterAnnotation.taskToken) {
         mturkShortToken = hit.requesterAnnotation.taskToken;
      }
      else {
         logger.error(logger_prefix, "HIT without taskToken. Ignoring HIT.");
         return;
      }

      processSwfHit(hit, mturkShortToken);
   }

   /**
    * Process a valid SWF HIT
    */
   function processSwfHit(hit, mturkShortToken) {

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

         completeHit(hit, mturkShortToken, assignments);

     });

   }


   /**
    * When a HIT is fully completed
    */
   function completeHit(hit, mturkShortToken, assignments) {

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
         findByShortToken(mturkShortToken, function(err, task, taskToken) {

            if(!task) {
               logger.warn(logger_prefix, "Task not found ! Disposing HIT...");
               mturk.HIT.dispose(hit.id, function() {
                  logger.info(logger_prefix, "HIT disposed.");
               });
               return;
            }

            logger.info(logger_prefix, "Got task. Sending results to SWF...");

            // Mark task has completed
            /*swfClient.respondActivityTaskCompleted({
                 "taskToken": taskToken,
                 "result": JSON.stringify( results )
               }, function(err) {

               if(err) {
                 logger.error(logger_prefix, "SWF respondCompleted failed");
                 logger.error(logger_prefix, err);
                 return;
               }

               logger.info(logger_prefix, "Results sent to SWF ! Disposing HIT...");

               mturk.HIT.dispose(hit.id, function() {
                  logger.info(logger_prefix, "HIT disposed.");
               });

            });*/

            // TODO: swfClient unnecessayr now, emit event instead...

         });

      });

   }



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


