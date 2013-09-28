
var async = require('async'),
    winston = require('winston'),
    Task = require(__dirname + '/../models/task.js').Task,
    MturkTask = require(__dirname + '/../models/mturk-task.js').MturkTask;

var winston_prefix = "[Mturk Poller]";

module.exports = function(config) {

   var mturk = require('mturk')(config.mturk);

   winston.info(winston_prefix, "Start polling Mturk for reviewable HITs.");

   /**
    * HITReviewable handler
    */
   mturk.on('HITReviewable', function (hitId) {

      winston.info(winston_prefix, "New reviewable HIT : "+hitId);

      // Retrieve the hit
      mturk.HIT.get(hitId, function(err, hit) {
         if(err) {
            winston.error(winston_prefix, "Unable to get HIT "+hitId);
            winston.error(winston_prefix, err);
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
         winston.error(winston_prefix, "HIT without taskToken. Ignoring HIT.");
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
      winston.info(winston_prefix, "Fetching HIT assignments...");
      hit.getAssignments({}, function(err, numResults, totalNumResults, pageNumber, assignments) {

         winston.info(winston_prefix, "Got assignements : ", numResults+" results", totalNumResults+" total results", "pageNumber: "+pageNumber);

         if(err) {
            winston.error(winston_prefix, "Unable to retrieve HIT assignments");
            winston.error(winston_prefix, err);
            return;
         }

         if(totalNumResults != maxAssignments) {
            winston.info(winston_prefix, "Assignments not completed yet. Waiting for more. ("+totalNumResults+"/"+maxAssignments+") ");
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
            winston.info(winston_prefix, "Approving assignment "+assignment.id);
            assignment.approve("Thank you !", cb);
         }
         else {
            cb();
         }
      }, function(err) {
            
            winston.info(winston_prefix, "All assignements approved !");

            // results
            var results = getResultsFromAssignments(assignments);
            if(maxAssignments == 1) {
               results = results[0];
            }

            /**
             * Find the MturkTask object
             */
            winston.info(winston_prefix, "Loading task...");
            MturkTask.findByShortToken(mturkShortToken, function(err, task) {

               if(!task) {
                  winston.warn(winston_prefix, "Task not found ! Disposing HIT...");
                  mturk.HIT.dispose(hit.id, function() {
                     winston.info(winston_prefix, "HIT disposed.");
                  });
                  return;
               }

               winston.info(winston_prefix, "Got task. Sending results to SWF...");

               // Mark task has completed
               task.respondCompleted(results, function(err) {

                  if(err) {
                    winston.error(winston_prefix, "SWF respondCompleted failed");
                    winston.error(winston_prefix, err);
                    return;
                  }

                  winston.info(winston_prefix, "Results sent to SWF ! Disposing HIT...");

                  mturk.HIT.dispose(hit.id, function() {
                     winston.info(winston_prefix, "HIT disposed.");
                  });
                  
               });

            });

      });

   }


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


};
