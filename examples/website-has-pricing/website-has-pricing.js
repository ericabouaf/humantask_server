/**
 * To register the workflow:
 *     swf-register "website-has-pricing" -k workflow
 *
 * Then, start a decider worker:
 *     cd examples
 *     swf-decider
 *
 * Start a workflow instance:
 *     swf-start website-has-pricing
 *
 */

if( has_workflow_just_started() ) {
  schedule({
    name: 'step1',
    activity: 'mutaskhub',
    input: {

        "performer": {
            "type": "local"
        },

        "data": {
          //url: "http://www.institut-beautyqueen.fr"
          url: "http://www.yves-rocher.fr/control/epm/france/fr/moncdb/at/europe/france/ile-de-france/paris/paris-rivoli"
        },

        template: file('./website-has-pricing/template.html')
    }
  });
}

if(completed('step1') && !scheduled('step2')) {
  schedule({
    name: 'step2',
    activity: 'mutaskhub',
    input: {

        "performer": {
            "type": "local"
        },

        "data": {
          url: results('step1').src,
          categories: [
            {
              name: "Epilation"
            },
            {
              name: "Massage"
            },
            {
              name: "Soins du visage"
            },
            {
              name: "Soins des mains"
            },
            {
              name: "Soins des cheveux"
            },
            {
              name: "Maquillage"
            }
          ]
        },

        template: file('./website-has-pricing/find-categories.html')
    }
  });
}

if( completed('step2') ) {
  stop({
    result: {
      label: "finished !",
      data: results('step1'),
      categories: results('step2')
    }
  });
}
