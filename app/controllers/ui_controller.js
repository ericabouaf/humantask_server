
var swf = require('aws-swf'),
	ejs = require('ejs'),
	mu = require('mu2'),
    fs = require('fs'),
	querystring = require('querystring');

exports = function(app) {




	// Get the task from redis
	function taskFromToken(req, res, next) {

	   redisClient.get( req.param('taskToken') , function(err, reply) {

	      if(!!err || reply === null) {
	         res.render('error', { 
	            locals: { 
	               error: err,
	               taskToken: ""
	            } 
	         });
	         return;
	      }

	      req.task = JSON.parse(reply);

	      next();

	   });

	}






	/**
	 * Task finished
	 */
	app.get('/finished', function(req, res) {
	   res.render('finished', { 
	      locals: { 
	         taskToken: ""
	      }
	   });
	});


	/**
	 * Display an activity
	 */
	app.get('/activity/:taskToken', taskFromToken, function(req, res) {
	  
	   if(!req.task) {
	      res.render('unavailable', { 
	         locals: { 
	            taskToken: ""
	         }
	      });
	      return;
	   }

	   // TODO: check if task has not timed-out (should be "STARTED")
	  
	   var activityTask = req.task;
	   var input = JSON.parse(activityTask.input);
	     
	   if(input.template) {
	      
	      var stream = mu.renderText(input.template, input, {});

	      var str = "";
	      stream.on('data', function(data) { str += data; });
	      stream.on('end', function() {
	         fs.readFile(__dirname+'/app/views/layout.ejs', 'utf-8', function(error, content) {
	            res.set('Content-Type', 'text/html');
	            var body = ejs.render(content, {
	               body: str,
	               taskToken: querystring.escape(activityTask.taskToken)
	            });
	            res.send(body);
	         });
	      });
	        
	   }
	   else {
	      // Render the default task view
	      res.render('defaultTaskView', {
	         locals: { 
	            taskToken: querystring.escape(activityTask.taskToken), 
	            activityTask: activityTask
	         } 
	      });
	   }   
	  
	});


	/**
	 * Webservices to complete or fail an activity task
	 */
	app.post('/:taskToken/completed', taskFromToken, function(req, res){
	  
	   var activityTask = req.task;
	     
	   // send a RespondActivityTaskCompleted
	   //var svc = new AWS.SimpleWorkflow();
	   var svc = swf.createClient();

	   svc.client.respondActivityTaskCompleted({
	      "taskToken": req.param('taskToken'),
	      "result": JSON.stringify( req.body )
	   }, function (awsErr, result) {

	      if(awsErr) {
	         console.log("respondActivityTaskCompleted failed : ", awsErr);
	         console.log("respondActivityTaskCompleted failed : ", JSON.stringify( req.body ));

	         // TODO: delete task
	         // LREM "open" 0 "acti2"

	         
	         redisClient.lrem('open', 0, req.param('taskToken') , function(err) {

	            redisClient.rpush('failed', req.param('taskToken') , function(err) {
	              
	               res.render('error', { 
	                  locals: { 
	                     error: awsErr,
	                     activityTask: null,
	                     taskToken: "no"
	                  } 
	               });

	            });

	         });
	        
	         return;
	      }
	        
	      // Delete the activity from the 'open' list
	      redisClient.lrem('open', 0, req.param('taskToken') , function(err) {
	         if (err) { console.error(err); }

	         redisClient.rpush('done', req.param('taskToken') , function(err) {

	            if (err) { console.error(err); }
	            res.redirect('/finished');

	         });
	      });

	        
	   });
	});

	app.post('/:taskToken/canceled', taskFromToken, function(req, res){
	   // TODO: send a RespondActivityTaskCanceled
	   // TODO: delete the activity
	   res.send('Hello World');
	});

	app.post('/:taskToken/failed', taskFromToken, function(req, res){
	   // TODO: send a RespondActivityTaskFailed
	   // TODO: delete the activity
	   res.send('Hello World');
	});



	app.get('/', function(req, res) {

	   // List 25 activities
	   redisClient.lrange('open', 0,25, function(err, results) {

	      var r = results.length + " results<br /><br />";
	      results.forEach(function(key) {
	         r += '<a href="/activity/'+querystring.escape(key)+'">'+key+'</a><br />';
	      });

	      res.send(r);

	   });


	});



	
};

