
exports.mailer_transport = {
    service: "Gmail",
    auth: {
        user: "xxxx",
        pass: "xxx"
    }
};

exports.server = {
    port: 3000,
    ip: 'localhost',
    host: 'localhost'
};


exports.mturk = {
    "url": "https://mechanicalturk.sandbox.amazonaws.com",
    "accessKeyId": "...",
    "secretAccessKey": "...",
    "region": "us-east-1",
    receptor: { port: 8080, host: undefined },
    poller: { frequency_ms: 60000 }
};
