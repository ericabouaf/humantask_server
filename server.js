#!/usr/bin/env node

var express = require('express'),
    winston = require('winston'),
    expressLayouts = require('express-ejs-layouts'),
    ejs = require('ejs');

var winston_prefix = "[HTTP Server]";


/**
 * Logger
 */

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	colorize: true
});

/**
 * HTTP SERVER
 */


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

require('./app/controllers/tasks_controller').controller(app);

// start the server
app.listen(app.config.server.port, app.config.server.host);

winston.info(winston_prefix, "Listening on http://"+app.config.server.host+":"+app.config.server.port);



/**
 * The pollers
 */

require('./app/pollers/mturk-poller')(app.config);
require('./app/pollers/swf-poller')(app.config);

