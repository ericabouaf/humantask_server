
   /**
    * On 'localtask' event, store the task, and eventually send an email
    */
   eventbus.on('localtask', function(taskToken, config) {

      redisClient.set(taskToken, JSON.stringify(config), function(err) {
      
         if(err) { return; }

         redisClient.rpush("open", taskToken, function() {
            if(config.emailNotification) {
               var mailOptions = {
                  from: notification.from, // || config.mailer_transport.auth.email,
                  to: notification.to,
                  subject: notification.subject,
                  text: "Hello world",
                  html: "New task : <a href='http://" + app.config.host + ":" + app.config.port + "/localtask/activity/"+querystring.escape(taskToken)+"'>Click here to do the task !</a>"
               };
               mailer.sendMail(mailOptions, function() {});
            }
         });

      });

   });