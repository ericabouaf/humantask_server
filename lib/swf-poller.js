#!/usr/bin/env node

var os = require('os'),
    swf = require('aws-swf'),
    Task = require('../app/models/task').Task,
    LocalTask = require('../app/models/local-task').LocalTask;

// Start the activity poller
var activityPoller = new swf.ActivityPoller({
    domain: 'aws-swf-test-domain',
    taskList: {name: "aws-swf-tasklist" /*'humantask-tasklist'*/ },
    identity: 'ActivityPoller-' + os.hostname() + '-' + process.pid
});


activityPoller.on('activityTask', function (activityTask) {

	console.log("New task", activityTask);

	// TODO: handle mturk tasks !

	var t = new LocalTask(activityTask.config.taskToken, JSON.parse(activityTask.config.input) );

	t.save(function(err, results) {
		console.log("save results", err, results);
	});

});


activityPoller.on('poll', function(d) {
    console.log("polling for activity tasks...", d);
});

activityPoller.poll();

// on SIGINT event, close the poller properly
process.on('SIGINT', function () {
    console.log('Got SIGINT ! Stopping activity poller after this request...please wait...');
    activityPoller.stop();
});

