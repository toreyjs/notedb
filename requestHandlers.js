exports.action = {};
exports.page = {};

//{REGION Requires
var pageBuilder = require('./html.js');
var querystring = require("querystring");
var mongoose = require('mongoose');
var User = require('./schemas/user.js').model;
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
	
	if(username == "username" && password == "qwerty") {
		req.session.user = {};
		req.session.user.username = "username";
		req.session.user.email = "tjs7664@g.rit.edu";
		res.redirect('/start');
	}else{
		res.submitMessage = "Incorrect Username / Password";
		exports.page.login(req, res);
	}
}

exports.page.login = function(req, res) {
	console.log("Request handler 'login' was called.");

	//console.log('Connection:');
	// for(var i in mongoose.connection) {
	// 	if(typeof mongoose.connection[i] !== "function")
	// 		console.log(i+": "+mongoose.connection[i]);
	// }

	// var conn = new Mongo("notedb-tjs7664.rhcloud.com", 27017);
	// var db = conn.getDB("notedb");

	// if (!db.authenticate("admin", "g8RgpGTXbgYQ".toCharArray())) {
	// 	throw new MongoException("unable to authenticate");
	// }

	// var db = mongoose.connection;
	// db.on('error', console.error.bind(console, 'connection error:'));
	// db.once('open', function() {
	// 	console.log("yay");
	// });
	
	if(req.session.user) {
		res.redirect('/start');
	} else {
		// http://stackoverflow.com/questions/4688693/how-do-i-connect-to-mongodb-with-node-js-and-authenticate
		/*var db = new mongodb( "notedb", new mongo.Server( 'http://notedb-tjs7664.rhcloud.com/', 27017, {auto_reconnect: false, poolSize: 4}), {w:0, native_parser: false});
		db.open(function(err, db) {
			console.log(""+err);
			//db.authenticate("admin", "g8RgpGTXbgYQ", function(err, res) {
			//	console.log("hi");
			//});
		});*/
		
		
		/*MongoClient.connect('mongodb://notedb-tjs7664.rhcloud.com/', function (err, db) {
			if (err) {
				console.log(err);//throw err;
			} else {
				console.log("successfully connected to the database");
			}
			db.close();
		});*/
		
		//var options = { pretty:true };
		//var html = jade.renderFile('./templates/login.jade', options);
		//options = { pretty:true, title:"Login", body:html };
		//html = jade.renderFile('./templates/base.jade', options);
		
		var html = "\
		<form action='"+req.path+"' method='POST'>\
			<input type='text' name='username' placeholder='Username' /><br />\
			<input type='password' name='password' placeholder='Password' /><br />\
			<input type='submit' name='submit' value='Submit' />\
			<input type='reset' name='reset' value='Reset' />\
		</form>\
		\
		<a href='newuser'>Create new account</a>\
		";
		var page = pageBuilder.buildPage(html, "Login", req, res, res.submitMessage);
		
		writePage(res, page);
	}
};

exports.action.logout = function(req, res) {
	req.session.destroy();
	res.redirect('/');
};

exports.action.newUser = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;

	var message = "";
	
	User.findByUsername(username, function(err, data) {
		if(message === "") {
			res.submitMessage = { type:"success", message:"Account Created." };
		} else {
			res.submitMessage = { type:"error", message:message };
		}
		exports.page.newUser(req, res);
	});
};

exports.page.newUser = function(req, res) {
	var html = "\
	<form action='"+req.path+"' method='POST'>\
	<table>\
		<tr><th>Username:	</th><td><input type='text' name='username' placeholder='Username' /></td></tr>\
		<tr><th>Password:	</th><td><input type='password' name='password' placeholder='Password' /></td></tr>\
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

exports.page.userSettings = function(req, res) {
	if(requiresLogin(req, res)) return;
	var html = "<form method='POST' action='"+req.path+"'><input type='submit' value='POST POST POST!' /></form>";
	writePage(res, pageBuilder.buildPage(html, "Start", req, res, res.submitMessage ));
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

exports.page.start = function(req, res) {
	console.log("Request handler 'start' was called.");
	if(requiresLogin(req, res)) return;
	
	var html =
	'<form action="/upload" method="post">'+
		'<textarea name="text" rows="20" cols="60"></textarea>'+
		'<input type="submit" value="Submit text" />'+
	'</form>';
	
	writePage(res, pageBuilder.buildPage(html, "Start", req, res));
};

exports.upload = function(req, res) {
	if(requiresLogin(req, res)) return;
	
	collectPostData(req, res, function(data) {
		var html = "You've sent: " + querystring.parse(data).text;
		writePage(res, pageBuilder.buildPage(html, "Upload", req, res));
	});
}

exports.page.page404 = function(req, res) {
	var html = "<strong>That web page doesn't exist.</strong>";
	writePage(res, pageBuilder.buildPage(html, "404", req, res, { type:"error", message:"HTTP Status Code: 404" }), { code:404 });
};

//{REGION Helper Functions

function requiresLogin(req, res) {
	if(req.session.user === undefined) {
		res.redirect('/login');
		return true;
	}
	return false;
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