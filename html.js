var config = require('./config');
var User = require('./schemas/user.js').model;

function getHeader(title, req, message) {
	if(title === undefined) title = "NO TITLE!";
	var messageDiv = "";
	if (message !== undefined) {
		messageDiv = (typeof message == "object" ? "<div class='"+message.type+"'>"+message.message+"</div>" : "<div class='error'>"+message+"</div>");
	}
	var html = "\
<!DOCTYPE html>\
<html lang='en'>\
	<head>\
		<meta charset='utf-8' />\
		<title>NoteDB - "+title+"</title>\
		<link href='/css_js/style.css' rel='stylesheet' />\
		<script src='//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js'></script>\
		<!-- Work via hack here (put in public folder manually): http://impactjs.com/forums/help/yet-another-nodejs-socket-io-impact-thread/page/1#post18363 -->\
		<script src='/socket.io/socket.io.js'></script>\
	</head>\
	<body>\
		<div id='overlay'></div>\
		<header id='pageheader'>\
			"+getUserbox(req)+"\
			<a href='"+req.path+"'><h1>"+title+"</h1></a>\
			<nav>"+getNav()+"</nav>\
			<div class='clear'></div>\
		</header>\
		<div id='message' class='message-container'>"+messageDiv+"<noscript><div class='error'>Javascript is needed to access all features of this site; Please enable it.</div></noscript></div>\
		<div id='content'>";
	return html;
}

function getFooter() {
	var html = "\
			<div class='clear'></div>\
		</div><!-- end #content -->\
		<footer id='pagefooter'>\
			Torey Scheer &copy; 2014 \
			<span style='float:right;'><a href='https://github.com/toreyjs/notedb' target='_blank'>View code on Github</a></span>\
		</footer>\
		<script src='/css_js/javascript.js' type='text/javascript'></script>\
	</body>\
</html>";
	return html;
}

function getNav() {
	var html = "\
	<a href='/'>Home</a>\
	<span class='headerlinkborder'></span>\
	<span class='dropdownmenu'>\
		<span class='drop'>Add</span>\
		<div class='menu'>\
			<a href='/createboard'>new Board</a><br />\
			<a href='/createorganization'>new Organization</a>\
		</div>\
	</span>\
	<span class='headerlinkborder'></span>\
	<a href='/staff'>Staff Dashboard</a>\
	<a href='/404'>404</a>\
	<a href='/other/Syllabus.htm'>Syllabus</a>\
	<a href='/images/doc.jpg'>Documentation</a>\
	<span class='headerlinkborder'></span>\
	<form style='display:inline-block; vertical-align:bottom;' method='GET' action='/search'>\
		<input type='text' name='q' />\
		<input type='hidden' name='boards' value='1' />\
		<input type='hidden' name='sections' value='1' />\
		<input type='hidden' name='checkPublic' value='1' />\
		<input type='hidden' name='checkPrivate' value='1' />\
		<input type='hidden' name='checkOrg' value='1' />\
		<input type='submit' value='🔍 Search' />\
	</form>\
	";
	return html;
}

function getUserbox(req)
{
	var result = "";
	var user = req.session.user ? req.session.user : false;
	
	if(user) {
		
		//var email = get_user_info($username); $email = $email["email"];
		var myHash = md5(user.email);
		var myParams = "?s=42&d=identicon";
		var imgSrc = "//www.gravatar.com/avatar/"+myHash+myParams;
		
		result = "\
		<div id='userbox'>\
			<span style='float:right; text-align:right;'>\
				<span id='alertContainer'>\
					<span class='alert' "+(user.notifications.length == 0 ? "style='visibility:hidden;'" : "")+">"+user.notifications.length+"</span>\
					<div class='notificationsContainer'>\
						<h3>Notifications</h3>\
						<button id='readAllNotifications'>Mark all as read</button>\
						<div class='notifications'>\
						"+(function(){
							var message = "";
							for (var i = 0; i < user.notifications.length; i++) {
								var note = user.notifications[i];
								message += "\
								<div class='notification' data-id='"+note._id+"'>\
									"+note.message+"\
									<a class='remove'>[remove]</a>\
								</div>\
								";
							}
							return message;
						})()+"\
						</div>\
					</div>\
				</span>\
				<a class='userLink' style='color:#888; font-size:125%; display:inline-block; margin-right:3px;' href='/user/"+user.username+"'>"+user.displayName+"</a>\
				<br />\
				<a href='/user/"+user.username+"/settings'>Settings</a>\
				&bull;\
				<a href='/logout'>Logout</a>\
			</span>\
			<a href='/user/"+user.username+"' style='margin-right:3px;'><img src='"+imgSrc+"' alt='Your Gravatar' title='Your Gravatar' /></a>\
		</div>\
		";
	}else{
		result = "<nav style='right:3px;'><a id='loginlink' href='/login'>Login</a></nav>";
	}
	return result;
}

function md5(str) {
	return require('crypto').createHash('md5').update(str).digest('hex');
}

/*
	htmlBody: html that should be placed in the main section of the page
	..
	..
	..
	message: OPTIONAL - { type:success / error, message:"da message" }
*/
module.exports.buildPage = function(htmlBody, title, req, res, message) {
	var html = getHeader(title, req, message) + htmlBody + getFooter();
	return html;
}