
/**
 * uses: https://github.com/jefftimesten/mturk
 *  BUT requires neyric's branch : https://github.com/neyric/mturk
 */


var querystring = require('querystring');

var mturk, _redisClient, _app;

module.exports = {

    createTask: function (taskToken, config, cb) {

      _redisClient.set(taskToken, JSON.stringify(config), function(err) {
        if(err) { cb(err); return; }


        /**
         * Create a HIT
         */
         var mturkParams = config.mturk,
             price = new mturk.Price( String(mturkParams.reward), "USD");

         var mturkShortToken = taskToken.substr(0,200);

         _redisClient.hset('mturk-shortener', mturkShortToken, taskToken, function(err, results) {

           mturk.HITType.create(mturkParams.title, mturkParams.description, price, mturkParams.duration, mturkParams.options, function(err, hitType) {

              if(err) { cb(err); return; }

              var options = {maxAssignments: mturkParams.maxAssignments || 1},
                  lifeTimeInSeconds = 3600, // 1 hour
                  questionXML = externalUrlXml("http://"+_app.config.host+":"+_app.config.port+"/mturk/"+querystring.escape(taskToken), 800);

              mturk.HIT.create(hitType.id, questionXML, lifeTimeInSeconds, {
                 requesterAnnotation: JSON.stringify({taskToken: mturkShortToken })
              }, function(err, hit) {

                 if(err) { cb(err); return; }
                 cb(null, {hitType: hitType, hit: hit});

              });

           });

         });



      });
       
   },


    start: function(app, redisClient, swfClient, moduleConfig) {

      mturk = require('mturk')(moduleConfig);

      _app = app;
      _redisClient = redisClient;

      require('./http-server')(app, redisClient, swfClient, moduleConfig);

      require('./poller')(app, redisClient, swfClient, moduleConfig);

    }


};





/**
 * Return the XML for an externalUrl HIT
 */
var externalUrlXml = function (url, frameHeight) {
   return '<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">' +
          '<ExternalURL>' + url + '</ExternalURL>' +
          '<FrameHeight>' + frameHeight + '</FrameHeight>' +
          '</ExternalQuestion>';
};


