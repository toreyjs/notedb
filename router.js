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
	var a = app, h = handles;
	app.get(	'/', handles.page.home);
	both(a,h,	'/login', 'login');
	app.get(	'/logout', handles.action.logout);
	both(a,h,	'/newuser', 'newUser');
	both(a,h,	'/createboard', 'createBoard');
	both(a,h,	'/createorganization', 'createOrganization');
	both(a,h,	'/staff/:page', 'staffPage');
	both(a,h,	'/staff', 'staff');

	app.get(	'/user/:username', handles.page.user);
	both(a,h,	'/user/:username/settings', 'userSettings');
	both(a,h,	'/board/:board', 'board');
	both(a,h,	'/board/:board/settings', 'boardSettings');
	both(a,h,	'/organization/:organization', 'organization');
	both(a,h,	'/organization/:organization/settings', 'organizationSettings');

	both(a,h,	'*', 'page404');
}

function both(app, handles, pathname, name, namePost/*optional*/) {
	app.get(pathname, handles.page[name]);
	app.post(pathname, handles.action[(namePost == undefined ? name : namePost)]);
}