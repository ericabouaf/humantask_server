#!/usr/bin/env node

var async = require('async'),
    config = require(__dirname + '/../config.js'),
    mturk = require('mturk')(config.mturk);

var Task = require(__dirname + '/../app/models/task.js').Task;
var MturkTask = require(__dirname + '/../app/models/mturk-task.js').MturkTask;

function processSwfHit(hit, taskToken) {

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

      console.log(JSON.stringify(assignments, null, 3));


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

               var results = [];
               assignments.forEach(function(assignment) {
                  results.push(assignment.answer);
               });


               
               // TODO: create MturkTask object
               Task.find(taskToken, function(err, task) {

                  console.log("loading task");

                  // TODO: mark task has completed
                  //taskCompleted(taskToken, results, hit);
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


// Process for one reviewable hit
function processHit(hit) {

   // TaskToken
   var taskToken;
   if(hit.requesterAnnotation && hit.requesterAnnotation.taskToken) {
      taskToken = hit.requesterAnnotation.taskToken;
   }
   else {
      console.log("Hit not associated to a taskToken. ignoring...");
      return;
   }

   processSwfHit(hit, taskToken);
}


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
