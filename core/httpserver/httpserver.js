/**
 * Basic Express.js HTTP server
 */

var express = require('express'),
    expressLayouts = require('express-ejs-layouts'),
    ejs = require('ejs'),
    path = require('path');

var log_prefix = "[httpserver]";

module.exports = function(options, imports, register) {

    var logger = imports.logger;

    var app = express();

    app.configure(function(){
       app.use(express.static( path.join(__dirname , '..', '..', 'public')));
       app.set('views', path.join(__dirname , '..', '..') );
       app.set('view engine', 'ejs');
       app.use(expressLayouts);
       app.use(express.bodyParser());
    });


    // start the server
    app.config = options;
    app.listen(options.port, options.host);

    logger.info(log_prefix, "Listening on http://"+options.host+":"+options.port);

    register(null, {
        "httpserver": {
          app: app
        }
    });
};
