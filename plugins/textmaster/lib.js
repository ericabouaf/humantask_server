
var request = require('request'),
  crypto = require('crypto');


var _apikey, _apisecret;

var baseUrl = 'http://api.textmaster.com/v1/clients';

var textmaster = exports.textmaster = {

  setCredentials: function(apikey, apisecret) {
    _apikey = apikey;
    _apisecret = apisecret;
  },


  _request: function(conf, cb) {
    var o = {};

    for(var k in conf) {
      if(conf.hasOwnProperty(k)) {
        o[k] = conf[k];
      }
    }

    o.headers = this._signature();

    request(o, function(err, result) {
      if(err) { cb(err); return; }
      var res = result.body;
      if(typeof res === "string") {
        res = JSON.parse(result.body);
      }
      cb(null, res);
    });
  },

  _signature: function() {
    var nowStr = (new Date()).toISOString().replace('T',' ').substr(0,19);

    var shasum = crypto.createHash('sha1');
    shasum.update(_apisecret + nowStr);

    return {
      "APIKEY": _apikey,
      "DATE": nowStr,
      "SIGNATURE": shasum.digest('hex')
    };
  },

  test: function(cb) {
    this._request({
      method: 'GET',
      url: 'http://api.textmaster.com/test'
    }, cb);
  },


  work_templates: function(cb) {
    this._request({
      method: 'GET',
      url: baseUrl + "/work_templates"
    }, cb);
  },

  projects: function(cb) {
    this._request({
      method: 'GET',
      url: baseUrl + "/projects"
    }, cb);
  },

  create_project: function(project, cb) {
    this._request({
      method: 'POST',
      url: baseUrl + "/projects",
      json: {project: project}
    }, cb);
  },

  launch_project: function(projectId, cb) {
    this._request({
      method: 'PUT',
      url: baseUrl + "/projects/"+projectId+"/launch"
    }, cb);
  },

  projects_inreview: function(cb) {
    this._request({
      method: 'GET',
      url: baseUrl + "/projects?status=in_review"
    }, cb);
  },

  documents: function(project_id, cb) {
    this._request({
      method: 'GET',
      url: baseUrl + "/projects/"+project_id+"/documents"
    }, cb);
  }

};
