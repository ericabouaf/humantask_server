
var util = require('util'),
    Task = require('./task').Task,
    config = require(__dirname + '/../../config.js'),
    querystring = require('querystring'),
    mturk = require('mturk')(config.mturk);

/**
 * MturkTask
 * @constructor
 *
 *
 * uses: https://github.com/jefftimesten/mturk
 *  BUT requires neyric's branch : https://github.com/neyric/mturk
 *
 */
var MturkTask = exports.MturkTask = function(taskToken, config) {
    Task.call(this, taskToken, config);
};

util.inherits(MturkTask, Task);


/**
 * Save the task in redis, and create the HIT on Mechanical Turk
 */
MturkTask.prototype.save = function(cb) {
   var that = this;
   Task.redisClient.set(this.taskToken, JSON.stringify(this.config), function(err) {
      if(err) { cb(err); return; }
      that.createHit(cb);
   });
};


/**
 * Create a HIT
 */
MturkTask.prototype.createHit = function (cb) {

   var mturkParams = this.config.mturk,
       price = new mturk.Price( String(mturkParams.reward), "USD"),
       that = this;

   var mturkShortToken = this.taskToken.substr(0,200);

   Task.redisClient.hset('mturk-shortener', mturkShortToken, this.taskToken, function(err, results) {

     mturk.HITType.create(mturkParams.title, mturkParams.description, price, mturkParams.duration, mturkParams.options, function(err, hitType) {

        if(err) { cb(err); return; }

        var options = {maxAssignments: mturkParams.maxAssignments || 1},
            lifeTimeInSeconds = 3600, // 1 hour
            questionXML = MturkTask.externalUrlXml("http://localhost:3000/mturk/"+querystring.escape(that.taskToken), 800);

        mturk.HIT.create(hitType.id, questionXML, lifeTimeInSeconds, {
           requesterAnnotation: JSON.stringify({taskToken: mturkShortToken })
        }, function(err, hit) {

           if(err) { cb(err); return; }
           cb(null, {hitType: hitType, hit: hit});

        });

     });

   });

};


MturkTask.findByShortToken = function(mturkShortToken, cb) {
  Task.redisClient.hget('mturk-shortener', mturkShortToken, function(err, taskToken) {
    Task.find(taskToken, cb);
  });
};


/**
 * Return the XML for an externalUrl HIT
 */
MturkTask.externalUrlXml = function (url, frameHeight) {
   return '<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">' +
          '<ExternalURL>' + url + '</ExternalURL>' +
          '<FrameHeight>' + frameHeight + '</FrameHeight>' +
          '</ExternalQuestion>';
};


Task.registerType('mturk', MturkTask);

