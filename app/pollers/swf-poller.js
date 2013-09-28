
module.exports = function(config) {

    var os = require('os'),
        swf = require('aws-swf'),
        Task = require(__dirname + '/../models/task').Task,
        LocalTask = require(__dirname + '/../models/local-task').LocalTask,
        MturkTask = require(__dirname + '/../models/mturk-task').MturkTask;

    // Start the activity poller
    var activityPoller = new swf.ActivityPoller({
        // TODO: put those in config.js
        domain: 'aws-swf-test-domain',
        taskList: {name: "aws-swf-tasklist" /*'humantask-tasklist'*/ },
        identity: 'ActivityPoller-' + os.hostname() + '-' + process.pid
    });


    activityPoller.on('activityTask', function (activityTask) {

    	console.log("New task", activityTask);

        var taskToken = activityTask.config.taskToken,
            taskConfig = JSON.parse(activityTask.config.input);


        console.log("New task details :");
        console.log(taskToken);
        console.log(taskConfig);


        Task.create(taskToken, taskConfig, function(err, results) {
    		console.log("save results", err, results);
    	});

    });


    activityPoller.on('poll', function(d) {
        console.log("polling for activity tasks...", d);
    });

    activityPoller.poll();

    // on SIGINT event, close the poller properly
    /*process.on('SIGINT', function () {
        console.log('Got SIGINT ! Stopping activity poller after this request...please wait...');
        activityPoller.stop();
    });*/

};
