/**
 * On 'localtask' event, store the task, and eventually send an email
 */
var log_prefix = "[newtask-email-notification]";

module.exports = function(options, imports, register) {

   var logger = imports.logger,
       eventbus = imports.eventbus,
       mailer = imports.mailer;

   eventbus.on('taskCreated', function(task, taskURL) {
      if(task.emailNotification) {
         var notification = task.emailNotification;
         var mailOptions = {
            from: notification.from, // || config.mailer_transport.auth.email,
            to: notification.to,
            subject: notification.subject,
            text: "Hello world",
            html: "New task : <a href='"+taskURL+"'>Click here to do the task !</a>"
         };
         mailer.sendMail(mailOptions, function() {
            logger.info(log_prefix, "Email Sent !");
         });
      }
   });


   register(null, { "newtask-email-notification": {} });

};
