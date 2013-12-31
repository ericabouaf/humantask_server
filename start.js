#!/usr/bin/env node

var architect = require('architect'),
    config = require('./config.js'),
    tree = architect.resolveConfig(config, __dirname);

architect.createApp(tree, function() {
    console.log("Application started !");
});