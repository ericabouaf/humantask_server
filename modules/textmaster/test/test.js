

var textmaster = require('./textmaster.js').textmaster;

textmaster.setCredentials("xxxx", "xxxx");

/*textmaster.test(function(err, res) {
	console.log(res);
});*/

/*textmaster.projects(function(err, res) {
	console.log(res);
});*/

textmaster.documents('xxxx', function(err, res) {
	console.log(JSON.stringify(res, null, 3) );
}); 

