
module.exports = function(config) {

   var async = require('async'),
       mturk = require('mturk')(config.mturk),
       Task = require(__dirname + '/../models/task.js').Task,
       MturkTask = require(__dirname + '/../models/mturk-task.js').MturkTask;

   // Process for one reviewable hitId
   // Start the poller
   mturk.on('HITReviewable', function (hitId) {

      console.log('HIT with ID ' + hitId + ' HITReviewable');

      // Retrieve the hit
      mturk.HIT.get(hitId, function(err, hit) {
         if(err) { console.log(err); return; }
         processHit(hit);
      });

   });



   // Process for one reviewable hit
   function processHit(hit) {

      // TaskToken
      var mturkShortToken;
      if(hit.requesterAnnotation && hit.requesterAnnotation.taskToken) {
         mturkShortToken = hit.requesterAnnotation.taskToken;
      }
      else {
         console.log("Hit not associated to a taskToken. ignoring...");
         return;
      }

      processSwfHit(hit, mturkShortToken);
   }



   function processSwfHit(hit, mturkShortToken) {

      console.log(hit);

      // maxAssignments
      var maxAssignments = parseInt(hit.maxAssignments, 10);


      // Get Assignements
      console.log("Fetching assignments...");
      hit.getAssignments({}, function(err, numResults, totalNumResults, pageNumber, assignments) {

         if(err) {
            console.log("Unable to retrieve assignments !", err);
            return;
         }

         if(totalNumResults == maxAssignments) {

            // auto-approve all assignements with assignmentStatus === 'Submitted'
            async.forEachSeries(assignments, function(assignment, cb) {
               if(assignment.assignmentStatus === 'Submitted') {
                  console.log("Approving assignment : ", assignment.id);
                  assignment.approve("Thank you !", cb);
               }
               else {
                  cb();
               }
            }, function(err) {
                  
                  console.log("Assignements approved !!");

                  /**
                   * Transforming the results from mturk
                   */
                  var results = [];
                  assignments.forEach(function(assignment) {
                     var r = {};
                     assignment.answer.QuestionFormAnswers.Answer.forEach(function(mturkAnswer) {
                        var key = mturkAnswer.QuestionIdentifier;
                        var val = mturkAnswer.FreeText;
                        r[key] = val;
                     });
                     results.push(r);
                  });
                  if(maxAssignments == 1) {
                     results = results[0];
                  }

                  /**
                   * Find the MturkTask object
                   */
                  console.log("loading task");
                  MturkTask.findByShortToken(mturkShortToken, function(err, task) {

                     if(!task) {
                        // dispose hit:
                        console.log("no task");
                        console.log("dispose hit");
                        mturk.HIT.dispose(hit.id, function() {
                           console.log("done");
                        });
                        return;
                     }

                     console.log("Got task ! Mark as completed");

                     // Mark task has completed
                     task.respondCompleted(results, function(err) {

                        // dispose hit:
                        console.log("dispose hit");
                        mturk.HIT.dispose(hit.id, function() {
                           console.log("done");
                        });
                        
                     });

                  });

            });

         }


     });

   }

};
