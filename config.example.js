module.exports = [

    /**
     * Core Modules
     *
     * You should probably not remove any of them, except changing the options parameters
     */
    { packagePath: './core/eventbus' },
    { packagePath: './core/logger' },
    { packagePath: './core/redis' },
    {
        packagePath: './core/httpserver',
        port: 3000,
        host: 'localhost'
    },
    { packagePath: './core/api' },


    /**
     * Local task modules
     */

    { packagePath: './core/localtask' },
    { packagePath: './core/webhook-reporter' }

    , {
        packagePath: './core/mailer',
        service: "Gmail",
        auth: {
            user: "xxxxxxx",
            pass: "xxxxxxx"
        }
    }
    ,{ packagePath: './core/newtask-email-notification' }

    /**
     * Optional plugins
     */


    /*,{
      packagePath: './plugins/pushover-notification',
      apptoken: "xxxxxxx"
    }*/

    /*,{
        packagePath: './core/aws-swf-provider',

        domain: 'aws-swf-test-domain',
        taskList: {name: "aws-swf-tasklist" },
        identity: 'HumanTask server',

        accessKeyId: "xxxxxx",
        secretAccessKey: "xxxx",
        region: "us-east-1"
    }*/

    // Amazon Mechanical Turk
    /*,{
        packagePath: './core/mturk-performer',

        url: "https://mechanicalturk.sandbox.amazonaws.com",
        accessKeyId: "xxxxxx",
        secretAccessKey: "xxxxxx",
        region: "us-east-1",
        receptor: { port: 8080, host: undefined },
        poller: { frequency_ms: 60000 }
    }*/

    // Textmaster
    /*,{
        packagePath: './plugins/textmaster-performer',
        apikey: "xxxxxx",
        apisecret: "xxxxx"
    }*/
];
