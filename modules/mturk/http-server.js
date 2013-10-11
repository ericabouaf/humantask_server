

module.exports = function(app, redisClient, swfClient, moduleConfig) {


	var findByShortToken = function(mturkShortToken, cb) {
  		redisClient.hget('mturk-shortener', mturkShortToken, function(err, taskToken) {
    		redisClient.get(taskToken, cb);
  		});
	};



   // Get the task from redis
   function taskFromToken(req, res, next) {

      redisClient.get( req.param('taskToken') , function(err, task) {

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
            fs.readFile(__dirname+'/../views/'+layout, 'utf-8', function(error, content) {
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


	app.get('/mturk/:taskToken', taskFromToken, function(req, res) {
      display_activity(req, res, 'mturk_layout.ejs');
   });



};

