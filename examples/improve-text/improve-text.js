/*global mturk,workflow_input,results,stop,COMPLETED*/

// swf-start improve-text  "{\"text_to_improve\":\"this is a test\"}"

var no_timeout = {
  // No timeout
  heartbeatTimeout: "NONE",
  scheduleToCloseTimeout: "NONE",
  scheduleToStartTimeout: "NONE",
  startToCloseTimeout: "NONE"
};

////////////
// Helpers
////////////

function improveHitResult(i) {
   return (i === -1) ? workflow_input().text_to_improve : results('improve-hit-'+i).newText;
}

function improveHit(i) {
  return function() {

        var text_to_improve;

        if(i === 0) {
          text_to_improve = workflow_input().text_to_improve;
        }
        else {
         // "a" or "b"
         var SelectionIdentifier = results('vote-hit-'+(i-1)).vote;

         var textA = improveHitResult(i-2);
         var textB = improveHitResult(i-1);

          text_to_improve = (SelectionIdentifier === "textA") ? textA : textB;
        }

        return {

          mturk: {
            title : "Improve Text",
            description : "Improve a small paragraph toward a goal.",
            reward : 0.02,
            duration : 5 * 60
          },

          type: 'local',

          data: {
            text_to_improve: text_to_improve
          },
          template: file('./improve-text/improve-text.html')


        };
      };
}

function voteHit(i) {
  return function() {
        var textA = improveHitResult(i-1); // TODO: le vote ne doit pas se faire avec le improve-hit i-1, mais avec le résultat du vote précédent !
        var textB = improveHitResult(i);

        return {

          mturk: {
            title : "Vote on Text Improvement",
            description : "Decide which two small paragraphs is closer to a goal.",
            reward : 0.01,
            duration: 3600, /* 1 hour*/
            maxAssignments : 1
          },

          type: 'local',

          data: {
            textA: textA,
            textB: textB
          },

          template: file('./improve-text/vote-hit.html')

        };
    };
}


////////////
// Process
////////////

for(var i = 0 ; i < 5 ; i++) {

   // Improve Hit
   if( ((i === 0) || completed('vote-hit-'+(i-1))) && !scheduled('improve-hit-'+i) ) {
     schedule({
        name: 'improve-hit-'+i,
        activity: 'humantask',
        input: improveHit(i)
     }, no_timeout);
   }

   // Vote Hit
   if( completed('improve-hit-'+i) && !scheduled('vote-hit-'+i) ) {
     schedule({
        name: 'vote-hit-'+i,
        activity: 'humantask',
        input: voteHit(i)
     }, no_timeout);
    }
}



if( completed('vote-hit-4') ) {
  stop({
     result: 'Everything is good !'
  });
}

