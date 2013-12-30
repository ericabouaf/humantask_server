/**
 * HTTP SERVER
 */

var express = require('express'),
    winston = require('winston'),
    expressLayouts = require('express-ejs-layouts'),
    ejs = require('ejs'),
    path = require('path');

var winston_prefix = "[HTTP Server]";


module.exports = function(httpServerConfig) {

	var app = express();

	app.configure(function(){
	   app.use(express.static( path.join(__dirname , '..', 'public')));
	   app.set('views', path.join(__dirname , '..', 'modules') );
	   app.set('view engine', 'ejs');
	   app.use(expressLayouts);
	   app.use(express.bodyParser());
	});


	// start the server
	app.config = httpServerConfig;
	app.listen(httpServerConfig.port, httpServerConfig.host);

	winston.info(winston_prefix, "Listening on http://"+httpServerConfig.host+":"+httpServerConfig.port);

	return app;
};
