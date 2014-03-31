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
		<link href='/css_js/style.css' rel='stylesheet'>\
		<script src='/css_js/javascript.js' type='text/javascript'></script>\
	</head>\
	<body>\
		<header>\
			"+getUserbox(req)+"\
			<h1>"+title+"</h1>\
			<nav>"+getNav()+"</nav>\
			<div class='clear'></div>\
		</header>\
		<div id='message'>"+messageDiv+"<noscript><div class='error'>Javascript is needed to access all features of this site; Please enable it.</div></noscript></div>\
		<div id='content'>";
	return html;
}

function getFooter() {
	var html = "\
			<div class='clear'></div>\
		</div><!-- end #content -->\
		<footer>\
			Torey Scheer &copy; 2014 \
		</footer>\
	</body>\
</html>";
	return html;
}

function getNav() {
	var html = "\
	<a href='/'>Home</a>\
	<span class='dropdownmenu'>\
		<span class='drop'>Add</span>\
		<div class='menu'>\
			<a href='/createboard'>new Board</a><br />\
			<a href='/createorganization'>new Organization</a>\
		</div>\
	</span>\
	<a href='/404'>404</a>\
	<a href='/staff'>Staff Dashboard</a>\
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
		var myParams = "?s=42";
		var imgSrc = "http://www.gravatar.com/avatar/"+myHash+myParams;
		
		result = "\
		<div id='userbox'>\
			<span style='float:right; text-align:right;'>\
				<span style='font-size:125%; display:inline-block; width:150px; margin-right:3px;'>"+user.displayName+"</span>\
				<br />\
				<a href='/user/"+user.username+"/settings'>Settings</a>\
				&bull;\
				<a href='logout'>Logout</a>\
			</span>\
			<a href='http://en.gravatar.com/'><img src='"+imgSrc+"' alt='Your Gravatar' title='Your Gravatar' /></a>\
		</div>\
		";
	}else{
		result = "<nav style='right:3px;'><a href='login'>Login</a></nav>";
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