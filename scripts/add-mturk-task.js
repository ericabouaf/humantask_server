
var MturkTask = require('../app/models/mturk-task.js').MturkTask;

var t = new MturkTask('1234567890', {

   type: 'mturk', // should be set automatically

   mturk: {
      title : "Vote on Text Improvement",
      description : "Decide which two small paragraphs is closer to a goal.",
      reward : 0.01,
      duration: 3600, // 1 hour
      maxAssignments : 1,
      options: {}
   },

   "email-notification": {
      to: "eric.abouaf@gmail.com",
      subject: "Ceci est un test !"
   },

   "data": [{label: "this"},{label: "list"}, {label: "is"}, {label: "templated"}],
   template: "<h1>Default humantask template</h1>"+
             "<ul>"+
             "{{#data}}<li>{{label}}</li>{{/data}}"+
             "</ul>"+
             "<img src='http://groups.csail.mit.edu/uid/turkit/www/nut_people.jpg' alt='description not available'></img>"+
             "<fieldset>"+
             "<legend>Legend</legend>"+
             "<label>Label name</label>"+
             "<input type='text' placeholder='Type something...' name='firstfield'>"+
             "<span class='help-block'>Example block-level help text here.</span>"+
             "<label class='checkbox'>"+
             "<input type='checkbox' name='mybool'> Check me out"+
             "</label>"+
             "<button type='submit' class='btn btn-primary'>Submit</button>"+
             "</fieldset>"
});

t.save(function(err, results) {

   if(err) {
      console.log("error !", err);
      return;
   }
   console.log(results);
});
