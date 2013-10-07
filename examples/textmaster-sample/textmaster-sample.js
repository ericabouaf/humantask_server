
/**
 *
 * swf-register "textmaster-sample" -k workflow
 *
 * swf-start textmaster-sample
 *
 */

if( has_workflow_just_started() ) {
  schedule({
    name: 'step1',
    activity: 'humantask',

    input: {

        type: 'textmaster',


        "data": {
          
            project: {
              name: 'What age should you start your kids playing golf ?',
              language_from: 'en',
              language_to: 'en',
              category: 'C027',
              vocabulary_type: 'popular',
              target_reader_groups: 'adults',
              grammatical_person: 'third_person_singular_masculine',
              custom_data: {},
              project_briefing: 'The goal is to provide an overview of the pros and cons of golfing for young kids. The articles should be helpful to parents to help them choose the best age.',
            },

            "document": {

              title: 'What age should you start your kids playing golf',
              instructions: 'The goal is to provide an overview of the pros and cons of golfing for young kids. The articles should be helpful to parents to help them choose the best age.',
              word_count: 300,
              word_count_rule: 1
            }

        }
        
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
