
var nodemailer = require('nodemailer');

var log_prefix = "[mailer]";

module.exports = function(options, imports, register) {

    var logger = imports.logger;

	var smtpTransport = nodemailer.createTransport("SMTP", options);

    register(null, {
        "mailer": {
            sendMail: function(mailOptions, cb) {
    			logger.info(log_prefix, "Sending mail to : "+mailOptions.to);
			   	smtpTransport.sendMail(mailOptions, cb);
            }
        }
    });

};