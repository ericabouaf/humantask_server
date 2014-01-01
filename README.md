# MuTaskHub

MuTaskHub is a webserver that simplifies *microtasks* integration into your application.

Microtasks are HTML/CSS/JS documents containing a form that a human has to fill to complete the task.

Here is the basic sequence diagram for MuTaskHub :

````
    Your Application             MuTaskHub                  Someone
     (Task Provider)                                    (Task Performer)
    ================             =========                  =======
           |                         |                         |
  1. API call to MuTask -------> Store Task                    |
           |                         |                         |
           |                2.Send Notifications ------------> |
           |                         |                         |
           |                         |  <--------------> 3. Fetch Task
           |                         |                         |
           |                  Store results <----------- 4. Perform Task
           |                         |                         |
           |  <-------------- 5. Send results                  |
           |                         |                         |
````


## Advantages

 * Using MuTaskHub frees your application from handling the logic of human tasks. You can just consider them as delayed/asynchronous jobs

 * You can easily switch performers, between the local task mode and Amazon Mechanical Turk for example. Is is extremely useful when developping Mechanical Turk workflows.

 * The plugin architecture let's you add "performers" easily (new market places, etc...)


## Existing Plugins

The following plugins are included in the distribution :


Providers :

 * aws-swf-provider: Amazon SimpleWorkflow activity worker

Performers :

 * mturk-performer: Runs the microtasks on the Amazon Mechanical Turk platform
 * textmaster-performer: Translation or content creation on TextMaster


## Usage Example

POST /task

    {
      "type": "local",
      "data": [{"label": "this"},{"label": "list"}, {"label": "is"}, {"label": "templated"}],
      "template": "HTML for this task. Use mustache templating with the data above.",

      "webhook-reporter": "http://requestb.in/scdzhysc"
    }




## Requirements

 * Node.JS
 * Redis


## Running

 * clone the git repo (or download)
 * run install.sh (simply runs npm install on every core plugin)
 * start redis server
 * copy config.example.js to config.js
 * edit config.js with your settings
 * node start.js
