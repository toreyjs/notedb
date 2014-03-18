exports.action = {};
exports.page = {};

//{REGION Requires
var pageBuilder = require('./html.js');
var querystring = require("querystring");
var mongoose = require('mongoose');
var User = require('./schemas/user.js').model;
var Board = require('./schemas/board.js').model;
//var jade = require('jade');
/*
MongoDB 2.2 database added.  Please make note of these credentials:

   Root User:     admin
   Root Password: g8RgpGTXbgYQ
   Database Name: notedb
*/
// http://stackoverflow.com/questions/4688693/how-do-i-connect-to-mongodb-with-node-js-and-authenticate
//var Mongo = require('mongodb');
//var mongoDb = Mongo.Db;
//var mongoServer = Mongo.Server;
//var format = require('util').format;

//var MongoClient = Mongo.MongoClient;
//}END Requires

exports.action.login = function(req, res) {
	console.log("logging in");
	
	var username = req.body.username;
	var password = req.body.password;
	
	User.findByUsername(username, function(err, user) {
		if(user != null && password == user.password) {
			req.session.user = {};
			req.session.user.username = user.username;
			req.session.user.email = user.email;
			req.session.user._id = user._id;
			if(req.session.pagebeforelogin) {
				res.redirect(req.session.pagebeforelogin);
				req.session.pagebeforelogin = undefined;
			} else {
				res.redirect('/');
			}
		}else{
			res.submitMessage = "Incorrect Username / Password";
			exports.page.login(req, res);
		}
	});
}

exports.page.login = function(req, res) {
	console.log("Request handler 'login' was called.");

	if(req.session.user) {
		res.redirect('/');
	} else {
		var html = "\
		<form action='"+req.path+"' method='POST' style='display:inline-block; padding-right:10px;'>\
			<input type='text' name='username' placeholder='Username' /><br />\
			<input type='password' name='password' placeholder='Password' /><br />\
			<input type='submit' name='submit' value='Submit' />\
			<input type='reset' name='reset' value='Reset' />\
		</form>\
		\
		<div style='display:inline-block;'>\
			< Login <br />\
			<strong style='font-size:150%;'>OR</strong><br />\
			<a href='newuser'>Create new account</a>\
		</div>\
		";
		var page = pageBuilder.buildPage(html, "Login", req, res, res.submitMessage);
		
		writePage(res, page);
	}
};

exports.action.logout = function(req, res) {
	req.session.destroy();
	res.redirect('/login');
};

exports.action.newUser = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var repeatpassword = req.body.repeatpassword;
	var email = req.body.email;
	
	var message = "";
	var addError = function(msg) { message += ( message === "" ? msg : "<br />"+msg ) };
	User.findByUsername(username, function(err, user) {
		if(username.length < 6 || username.length > 32) {
			addError("Username must be between 6-32 characters long.");
		}
		else if(user != null) addError("Username already exists.");

		if(password.length < 6 || password.length > 32) addError("Password must be between 6-32 characters long.");
		if(password != repeatpassword) addError("Passwords do not match.");

		// http://www.javascriptkit.com/script/script2/acheck.shtml
		var emailFilter = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
		if(!emailFilter.test(email)) addError("Email not valid");

		if(message === "") {
			var newuser = new User({ username: username, password:password, email:email, displayName:username });
			newuser.save(function (err, newuser) {
				if (err) addError(err.message);
				if(message === "") {
					res.submitMessage = { type:"success", message:"Account Created." };
				} else {
					res.submitMessage = { type:"error", message:message };
				}
				exports.page.newUser(req, res);
			});
		} else {
			res.submitMessage = { type:"error", message:message };
			exports.page.newUser(req, res);
		}
	});
};

exports.page.newUser = function(req, res) {
	var html = "\
	<form action='"+req.path+"' method='POST'>\
	<table>\
		<tr><th>Username:	</th><td><input type='text' name='username' placeholder='Username' /></td></tr>\
		<tr><th>Password:	</th><td><input type='password' name='password' placeholder='Password' /></td></tr>\
		<tr><td>			</td><td><input type='password' name='repeatpassword' placeholder='Repeat Password' /></td></tr>\
		<tr><th>Email:		</th><td><input type='email' name='email' placeholder='User@Email.com' /></td></tr>\
		<tr><td></td>\
		<td>\
			<input type='submit' name='submit' value='Submit' />\
			<input type='reset' name='reset' value='Reset' />\
		</td></tr>\
	</table>\
	</form>\
	";
	
	writePage(res, pageBuilder.buildPage(html, "Create Account", req, res, res.submitMessage));
};

exports.page.staff = function(req, res) {
	var html = "";
	User.listStaff(function(err, staffList) {
		if(staffList.length == 0) {
			html = "No staff; new member needs to be created.";
		} else {
			if(requiresLogin(req, res)) return;
			if(!userIsStaff(req, res)) return;
			html = "Welcome, Oh god of dah login.";
		}
		writePage(res, pageBuilder.buildPage(html, "Admin Dashboard", req, res, res.submitMessage ));
	});
}

exports.action.staff = function(req, res) {
	var k;
	k = 0;
}

