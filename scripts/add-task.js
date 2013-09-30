
var Task = require('../app/models/task.js').Task;

var t = new Task('1234567890', {

  type: 'local',

   emailNotification: {
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
             "<button type='submit' class='btn btn-primary' id='submitButton'>Submit</button>"+
             "</fieldset>"
});

t.save(function(err, results) {
   console.log(err, results);
});
