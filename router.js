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
	app.get('/', handles.page.home);
	both(app, '/login', handles.page.login, handles.action.login);
	app.get('/logout', handles.action.logout);
	both(app, '/newuser', handles.page.newUser, handles.action.newUser);
	both(app, '/settings', handles.page.userSettings, handles.action.userSettings);
	both(app, '/createboard', handles.page.createBoard, handles.action.createBoard);
	both(app, '/staff', handles.page.staff, handles.action.staff);
	app.get('/board/:board', handles.page.board);
	//app.get('/start', handles.page.start);
	//app.post('/upload', handles.upload);
	app.get('*', handles.page.page404);
}

function both(app, pathname, get, post) {
	app.get(pathname, get);
	app.post(pathname, post);
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