

module.exports = function(options, imports, register) {

	var app = imports.httpserver.app,
		eventbus = imports.eventbus;


	/**
	 * POST /task
	 * Creates a new task
	 *
	 * curl -X POST http://localhost:3000/task
	 */
	app.post('/task', function(req, res) {

		// TODO: the task API !!!!!

		var nHandlers = eventbus.emit('localtask', '12345678', {
			input: JSON.stringify({ some: "data" })
		});

		if(nHandlers === 0) {
			res.json({error: 'No Handler for this event !', msg: 'Ok !'});
		}
		else {
			res.json({error: null, msg: 'Ok !'});
		}

	});

    register(null, {
        "api": {}
    });

};

