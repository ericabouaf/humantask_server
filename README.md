# HumanTask server for SWF


HumanTask server makes it easier to create 'Human' activities for Amazon Simple Workflow (SWF) Web Service.


## Description

HumanTask Server is a SWF Activity Poller, which manages the *humantask* ActivityType.

The activities are stored and can be performed by humans through a Web interface.

Two kinds of human activities are available :

 * "Local" tasks : free Microtasks served through HTTP, which can be done by yourself, colleagues, friends, ... anyone with the URL.
 * "Mechanical Turk" tasks : Microtasks sent on the Amazon Mechanical Turk platform (Mturk).


## Example :

Local Task :

    {
      type: 'local',
      data: [{label: "this"},{label: "list"}, {label: "is"}, {label: "templated"}],
      template: "HTML for this task. Use mustache templating with the data above."
    }

Mechanical Turk task :

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

This configuration must be sent by a SWF decider, encoded in JSON into the activity "input" field (limited to 65k)


## Internal Components


First, the SWF Poller :

 * Polls for new activity tasks, and store them into redis.
 * For 'local' tasks, we send email notifications with the URL of the task.
 * For 'mturk' tasks, we send the task to Mechanical Turk.


The Mturk poller :

 * Polls Mturk for submitted assignments
 * When all assignments are submitted, dispose of the HIT, and sends results to SWF


The HTTP server :

 * Serve tasks through HTTP
 * For 'local' tasks, sends results to SWF
 * Mturk tasks are served, but the results are first sent to Mturk


## Important considerations


 * Mturk task are created using an ExternalURL (iframe). The HTTP server must be publicly accessible !


 * Watch your SWF Timeouts ! Human tasks can take a long time... If you don't handle timeouts in your SWF workflow, it's best to diable them all :

    {
       // No timeout
       heartbeatTimeout: "NONE",
       scheduleToCloseTimeout: "NONE",
       scheduleToStartTimeout: "NONE",
       startToCloseTimeout: "NONE"
    }


## Requirements

 * Node.JS
 * Redis
 * AWS account (using Mechanical Turk & Simple Workflow)


## Installation

 * clone the git repo (or download) humantask_server
 * npm install
 * start redis server
 * edit config.js
 * node server.js

