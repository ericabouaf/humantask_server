#!/usr/bin/env node

var express = require('express'),
    winston = require('winston'),
    expressLayouts = require('express-ejs-layouts'),
    ejs = require('ejs');

var winston_prefix = "[HTTP Server]";


module.exports = function(httpServerConfig) {

	/**
	 * HTTP SERVER
	 */

	var app = express();

	app.configure(function(){
	   app.use(express.static(__dirname + '/../../public'));
	   app.set('views', __dirname + '/..');
	   app.set('view engine', 'ejs');
	   app.use(expressLayouts);
	   app.use(express.bodyParser());
	});


	// start the server
	app.listen(httpServerConfig.port, httpServerConfig.host);

	winston.info(winston_prefix, "Listening on http://"+httpServerConfig.host+":"+httpServerConfig.port);

	return app;
};
