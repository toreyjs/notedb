/*                            url.parse(string).query
                                          |
           url.parse(string).pathname     |
                       |                  |
                       |                  |
                     ------ -------------------
http://localhost:8888/start?foo=bar&hello=world
                                ---       -----
                                 |          |
                                 |          |
              querystring(string)["foo"]    |
                                            |
                         querystring(string)["hello"]
*/

module.exports = function(app, handles) {
	app.get('/', handles.page.login);
	app.get('/login', handles.page.login);
	app.post('/login', handles.action.login);
	app.get('/logout', handles.action.logout);
	app.get('/settings', handles.page.userSettings);
	app.post('/settings', handles.action.userSettings);
	app.get('/start', handles.page.start);
	app.post('/upload', handles.upload);
	app.get('*', handles.page.page404);
}

/*function(handle, pathname, response, postData) {
	console.log("About to route a request for " + pathname);
	if(typeof handle[pathname] === "function") {
		handle[pathname](response, postData);
	}
	else {
		console.log("No request handler found for " + pathname);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 Not found");
		response.end();
	}
}*/