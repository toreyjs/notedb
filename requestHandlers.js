exports.action = {};
exports.page = {};

//{REGION Requires
	var pageBuilder = require('./html.js');
	var util = require('util');
	var mongoose = require('mongoose');
	var User = require('./schemas/user.js').model;
	var Board = require('./schemas/board.js').model;
	var Organization = require('./schemas/organization.js').model;
	//var jade = require('jade');
//}END Requires

//}REGION Login / Logout
	exports.page.login = function(req, res) {
		//console.log("Request handler 'login' was called.");

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

	exports.action.login = function(req, res) {
		//console.log("logging in");
		
		var username = req.body.username;
		var password = req.body.password;
		
		User.findByUsername(username, function(err, user) {
			if(user != null && password == user.password) {
				//req.session.user = {};
				req.session.user = user;
				//req.session.user.username = user.username;
				//req.session.user.email = user.email;
				//req.session.user.access = user.access;
				//req.session.user._id = user._id;
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
	};

	exports.action.logout = function(req, res) {
		req.session.destroy();
		res.redirect('/login');
	};
//}END Login / Logout

exports.page.home = function(req, res) {
	if(requiresLogin(req, res)) return;

	var html = "";
	var steps = makeSteps(usersBoards, orgBoards, finish);
	steps.nextStep();

	function usersBoards() {
		Board.findByUser(req.session.user._id, function(err, boards) {
			html += "<h2>Boards</h2>";
			if(boards.length == 0) {
				html += "<p>You currently have no boards. [<a href='/createboard'>Create one</a>]</p>";
			} else {
				html += "<ul>";
				for(var i in boards)
				{ var board = boards[i];
					console.log(board);
					html += "<li><a href='/board/"+board._id+"'>"+board.boardName+"</a></li>";
				}
				html += "</ul>";
			}
			steps.nextStep();
		});
	}

	function orgBoards() {
		Organization.findByUser(req.session.user._id, function(err, orgs) {
			html += "<h2>Organizations</h2>";
			if(orgs.length == 0) {
				html += "<p>You currently belong to no organizations. [<a href='/createorganization'>Create one</a>]</p>";
				steps.nextStep();
			} else {
				for(var i in orgs)
				{ var org = orgs[i];
					html += "<h3 style='display:inline-block;'>"+org.name+"</h3> (<a href='/organization/"+org._id+"'>details</a>)";
					Board.findByOrganization(org._id, function(err, boards) {
						if(boards.length == 0) {
							html += "<p>This organization currently has no boards (or you lack the permissions to view them).</p>";
						} else {
							html += "<ul>";
							for(var i in boards)
							{ var board = boards[i];
								html += "<li><a href='/board/"+board._id+"'>"+board.boardName+"</a></li>";
							}
							html += "</ul>";
						}
						steps.nextStep();
					});
				}
			}
		});
	}

	function finish() {
		writePage(res, pageBuilder.buildPage(html, "Home", req, res, res.submitMessage ));
	}
};

//{REGION Users
	exports.page.user = function(req, res) {
		var username = req.params.username;
		var html = "";
		User.findByUsername(username, function(err, user) {
			if(user) {
				var imgSrc = "http://www.gravatar.com/avatar/"+md5(user.email)+"?s=200&d=identicon";
				html += "<a href='http://en.gravatar.com/'><img src='"+imgSrc+"' alt=\""+user.displayName+"'s' Gravatar\" title=\""+user.displayName+"'s Gravatar\" /></a>";

				html += "<p><b>Creation Date:</b> "+dateFormat(user.creationDate)+"</p>";
				writePage(res, pageBuilder.buildPage(html, user.displayName, req, res, res.submitMessage ));
			} else {
				exports.page.page404(req, res);
			}
		});
	};

	exports.page.userSettings = function(req, res) {
		if(requiresLogin(req, res)) return;
		User.findByUsername(req.session.user.username, function(err, user) {
			var html = "\
			<form method='POST' action='"+req.path+"'>\
				<table>\
					<tr>\
						<th>Username</th>\
						<td>"+user.username+"</td>\
					</tr>\
					<tr>\
						<th>Display Name</th>\
						<td><input name='displayName' type='text' value='"+(req.body.displayName || user.displayName)+"'></td>\
					</tr>\
					<tr>\
						<th>Email</th>\
						<td><input name='email' type='text' value='"+(req.body.email || user.email)+"'></td>\
					</tr>\
					<tr>\
						<th>Password</th>\
						<td><input name='password' type='password' value='"+(req.body.password || user.password)+"'></td>\
					</tr>\
					<tr>\
						<td></td>\
						<td><input name='repeatpassword' type='password' placeholder='Repeat Password'></td>\
					</tr>\
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
	};

	exports.action.userSettings = function(req, res) {
		if(requiresLogin(req, res)) return;

		var displayName = req.body.displayName;
		var password = req.body.password;
		var repeatpassword = req.body.repeatpassword;
		var email = req.body.email;
		
		var message = "";
		var addError = function(msg) { message += ( message === "" ? msg : "<br />"+msg ) };
		
		if(displayName.length < 6 || displayName.length > 32) {
			addError("Display Name must be between 6-32 characters long.");
		}

		if(req.session.user.password != password) {
			if(password.length < 6 || password.length > 32) addError("Password must be between 6-32 characters long.");
			if(password != repeatpassword) addError("Passwords do not match.");
		}

		// http://www.javascriptkit.com/script/script2/acheck.shtml
		var emailFilter = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
		if(!emailFilter.test(email)) addError("Email not valid");

		if(message === "") {
			User.findByUsername(req.session.user.username, function(err, user) {
				user.displayName = displayName;
				user.email = email;
				user.password = password;
				user.save(function (err, newuser) {
					if (err) addError(err.message);
					getAfterPost("userSettings", req, res, (message === "" ? { type:"success", message:"Settings Saved!" } : message));
				});
			});
		} else {
			getAfterPost("userSettings", req, res, message);
		}
	};

	exports.page.newUser = function(req, res) {
		var html = "\
		<form action='"+req.path+"' method='POST'>\
		<table>\
			<tr><th>Username:	</th><td><input type='text' name='username' placeholder='Username' value='"+(req.body.username || '')+"' required /></td></tr>\
			<tr><th>Password:	</th><td><input type='password' name='password' placeholder='Password' required /></td></tr>\
			<tr><td>			</td><td><input type='password' name='repeatpassword' placeholder='Repeat Password' required /></td></tr>\
			<tr><th>Email:		</th><td><input type='email' name='email' placeholder='User@Email.com' value='"+(req.body.email || '')+"' required /></td></tr>\
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
					getAfterPost("newUser", req, res, (message === "" ? { type:"success", message:"Account Created." } : message));
				});
			} else {
				getAfterPost("newUser", req, res, { type:"error", message:message });
			}
		});
	};
//}END Users

//{REGION Boards
	exports.page.board = function(req, res) {
		var boardId = req.params.board;
		var html = "";
		Board.findById(boardId, function(err, board) {
			if(!board) { exports.page.page404(req, res); }
			else {
				if(board.boardType != 0/*Not public*/) {
					if(requiresLogin(req, res)) return;
					// ###############################################################TODO: check if user on board / in an organization
					// If user cannot access board, print out error message and jump out of thread.
					if(false) {

					}// Else just continue
				}
				html += "<div id='board'>\
					<div class='content'>";

					for(var s = 0; s < board.sections.length; s++) { var section = board.sections[s];
						html += "\
						<section>\
							<h2 class='sectionheader'>"+section.title+"</h2> \
							<span class='dropdownmenu'>\
								<span class='drop'></span>\
								<div class='menu'>\
									<form action='"+req.path+"' method='POST'>\
										<input name='section' type='hidden' value='"+s+"' />\
										<input name='deletesection' type='submit' value='Delete Section' />\
									</form>\
								</div>\
							</span>\
							<div class='cards'>\
						";

						for(var n = 0; n < section.notes.length; n++) { var note = section.notes[n];
							html += "\
								<div class='card'>\
									<span class='dropdownmenu' style='float:right;'>\
										<span class='drop'></span>\
										<div class='menu'>\
											<form action='"+req.path+"' method='POST'>\
												<input name='section' type='hidden' value='"+s+"' />\
												<input name='card' type='hidden' value='"+n+"' />\
												<input name='deletecard' type='submit' value='Delete Card' />\
											</form>\
										</div>\
									</span>\
									"+note.title+"\
								</div>";
						}

						html += "\
								<div class='card large'>\
									<form action='"+req.path+"' method='POST'>\
										<input name='section' type='hidden' value='"+s+"' />\
										<input name='title' type='text' placeholder='New Card Title' required /><br />\
										<input name='description' type='text' placeholder='Description' required /><br />\
										<input name='addcard' type='submit' value='Add Card' />\
									</form>\
								</div>\
								<div class='clear'></div>\
							</div>\
						</section>\
						";
					}
					html += "\
						<section>\
							<form action='"+req.path+"' method='POST'>\
								<input name='title' type='text' placeholder='New Section Title' required />\
								<input name='addsection' type='submit' value='Add Section' />\
							</form>\
						</section>\
					</div><!--End .content-->\
					<aside>\
						<p><b>Created:</b> "+dateFormat(board.creationDate)+"</p>\
						<a href='/board/"+boardId+"/settings'>Edit Settings</a>\
					</aside>\
					";
				html += "</div><!--End #board-->";
				writePage(res, pageBuilder.buildPage(html, board.boardName, req, res, res.submitMessage ));
			}
		});
	};

	exports.action.board = function(req, res) {
		if(requiresLogin(req, res)) return;

		var boardId = req.params.board;
		var steps = makeSteps(checkActionPerformed, finish);
		steps.nextStep();

		function checkActionPerformed() {
			Board.findById(boardId, function(err, board) {
				if(!board) { exports.page.page404(req, res); }
				else {
					// ###############################################################TODO: check if user on board / in an organization
					// If user cannot access board, print out error message and jump out of thread.
					if(false) {

					}// Else just continue

					if(req.body.addsection) {
						var title = req.body.title;

						board.sections.push({ title:title });
						board.save(function(err, board) {
							steps.nextStep();
						});
					}
					else if(req.body.addcard) {
						var section = req.body.section;
						var title = req.body.title;
						var description = req.body.description;

						if(section < board.sections.length && section >= 0) {
							board.sections[section].notes.push({ title:title, description:description });
							board.save(function(err, board) {
								steps.nextStep();
							});
						} else {
							// complain
						}
						
					}
					else if(req.body.deletecard) {
						var section = req.body.section;
						var card = req.body.card;
						board.sections[section].notes[card].remove();
						board.save(function(err, board) {
							steps.nextStep();
						});
					}
					else if(req.body.deletesection) {
						var section = req.body.section;
						board.sections[section].remove();
						board.save(function(err, board) {
							steps.nextStep();
						});
					}
				}
			});
		}

		function finish() {
			getAfterPost("board", req, res, { type:"success", message:"Item added /edited / w/e-ed successfully." });
		}
	};

	exports.page.boardSettings = function(req, res) {
		if(requiresLogin(req, res)) return;
		
		var boardId = req.params.board;
		var html = "";
		Board.findById(boardId, function(err, board) {
			html += "\
			<form action='"+req.path+"' method='POST'>\
				<input type='submit' name='delete' value='Delete Board' />\
			</form>\
			";
			writePage(res, pageBuilder.buildPage(html, board.boardName, req, res, res.submitMessage ));
		});
	};

	exports.action.boardSettings = function(req, res) {
		if(requiresLogin(req, res)) return;
		
		var boardId = req.params.board;
		if(req.body.delete) {
			Board.findById(boardId, function(err, board) {
				board.remove();
				getAfterPost("home", req, res, { type:"success", message:"Board Successfully Deleted." });
			});
		}
	};

	exports.page.createBoard = function(req, res) {
		if(requiresLogin(req, res)) return;

		var steps = makeSteps(populateOrganizations, createForm, finish);
		var html = "";
		var organizations = [];
		steps.nextStep();

		function populateOrganizations() {
			Organization.findByUser(req.session.user._id, function(err, orgs) {
				organizations = orgs;
				steps.nextStep();
			});
		}

		function createForm() {
			html += "\
			<form action='"+req.path+"' method='POST'>\
				<label for='boardName'>Board Name</label><br />\
				<input type='text' name='boardName' placeholder='Board Name' required />\
				<select name='privacy'>\
					 <option value='0' selected>Public</option>\
					 <option value='1'>Private</option>\
					 <option value='2' disabled>Public to Organization</option>\
				</select>\
				<br />\
				<label for='organization'>Organization</label><br />\
				<select name='organization'>\
					 <option value='-1' selected>[None]</option>";
					 for(var i in organizations) { var org = organizations[i];
					 	html += util.format("<option value='%s'>%s</option>", org._id, org.name);
					 }
				html += "</select>\
				<p><input type='submit' value='Create Board' /></p>\
			</form>";
			steps.nextStep();
		}

		function finish() {
			writePage(res, pageBuilder.buildPage(html, "Create New Board", req, res, res.submitMessage ));
		}
	};

	exports.action.createBoard = function(req, res) {
		if(requiresLogin(req, res)) return;

		var boardName = req.body.boardName;
		var organization = req.body.organization;
		var privacy = req.body.privacy;

		var message = "";
		var addError = function(msg) { message += ( message === "" ? msg : "<br />"+msg ) };

		if(boardName.length < 6 || boardName.length > 128) addError("Board Name must be between 6-128 characters long.");

		if(privacy != 0 && privacy != 1) addError("Board type isn't valid.");

		if(organization == -1) {}//ignore
		//else confirm if the user is allowed to add the board to that organization

		if(message === "") {
			var newboard = new Board({ boardName: boardName, boardType: privacy });
			newboard.addUser(req.session.user.username, 3, function(err, newboard) {
				newboard.save(function (err, newboard) {
					if (err) addError(err.message);
					var submitMessage = ( message === "" ? { type:"success", message:"Board Created." } : { type:"error", message:message } );
					getAfterPost('createBoard', req, res, submitMessage);
				});
			});
		} else {
			getAfterPost('createBoard', req, res, { type:"error", message:message });
		}
	};
//}END Boards

//{REGION Organizations
	exports.page.organization = function(req, res) {
		var orgId = req.params.organization;
		var html = "";
		Organization.findById(orgId, function(err, org) {
			if(org) {
				html += "<p><b>Created:</b> "+dateFormat(org.creationDate)+"</p>";
				html += "<h2>Users on the board</h2>\
				<ul>";
				for(var i = 0; i < org.users.length; i++)
				{ var user = org.users[i];
					html += util.format("<li><a href='%s'>%s</a> (<b>Access:</b> %s)</li>", "#", user.playerID, user.access);
				}
				html += "</ul>";
				html += "<a style='float:right;' href='/organization/"+orgId+"/settings'>Edit Settings</a>";
				writePage(res, pageBuilder.buildPage(html, org.name, req, res, res.submitMessage ));
			} else {
				exports.page.page404(req, res);
			}
		});
	};

	exports.page.organizationSettings = function(req, res) {
		if(requiresLogin(req, res)) return;

		var orgId = req.params.organization;
		var html = "";
		Organization.findById(orgId, function(err, org) {
			html += "\
			<form action='"+req.path+"' method='POST'>\
				<input type='submit' name='delete' value='Delete Organization' />\
			</form>\
			";
			writePage(res, pageBuilder.buildPage(html, org.name, req, res, res.submitMessage ));
		});
	};

	exports.action.organizationSettings = function(req, res) {
		if(requiresLogin(req, res)) return;

		var orgId = req.params.organization;
		if(req.body.delete) {
			Organization.findById(orgId, function(err, org) {
				org.remove();
				getAfterPost("home", req, res, { type:"success", message:"Organization Successfully Deleted." });
			});
		}
	};

	exports.page.createOrganization = function(req, res) {
		if(requiresLogin(req, res)) return;

		var html = "\
		<form action='"+req.path+"' method='POST'>\
			<label for='orgname'>Organization Name</label><br />\
			<input type='text' name='orgname' placeholder='Organization Name' required />\
			<select name='privacy'>\
				 <option value='0' selected>Public</option>\
				 <option value='1'>Private</option>\
			</select>\
			<p><input type='submit' value='Create Organization' /></p>\
		</form>";

		writePage(res, pageBuilder.buildPage(html, "Create New Organization", req, res, res.submitMessage ));
	};

	exports.action.createOrganization = function(req, res) {
		if(requiresLogin(req, res)) return;

		var name = req.body.orgname;
		var privacy = req.body.privacy;

		var message = "";
		var addError = function(msg) { message += ( message === "" ? msg : "<br />"+msg ) };

		if(name.length < 6 || name.length > 128) addError("Organization Name must be between 6-128 characters long.");

		if(privacy != 0 && privacy != 1) addError("Organization type isn't valid.");

		if(message === "") {
			var neworg = new Organization({ name: name, type: privacy });
			neworg.addUser(req.session.user.username, 3, function(err, neworg) {
				neworg.save(function (err, neworg) {
					if (err) addError(err.message);
					var submitMessage = ( message === "" ? { type:"success", message:"Organization Created. (<a href='organization/"+neworg._id+"'>view it now</a>)" } : { type:"error", message:message } );
					getAfterPost('createOrganization', req, res, submitMessage);
				});
			});
		} else {
			getAfterPost('createOrganization', req, res, { type:"error", message:message });
		}
	};
//}END Organizations

//{REGION Staff
	exports.page.staff = function(req, res) {
		if(requiresLogin(req, res)) return;

		var html = "";
		User.listStaff(function(err, staffList) {
			if(staffList.length == 0) {
				html = "<form method='POST' action='"+req.path+"'><input name='makestaff' type='submit' value='Make me Staff!' /></form>";
			} else {
				if(!userIsStaff(req, res)) return;
				html = "\
				Useful Pages:\
				<ul>\
					<li><a href='staff/UserRights'>Change User Rights</a></li>\
					<li><a href='staff/ListUsers'>List Users</a></li>\
					<li><a href='staff/ListOrganizations'>List Organizations</a></li>\
				</ul>\
				";
			}
			writePage(res, pageBuilder.buildPage(html, "Staff Dashboard", req, res, res.submitMessage ));
		});
	};

	exports.action.staff = function(req, res) {
		if(requiresLogin(req, res)) return;

		var username = req.session.user.username;
		User.listStaff(function(err, staffList) {
			if(staffList.length == 0) {
				if(req.body.makestaff) {
					User.findByUsername(username, function(err, user) {
						user.access = req.session.user.access = 2;
						user.save(function(err, user) {
							getAfterPost("staff", req, res, { type:'success', message:'You\'ve been successfully added as staff!' });
						});
					});
				}
			} else {
				res.redirect('/staff');
			}
		});
	};

	exports.page.staffPage = function(req, res) {
		if(!userIsStaff(req, res)) { return; }

		var page = req.params.page;
		var pages = {
			UserRights:UserRights,
			ListUsers:ListUsers,
			ListOrganizations:ListOrganizations
		};
		var html = "<div style='background:#555; border:3px double #333; padding:3px 6px 3px 12px; margin-bottom:5px;'><a style='font-size:150%; color:#3A0303;' href='/staff'>Staff Dashboard</a></div>";
		if(pages.hasOwnProperty(page)) pages[page](req, res);
		else exports.page.page404(req, res);

		function UserRights(req, res) {
			var username = (req.query.user || req.body.user) || "";
			if(req.query.submitUser) { req.query.submitUser = undefined; exports.action.staffPage(req, res); return; }

			html += "\
			<form method='GET' action='"+req.path+"'>\
				<label for='user'>Enter a username:</label>\
				<input name='user' type='text' value='"+username+"' />\
				<input name='submitUser' type='submit' value=\"Edit User's Access\" />\
			</form>";

			if(username) {
				html += "\
				<hr />\
				<form method='POST' action='"+req.path+"'>\
					<input name='user' type='hidden' value='"+username+"' />\
					<input name='oldAccess' type='hidden' value='"+req.body.oldAccess+"' />\
					<label for='access'>Access:</label>\
					<select name='access'>\
						 <option value='0' "+(req.body.oldAccess == 0 ? "selected" : "")+">Normal</option>\
						 <option value='1' "+(req.body.oldAccess == 1 ? "selected" : "")+" disabled>???</option>\
						 <option value='2' "+(req.body.oldAccess == 2 ? "selected" : "")+">Staff</option>\
					</select>\
					<input type='submit' value='Change' />\
				</form>";
			}

			writePage(res, pageBuilder.buildPage(html, "User Rights", req, res, res.submitMessage ));
		}

		function ListUsers(req, res) {
			var steps = makeSteps(listStaff, listUsers, finish);
			steps.nextStep();

			function listStaff() {
				User.find({ access:2 }, function(err, users) {
					html += "<h2>Staff</h2>\
					<ul>";
					for(var i in users)
					{ var user = users[i];
						html += util.format("<li><a href='/user/%s'>%s</a> (<b>Display Name:</b> %s)</li>", user.username, user.username, user.displayName);;
					}
					html += "</ul>";
					steps.nextStep();
				});
			}

			function listUsers() {
				User.find({ access:0 }, function(err, users) {
					html += "<h2>Normal Users</h2>\
					<ul>";
					for(var i in users)
					{ var user = users[i];
						html += util.format("<li><a href='/user/%s'>%s</a> (<b>Display Name:</b> %s)</li>", user.username, user.username, user.displayName);;
					}
					html += "</ul>";
					steps.nextStep();
				});
			}

			function finish() {
				writePage(res, pageBuilder.buildPage(html, "List Users", req, res, res.submitMessage ));
			}
		}

		function ListOrganizations(req, res) {
			var steps = makeSteps(listPrivate, listPublic, finish);
			steps.nextStep();

			function listPrivate() {
				Organization.find({ type:1 }, function(err, orgs) {
					html += "<h2>Private Organizations</h2>\
					<ul>";
					for(var i in orgs)
					{ var org = orgs[i];
						html += util.format("<li><a href='/organization/%s'>%s</a></li>", org._id, org.name);;
					}
					html += "</ul>";
					steps.nextStep();
				});
			}

			function listPublic() {
				Organization.find({ type:0 }, function(err, orgs) {
					html += "<h2>Public Organizations</h2>\
					<ul>";
					for(var i in orgs)
					{ var org = orgs[i];
						html += util.format("<li><a href='/organization/%s'>%s</a></li>", org._id, org.name);;
					}
					html += "</ul>";
					steps.nextStep();
				});
			}

			function finish() {
				writePage(res, pageBuilder.buildPage(html, "List Organizations", req, res, res.submitMessage ));
			}
		}
	};

	exports.action.staffPage = function(req, res) {
		if(!userIsStaff(req, res)) { return; }

		var page = req.params.page;
		var pages = { UserRights:UserRights };
		if(pages.hasOwnProperty(page)) pages[page](req, res);
		else exports.page.page404(req, res);

		function UserRights(req, res) {
			var username = req.query.user || req.body.user || "";
			User.findByUsername(username, function(err, user) {
				if(user != null) {
					if(req.query.user/*GET form*/) {
						req.body.oldAccess = user.access;
						getAfterPost("staffPage", req, res);
					} else {
						var access = req.body.access;
						if(access == 0 || access == 2) {
							user.access = access;
							user.save();
							req.body.oldAccess = access;
							getAfterPost("staffPage", req, res, { type:"success", message:"User's Rights have been updated" });
						} else {
							getAfterPost("staffPage", req, res, { type:"error", message:"Invalid user access type." });
						}
					}
				} else {
					// No such user exists.
					req.query.user = req.body.user = undefined;
					getAfterPost("staffPage", req, res, { type:"error", message:"There is no user by the username \""+username+"\". Check your spelling." });
				}
			});
		}
	};
//}END Staff

//{REGION Error Pages
	exports.page.page403 = function(req, res) {
		var html = "<strong>You do not have the correct permissions to view this page.</strong>";
		writePage(res, pageBuilder.buildPage(html, "403", req, res, { type:"error", message:"HTTP Status Code: 403" }), { code:403 });
	};

	exports.page.page404 = function(req, res) {
		var html = "<strong>That web page doesn't exist.</strong>";
		writePage(res, pageBuilder.buildPage(html, "404", req, res, { type:"error", message:"HTTP Status Code: 404" }), { code:404 });
	};

	exports.action.page404 = function(req, res) {
		var html = "<strong>You cannot post to this web address.</strong>";
		writePage(res, pageBuilder.buildPage(html, "404", req, res, { type:"error", message:"HTTP Status Code: 404" }), { code:404 });
	};
//}END Error Pages

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
		if(requiresLogin(req, res)) return;

		var user = req.session.user;
		if(user.access == 2) {
			return true;
		} else {
			exports.page.page403(req, res);
			return false;
		}
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

	function makeSteps(stepsArray) {
		return {
			i: -1,
			steps: arguments,
			nextStep: function() {
				++this.i;
				if(this.i < this.steps.length) this.steps[this.i]();
				else console.log("NO NEXT STEP!");
			}
		}
	}

	function md5(str) {
		return require('crypto').createHash('md5').update(str).digest('hex');
	}

	function dateFormat(date) {
		var m_names = new Array("Jan.", "Feb.", "Mar.", 
		"Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", 
		"Oct.", "Nov.", "Dec.");
		return util.format("%s %s, %s", m_names[date.getMonth()], date.getDate(), (date.getFullYear()+"").substr(2, 2));
	}
//}END Helper Functions