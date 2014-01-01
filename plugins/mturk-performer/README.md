# Mturk Performer

This plugin adds the ability to run tasks on the Amazon Mechanical Turk platform.

 * "Mechanical Turk" tasks : Microtasks sent on the Amazon Mechanical Turk platform (Mturk).


## Example of Mechanical Turk task

    {
        type: 'mturk',
        mturk: {
            title : "Vote on Text Improvement",
            description : "Decide which two small paragraphs is closer to a goal.",
            reward : 0.01,  // $
            duration: 3600, // 1 hour
            maxAssignments : 1
      },
      data: [{label: "this"},{label: "list"}, {label: "is"}, {label: "templated"}],
      template: "HTML for this task. Use mustache templating with the data above."
    }



## Requirements

* AWS account to use Mechanical Turk 


## The Mturk poller

 * Polls Mturk for submitted assignments
 * When all assignments are submitted, dispose of the HIT, and sends results to SWF



## Important considerations


 * Mturk task are created using an ExternalURL (iframe). The HTTP server must be publicly accessible !
 * Mturk tasks are served, but the results are first sent to Mturk


 * Watch your SWF Timeouts ! Human tasks can take a long time... If you don't handle timeouts in your SWF workflow, it's best to diable them all :

    {
       // No timeout
       heartbeatTimeout: "NONE",
       scheduleToCloseTimeout: "NONE",
       scheduleToStartTimeout: "NONE",
       startToCloseTimeout: "NONE"
    }
