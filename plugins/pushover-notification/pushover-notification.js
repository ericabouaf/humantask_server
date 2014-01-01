/**
 * Pushover notification
 */

var push = require( 'pushover-notifications' );

var log_prefix = "[pushover-notification]";

module.exports = function(options, imports, register) {

   var logger = imports.logger,
       eventbus = imports.eventbus;

   var p = new push({ token: options.apptoken });

   eventbus.on('taskCreated', function(task, taskURL) {
      if(task.pushoverNotification) {

        var notif = task.pushoverNotification;


        var msg = {
            user: notif.user,
            message: 'New task ready at '+taskURL,
            title: notif.title || "Well - this is fantastic",
            sound: 'magic', // optional
            priority: 1 // optional
        };

        p.send( msg, function( err, result ) {
            if ( err ) {
                throw err;
            }
            logger.info(log_prefix, "Notification Sent !", result);
        });

      }
   });


   register(null, { "pushover-notification": {} });

};
