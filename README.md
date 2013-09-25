# HumanTask server for SWF

Task server




## Components


### SWF Poller

Polls for new activity tasks, and store them into redis.

For 'humantask', we send email or notifo notifications with the URL of the task.

For 'mturktask', we send the task to Mturk


### Human task HTTP server

Serve tasks through HTTP.



### Mturk SQS

Listen to the SQS queue, and updates the task.

When the task is done, sends the results back to SWF




## TODO

 * Add a locking mechanism (list of task locked by the system) + auto de-lock
 * Add a list of terminated task
 * Update the terminated tasks with their results



## Ref

http://fr.slideshare.net/skairam/turkit-tools-for-iterative-tasks-on-mechanical-turk-little-et-al-2010

http://fr.slideshare.net/realgl/turkit-a-toolkit-for-human-computation-algorithms

http://fr.slideshare.net/mattlease/crowdconf2011-tutorial-crowdsourcing-for-research-and-engineering

http://fr.slideshare.net/mattlease/crowdsourcing-for-information-retrieval-principles-methods-and-applications

http://fr.slideshare.net/ipeirotis/managing-crowdsourced-human-computation