exports.page.userSettings = function(req, res) {
	if(requiresLogin(req, res)) return;
	User.findByUsername(req.session.user.username, function(err, user) {
		var html = "\
		<form method='POST' action='"+req.path+"'>\
			<table>\
				<tr>\
					<th>Account Created</th>\
					<td>"+user.creationDate+"</td>\
				</tr>\
				<tr>\
					<td></td><td><input type='submit' value='Save' /></td>\
				</tr>\
			</table>\
		</form>\
		";
		writePage(res, pageBuilder.buildPage(html, "Settings", req, res, res.submitMessage ));
	});
}

exports.action.userSettings = function(req, res) {
	console.log("Updating Settings.");
	if(requiresLogin(req, res)) return;
	var message = "";
	
	if(message === "") {
		res.submitMessage = { type:"success", message:"Settings Saved!" };
	} else {
		res.submitMessage = { type:"error", message:message };
	}
	exports.page.userSettings(req, res);
}

exports.page.home = function(req, res) {
	if(requiresLogin(req, res)) return;

	Board.findByUser(req.session.user._id, function(err, boards) {
		var html = "<h2>Boards</h2>";
		if(boards.length == 0) {
			html += "<p>You currently have no boards.</p>";
		} else {
			html += "<ul>";
			for(var i in boards)
			{ var board = boards[i];
				html += "<li><a href='/board/"+board._id+"'>"+board.boardName+"</a></li>";
			}
			html += "</ul>";
		}
		writePage(res, pageBuilder.buildPage(html, "Home", req, res, res.submitMessage ));
	});
}

exports.page.board = function(req, res) {
	var boardId = req.params.board;
	Board.findById(boardId, function(err, board) {
		var html = "<p>"+board.creationDate+"</p>";
		writePage(res, pageBuilder.buildPage(html, board.boardName, req, res, res.submitMessage ));
	});
}

exports.page.createBoard = function(req, res) {
	if(requiresLogin(req, res)) return;

	var html = "\
	<form action='"+req.path+"' method='POST'>\
		<input type='text' name='boardName' placeholder='Board Name' />\
		<select name='privacy'>\
			 <option value='0' selected>Public</option>\
			 <option value='1'>Private</option>\
			 <option value='2' disabled>Public to Organization</option>\
		</select>\
		<br />\
		<input type='submit' value='Create Board' />\
	</form>";
	writePage(res, pageBuilder.buildPage(html, "Create New Board", req, res, res.submitMessage ));
}

exports.action.createBoard = function(req, res) {
	if(requiresLogin(req, res)) return;

	var boardName = req.body.boardName;
	var organization = req.body.organization;
	var privacy = req.body.privacy;

	var message = "";
	var addError = function(msg) { message += ( message === "" ? msg : "<br />"+msg ) };

	if(boardName.length < 6 || boardName.length > 128) addError("Board Name must be between 6-128 characters long.");

	if(message === "") {
		var newboard = new Board({ boardName: boardName, boardType: privacy, users:[{ playerID:req.session.user._id, access:3 }] });
		newboard.save(function (err, newboard) {
			if (err) addError(err.message);
			var submitMessage = ( message === "" ? { type:"success", message:"Board Created." } : { type:"error", message:message } );
			getAfterPost('createBoard', req, res, submitMessage);
		});
	} else {
		getAfterPost('createBoard', req, res, { type:"error", message:message });
	}
}

/*exports.upload = function(req, res) {
	if(requiresLogin(req, res)) return;
	
	collectPostData(req, res, function(data) {
		var html = "You've sent: " + querystring.parse(data).text;
		writePage(res, pageBuilder.buildPage(html, "Upload", req, res));
	});
}*/

exports.page.page404 = function(req, res) {
	var html = "<strong>That web page doesn't exist.</strong>";
	writePage(res, pageBuilder.buildPage(html, "404", req, res, { type:"error", message:"HTTP Status Code: 404" }), { code:404 });
};

//{REGION Helper Functions

function requiresLogin(req, res) {
	if(req.session.user === undefined) {
		req.session.pagebeforelogin = req.path;
		res.redirect('/login');
		return true;
	}
	return false;
}

function userIsStaff(req, res) {
	User.findByUsername(req.session.user.username, function(err, user) {
		if(user.access == 2) {
			return true;
		} else {
			var html = "<strong>You do not have the correct permissions to view this page.</strong>";
			writePage(res, pageBuilder.buildPage(html, "403", req, res, { type:"error", message:"HTTP Status Code: 403" }), { code:403 });
			return false;
		}
	});
}

function collectPostData(req, res, callback) {
	req.setEncoding("utf8"); // Make sure it's a string
	
	var postData = "";
	// Collect all the POST data before routing the request so that the requestHandler has all the information it would need to know.
	req.addListener("data", function(postDataChunk) {
		postData += postDataChunk;
		//console.log("Received POST data chunk '"+postDataChunk + "'.");
	});
	
	req.addListener("end", function() {
		callback(postData);
	});
}

function getAfterPost(page, req, res, error) {
	if(error) res.submitMessage = error;
	exports.page[page](req, res);
}

/*
	res		: response
	page	: html code
	options	: optional - an object with different possible variables 
			type : defaults to {"Content-Type":"text/html"}
			code : defaults to 200
*/
function writePage(res, page, options) {
	var code = 200, type = {"Content-Type":"text/html"};
	if(options !== undefined) {
		if(options.code !== undefined) code = options.code;
		if(options.type !== undefined) type = options.type;
	}
	
	res.writeHead(code, type);
	res.write(page);
	res.end();
}

//}END Helper Functions