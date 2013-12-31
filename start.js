#!/usr/bin/env node

var architect = require('architect'),
    config = require('./config.js'),
    tree = architect.resolveConfig(config, __dirname);

architect.createApp(tree, function(err, architectApp) {
	if(err) { console.log(err); }
    console.log("Application started !");
});