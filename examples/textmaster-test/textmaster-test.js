/**
 * Simple textmaster test
 *
 * To register the workflow:
 *     swf-register "textmaster-test" -k workflow
 *
 * Then, start a decider worker:
 *     cd examples
 *     swf-decider
 *
 * Start a workflow instance:
 *     swf-start textmaster-test
 *
 * Documentation: http://us.textmaster.com/developer/documentation
 *
 */

if( has_workflow_just_started() ) {
  schedule({
    name: 'step1',
    activity: 'textmaster',
    input: {
        name: "What age should you start your kids playing golf ?",
        ctype: "copywriting", // or "translation" or "proofreading"
        options: {
          language_level: "regular" // or "premium"
          /*quality (true / false)
          expertise (true / false)
          specific_attachment (true / false)
          priority (true / false)*/
        },
        language_from: 'en',
        language_to: 'en',
        category: 'C027', // sport
        project_briefing: "The goal is to provide an overview of the pros and cons of golfing for young kids. The articles should be helpful to parents to help them choose the best age.",
        same_author_must_do_entire_project: false,
        work_template: "2_paragraphs",
        vocabulary_type: 'popular',
        grammatical_person: 'not_specified',
        target_reader_groups: 'not_specified',
        documents: [
            {
              title: 'What age should you start your kids playing golf ?',
              type: 'standard',
              word_count: 200,
              word_count_rule: 0,
              original_content: ''
            }
        ]

    }
  }, {
       // No timeout
       heartbeatTimeout: "NONE",
       scheduleToCloseTimeout: "NONE",
       scheduleToStartTimeout: "NONE",
       startToCloseTimeout: "NONE"
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
