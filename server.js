/* Main application entry file. Please note, the order of loading is important.
 * Configuration loading and booting of controllers and custom error handlers */

var express = require('express'),
    expressLayouts = require('express-ejs-layouts'),
    redis = require("redis");

var app = express();

// Load configurations
app.config = require('./config.js');

// Redis client
app.redisClient = redis.createClient();

app.configure(function(){
   app.use(express.static(__dirname + '/public'));
   app.set('views', __dirname + '/app/views');
   app.set('view engine', 'ejs');
   app.set('layout', 'layout'); // defaults to 'layout'     
   app.use(expressLayouts);
   app.use(express.bodyParser());
});



require('./app/controllers/api_controller.js')(app);
require('./app/controllers/ui_controller.js')(app);


// start the server
app.listen(app.config.server.port, app.config.server.ip);

console.log("App started in '"+app.set('env')+"' environment !\n" +
            "Listening on http://"+app.config.server.host+":"+app.config.server.port);
