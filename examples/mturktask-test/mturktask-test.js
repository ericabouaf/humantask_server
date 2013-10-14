/**
 * Simple mturk task test
 *
 * To register the workflow:
 *     swf-register "mturktask-test" -k workflow
 *
 * Then, start a decider worker:
 *     cd examples
 *     swf-decider
 *
 * Start a workflow instance:
 *     swf-start mturktask-test
 *
 */
if( has_workflow_just_started() ) {
  schedule({
    name: 'step1',
    activity: 'mturk',
    input: {
       mturk: {
          title : "Vote on Text Improvement",
          description : "Decide which two small paragraphs is closer to a goal.",
          reward : 0.01,
          duration: 3600, // 1 hour
          maxAssignments : 1
        },
        "data": [{label: "this"},{label: "list"}, {label: "is"}, {label: "templated"}],
        template: "<h1>Label an image</h1>"+
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
    }
  });
}

if( completed('step1') ) {
  stop({
    result: {
      label: "finished !",
      data: results('step1')
    }
  });
}
