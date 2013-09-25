

var HumanTask = exports.HumanTask = function(taskToken, activity) {

};


HumanTask.prototype = {


    save: function() {

       app.redisClient.set(taskToken, JSON.stringify(activity), function(err, results) {

          app.redisClient.rpush("open", taskToken, function(err, results) {      

             // Send email notification
             var input = JSON.parse(activity.input);
             if(input["email-notification"]) {
                sendNotification(input["email-notification"], taskToken, app.config);
             }

             res.send('OK !');

          });

       });
       
    }

};