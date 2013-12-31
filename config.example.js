module.exports = [

    /**
     * Core Modules
     */
    {
        packagePath: './plugins/eventbus'
    },
    {
        packagePath: './plugins/logger'
    },
    {
        packagePath: './plugins/redis-client'
    },
    {
        packagePath: './plugins/aws-swf-client'
    },
    {
        packagePath: './plugins/swf-poller',
        domain: 'aws-swf-test-domain',
        taskList: {name: "aws-swf-tasklist" },
        identity: 'HumanTask server'
    },
    {
        packagePath: './plugins/http-server',
        port: 3000,
        host: 'localhost'
    }

    /**
     * Task Modules
     */
    /*,{
        packagePath: './plugins/localtask',

        // For email notifications
        mailer_transport: {
            service: "Gmail",
            auth: {
                user: "xxx",
                pass: "xxx"
            }
        }
    }*/

    // Amazon Mechanical Turk
    /*,{
        packagePath: './plugins/mturk',

        url: "https://mechanicalturk.sandbox.amazonaws.com",
        accessKeyId: "xxx",
        secretAccessKey: "xxxx",
        region: "us-east-1",
        receptor: { port: 8080, host: undefined },
        poller: { frequency_ms: 60000 }
    }*/

    // Textmaster
    /*,{
        packagePath: './plugins/textmaster',
        apikey: "xxxx",
        apisecret: "xxxx"
    }*/
];
