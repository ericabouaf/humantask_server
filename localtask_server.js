/* Main application entry file. Please note, the order of loading is important.
 * Configuration loading and booting of controllers and custom error handlers */

var express = require('express'),
    expressLayouts = require('express-ejs-layouts'),
    ejs = require('ejs'),
	 mu = require('mu2'),
    fs = require('fs'),
	 querystring = require('querystring'),
    Task = require('./app/models/task').Task,
    LocalTask = require('./app/models/local-task').LocalTask;

var app = express();

// Load configurations
app.config = require('./config.js');


app.configure(function(){
   app.use(express.static(__dirname + '/public'));
   app.set('views', __dirname + '/app/views');
   app.set('view engine', 'ejs');
   app.set('layout', 'layout'); // defaults to 'layout'     
   app.use(expressLayouts);
   app.use(express.bodyParser());
});



// Get the task from redis
function taskFromToken(req, res, next) {

   console.log(req.param('taskToken')  );

   Task.find( req.param('taskToken') , function(err, task) {

      if(!!err || task === null) {
         res.render('error', { 
            locals: { 
               error: err,
               taskToken: ""
            } 
         });
         return;
      }

      req.task = task;

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


function display_activity(req, res, layout) {
  
   if(!req.task) {
      res.render('unavailable', { 
         locals: { 
            taskToken: ""
         }
      });
      return;
   }  
   
   var input = req.task.config;
     
   if(input.template) {
      
      var stream = mu.renderText(input.template, input, {});

      var str = "";
      stream.on('data', function(data) { str += data; });
      stream.on('end', function() {
         fs.readFile(__dirname+'/app/views/'+layout, 'utf-8', function(error, content) {
            res.set('Content-Type', 'text/html');
            var body = ejs.render(content, {
               body: str,
               taskToken: querystring.escape(req.task.taskToken)
            });
            res.send(body);
         });
      });
        
   }
   else {
      // Render the default task view
      res.render('defaultTaskView', {
         locals: { 
            taskToken: querystring.escape(req.task.taskToken), 
            activityTask: req.task
         } 
      });
   }   
  
}

app.get('/activity/:taskToken', taskFromToken, function(req, res) {
   display_activity(req, res, 'layout.ejs');
});
app.get('/mturk/:taskToken', taskFromToken, function(req, res) {
   display_activity(req, res, 'mturk_layout.ejs');
});


/**
 * Webservices to complete or fail an activity task
 */
app.post('/:taskToken/completed', taskFromToken, function(req, res){
     
   req.task.respondCompleted(req.body, function(err) {

      if(err) {
         res.render('error', { 
            locals: { 
               error: err,
               activityTask: null,
               taskToken: "no"
            } 
         });
         return;
      }

      res.redirect('/finished');

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

	Task.list(25, function(err, results) {
      var r = results.length + " results<br /><br />";
      results.forEach(function(key) {
         r += '<a href="/activity/'+querystring.escape(key)+'">'+key+'</a><br />';
      });

      res.send(r);

   });


});






// start the server
app.listen(app.config.server.port, app.config.server.ip);

console.log("App started in '"+app.set('env')+"' environment !\n" +
            "Listening on http://"+app.config.server.host+":"+app.config.server.port);
