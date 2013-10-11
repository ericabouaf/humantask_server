
exports.core = {

    httpServer: {
        port: 3000,
        host: 'localhost'
    },

    swfPoller: {
        domain: 'aws-swf-test-domain',
        taskList: {name: "aws-swf-tasklist" },
        identity: 'HumanTask server'
    }

};


exports.modules = {};



/**
 * LocalTask module
 */
exports.modules.localtask = {

    // For email notifications
    mailer_transport: {
        service: "Gmail",
        auth: {
            user: "xxxx",
            pass: "xxxx"
        }
    }

};

    



/**
 * Amazon Mechanichal Turk
 */
exports.modules.mturk = {
    url: "https://mechanicalturk.sandbox.amazonaws.com",
    accessKeyId: "...",
    secretAccessKey: "...",
    region: "us-east-1",
    receptor: { port: 8080, host: undefined },
    poller: { frequency_ms: 60000 }
};


/**
 * Textmaster configuration
 */
exports.modules.textmaster = {
    apikey: "xxxx",
    apisecret: "xxxx"
};


