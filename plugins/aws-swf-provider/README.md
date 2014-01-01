# Amazon SimpleWorflow provider

This plugin maps an Amazon SimpleWorkflow Activity to a task.

Amazon Simple Workflow (SWF) Web Service.


This configuration must be sent by a SWF decider, encoded in JSON into the activity "input" field (limited to 65k)

 * For 'local' tasks, sends results to SWF


## SWF Poller

 * Polls for new activity tasks, and store them into redis.
 * For 'local' tasks, we send email notifications with the URL of the task.
 * For 'mturk' tasks, we send the task to Mechanical Turk.



## Requirements

 * AWS account (using Mechanical Turk & Simple Workflow)