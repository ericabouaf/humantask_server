# Amazon SimpleWorflow provider

This plugin creates an Amazon SimpleWorkflow (SWF) Activity Type which is performed by the MuTask Hub.

It allows to integrate human microtasks into any SWF workflow. (LocalTasks, Mechanical Turk, etc...)




## Requirements

 * an AWS account with SWF permissions.



## Setup

 * Configure the plugin into your config.js :

````json
    {
        packagePath: './plugins/aws-swf-provider',
        domain: 'aws-swf-test-domain',
        taskList: {name: "aws-swf-tasklist" },
        identity: 'MuTask Hub'
    }
````



## Usage


When you create the SWF activity, the *'input' field must be encoded in JSON* :


````json
{
 "data": [{"label": "this"},{"label": "list"}, {"label": "is"}, {"label": "templated"}],
 "template": "HTML for this task. Use mustache templating with the data above.<br> Enter your name: <input name='myname'/><br> <button type='submit' class='btn'>Submit</button>",

 "performer": {
   "type": "local"
 }

}
````




## Important consideration

Human tasks can take a long time... The default SWF timeouts should be disabled :

````json
    {
        "defaultTaskHeartbeatTimeout": "NONE",
        "defaultTaskScheduleToCloseTimeout": "NONE",
        "defaultTaskScheduleToStartTimeout": "NONE",
        "defaultTaskStartToCloseTimeout": "NONE",
    }
````
