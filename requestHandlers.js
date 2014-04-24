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
			<form id='loginform' action='"+req.path+"' method='POST' style='display:inline-block; padding-right:10px;'>\
				<input type='text' name='username' placeholder='Username' /><br />\
				<input type='password' name='password' placeholder='Password' /><br />\
				<input type='submit' name='submit' value='Submit' />\
				<input type='reset' name='reset' value='Reset' />\
			</form>\
			\
			<div style='display:inline-block;'>\
				< Login <br />\
				<strong style='font-size:150%;'>OR</strong><br />\
				<a href='/newuser'>Create new account</a>\
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
				req.session.user = user;
				if(req.session.pagebeforelogin) {
					res.redirect(req.session.pagebeforelogin);
					req.session.pagebeforelogin = undefined;
				} else {
					res.redirect('/');
				}
			}else{
				getAfterPost("login", req, res, "Incorrect Username / Password");
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
					html += "<li><a href='/board/"+board._id+"'>"+board.boardName+"</a></li>";
				}
				html += "</ul>";
			}
			steps.nextStep();
		});
	}

	function orgBoards() {
		Organization.findByUser(req.session.user._id, function(err, orgs) {
			html += "<h2>Organizations</h2>\
				<p>Boards in organizations can always be viewed, but cannot be edited until your added onto the board.</p>\
			";
			if(orgs.length == 0) {
				html += "<p>You currently belong to no organizations. [<a href='/createorganization'>Create one</a>]</p>";
				steps.nextStep();
			} else {
				for(var i in orgs)
				{ var org = orgs[i];
					html += "<h3 style='display:inline-block;'>"+org.name+"</h3> (<a href='/organization/"+org._id+"'>details</a>)";
					Board.findByOrganization(org._id, function(err, boards) {
						if(boards.length == 0) {
							html += "<p>This organization currently has no boards.</p>";
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
				var imgSrc = getGravatar(user.email, 200);
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
		
		if(displayName.length < 1 || displayName.length > 32) {
			addError("Display Name must be between 1-32 characters long.");
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
				user.save(function (err, user) {
					if (err) addError(err.message);
					req.session.user = user;
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
		  if(!board) { exports.page.page404(req, res); return; }

		  Organization.findById(board.organizationID, function(err, organization) {
		  	if(board.boardType != 0/*Not public*/) {
				if(requiresLogin(req, res)) return;

				// If board is private and user's not on board, don't allow them to view
				if(!board.containsUser(req.session.user._id)) {
					// They ARE allowed to view it however if they are part of the board's organization (if applicable)
					if(organization) {
						if(!organization.containsUser(req.session.user._id)) { exports.page.page403(req, res); return; }
					} else {
						exports.page.page403(req, res); return;
					}
				}
			}
			var canEdit = (req.session.user && board.containsUser(req.session.user._id));

			if(req.query.get) {
				if(req.query.get == "window" && (cardID = req.query.card)) {
					board.findCard(cardID, function(err, card) {
						if(card) {
							var attachedUsers = {}, commentUsers = {};
							var getUserSteps = makeSteps(getAttachedUsers, getCommentUsers, finish);
							getUserSteps.nextStep();

							function getAttachedUsers() {
								var ids = [];
								for (var i = 0; i < card.users.length; i++) {
									ids.push(card.users[i].userID);
								}
								User.findUsersById(ids, function(err, users) {
									attachedUsers = users;
									getUserSteps.nextStep();
								});
							}

							function getCommentUsers() {
								var ids = [];
								for (var i = 0; i < card.comments.length; i++) {
									ids.push(card.comments[i].userID);
								}
								User.findUsersById(ids, function(err, users) {
									commentUsers = users;
									getUserSteps.nextStep();
								});
							}

							function finish() {
								html += "\
								<input id='cardID' type='hidden' value='"+card._id+"' />\
								<div class='cardtitle' data-card='"+card._id+"'>\
									<h2 class='cardtitle-text' style='display:inline;'>"+card.title+"</h2> \
									"+(canEdit ? "<a class='editcardtitle'>[edit]</a>" : "")+"\
								</div>\
								<hr />\
								\
								<h3>Description</h3>\
								<div class='description' data-card='"+card._id+"'>\
									<span class='description-text'>"+card.description+"</span> \
									"+(canEdit ? "<a class='editcarddescription'>[edit]</a>" : "")+"\
								</div>\
								\
								<h3>Attached Users</h3>\
								<div class='users' data-card='"+card._id+"'>\
								";
								if(card.users.length == 0) { html += "There are no users attached to this card."; }
								for (var i = 0; i < card.users.length; i++) {
									var id = card.users[i].userID, user = attachedUsers[id];
									html += "\
									<span class='attached-user' data-user='"+id+"'>\
										<a class='imagelink' href='/user/"+user.username+"' title='"+user.displayName+"'>\
											<img src='"+getGravatar(user.email, 40)+"' />\
										</a>\
										"+(canEdit ? "<br /><a class='removeattacheduser'>Remove</a>" : "")+"\
									</span>\
									";
								}
								var addAttachLink = canEdit && req.session.user && /*User not in list*/!attachedUsers[req.session.user._id];
								html += "\
									"+(addAttachLink ? "<a class='attachselftocard'>[attach self]</a>" : "")+"\
								</div>";

								var pTextArray = ["Not a", "Low", "Medium", "High"];
								var pClassArray = ["", "priority-low", "priority-medium", "priority-high"];
								html += "\
								<h3>Priority</h3>\
								<div class='priority' data-priority='"+card.priority+"' data-card='"+card._id+"'>\
									<span class='priority-text "+pClassArray[card.priority]+"'>"+(pTextArray[card.priority])+" Priority</span> \
									"+(canEdit ? "<a class='editcardpriority'>[edit]</a>" : "")+"\
								</div>\
								\
								<h3>Comments</h3>\
								<div class='comments'>\
								";
								if(canEdit) {
									html += "\
									<div class='newcomment'>\
										<form action='"+req.path+"' method='POST'>\
											<input name='card' type='hidden' value='"+card._id+"' />\
											<input name='comment' type='text' placeholder='Wassup?' required />\
											<input name='addcomment' type='submit' value='Add Comment' />\
											<hr />\
										</form>\
									</div>\
									";
								}
								for(var i = 0; i < card.comments.length; i++)
								{ var comment = card.comments[i], user = commentUsers[comment.userID];
									html += "\
									<div class='comment'>\
										<a class='comment-avatar imagelink' href='/user/"+user.username+"' title='"+user.displayName+"'>\
											<img src='"+getGravatar(user.email, 30)+"' />\
										</a>\
										<div class='comment-wrapper'>\
											<a class='comment-user' href='/user/"+user.username+"'>"+user.displayName+"</a>\
											<div class='comment-text'>"+comment.comment+"</div>";
									if(canEdit) {
										html += "\
											<form action='"+req.path+"' method='POST'>\
												"+dateFormat(comment.creationDate)+" \
												<input name='card' type='hidden' value='"+card._id+"' />\
												<input name='comment' type='hidden' value='"+i+"' />\
												<input name='deletecomment' type='submit' value='Delete' />\
											</form>\
										</div>\
										";
									} else {
										html += dateFormat(comment.creationDate);
									}
									html += "</div>";
								}
								if(card.comments.length == 0) { html += "[No comments]"; }
								html += "</div>\
								";
								writePage(res, html);
							}
						}
						else { writePage(res, "No such card! (404)"); }
					});
				}
				else { writePage(res, "You messed something up! (404)"); }
			} else {
				var boardUsers = {};
				var steps = makeSteps(getBoardUsers, finish);
				steps.nextStep();

				function getBoardUsers() {
					var ids = [];
					for (var i = 0; i < board.users.length; i++) {
						ids.push(board.users[i].userID);
					}
					User.findUsersById(ids, function(err, users) {
						boardUsers = users;
						steps.nextStep();
					});
				}

				function finish() {
					html += "\
					<div id='board'>\
						<div class='content'>";

						for(var s = 0; s < board.sections.length; s++) { var section = board.sections[s];
							var sectionDropdown = "";
							if(canEdit) {
								sectionDropdown = "\
								<span class='dropdownmenu'>\
									<span class='drop'></span>\
									<div class='menu'>\
										<form action='"+req.path+"' method='POST'>\
											<input name='section' type='hidden' value='"+s+"' />\
											<input name='deletesection' type='submit' value='Delete Section' />\
										</form>\
									</div>\
								</span>";
							}

							html += "\
							<section>\
								<h2 class='sectionheader "+(canEdit ? "editable" : "")+"' data-section='"+s+"'>"+section.title+"</h2> \
								"+sectionDropdown+"\
								<div class='cards'>\
									<div class='cards-inner'>\
							";

							for(var n = 0; n < section.cards.length; n++) { var card = section.cards[n];
								var cardDropdown = "";
								if(canEdit) {
									cardDropdown = "\
										<span class='dropdownmenu' style='float:right;'>\
											<span class='drop'></span>\
											<div class='menu'>\
												<form action='"+req.path+"' method='POST'>\
													<input name='section' type='hidden' value='"+s+"' />\
													<input name='card' type='hidden' value='"+n+"' />\
													<input name='deletecard' type='submit' value='Delete Card' />\
												</form>\
											</div>\
										</span>";
								}

								html += "\
										<div id='"+card._id+"' class='card'>\
											"+cardDropdown+"\
											"+card.title+"\
										</div>";
							}
							if(canEdit) {
								html += "\
										<div class='newcard'>\
											<form action='"+req.path+"' method='POST'>\
												<input name='section' type='hidden' value='"+s+"' />\
												<input name='title' type='text' placeholder='New Card Title' required /><br />\
												<input name='description' type='text' placeholder='Description' required /><br />\
												<input name='addcard' type='submit' value='Add Card' />\
											</form>\
										</div>\
								";
							}
							html += "\
									<!--<div class='clear'></div>-->\
									</div><!--End .cards-inner-->\
								</div><!--End .cards-->\
							</section>\
							";
						}
						if(canEdit) {
							html += "\
							<section>\
								<form action='"+req.path+"' method='POST'>\
									<input name='title' type='text' placeholder='New Section Title' required />\
									<input name='addsection' type='submit' value='Add Section' />\
								</form>\
							</section>\
							";
						}
						html += "\
						</div><!--End .content-->\
						<aside>\
							<p><b>Created:</b> "+dateFormat(board.creationDate)+"</p>\
							<div id='boardUsers'>\
								<h3>Board Users</h3>";
								forEachInAssoc(boardUsers, function(user) {
									html += "\
									<span class='board-user' data-user='"+user._id+"'>\
										<a class='imagelink' href='/user/"+user.username+"' title='"+user.displayName+"'>\
											<img src='"+getGravatar(user.email, 50)+"' style='border-radius:5px;' />\
										</a>\
										"+(canEdit ? "<br /><a class='removeboarduser'>Remove</a>" : "")+"\
									</span>\
									";
								});
								if(canEdit) {
									html += "\
									<span id='addUserToBoard-container'>\
										<a id='addUserToBoard'>Add<br />User</a>\
									</span>\
									";
								}
								html += "\
							</div>\
							"+(canEdit ? "<div id='boardSettingsLinkContainer'><a href='/board/"+boardId+"/settings'>Edit Settings</a></div>" : "")+"\
						</aside>\
						";
					html += "</div><!--End #board-->";
					writePage(res, pageBuilder.buildPage(html, board.boardName, req, res, res.submitMessage ));
				}
			}
		  });
		});
	};

	exports.action.board = function(req, res) {
		if(requiresLogin(req, res)) return;

		var boardId = req.params.board;
		checkActionPerformed();

		function checkActionPerformed() {
			Board.findById(boardId, function(err, board) {
				if(!board) { exports.page.page404(req, res); }
				else {
					// ###############################################################TODO: check if user on board / in an organization
					// If user cannot access board, print out error message and jump out of thread.
					if(false) {

					}// Else just continue

					if(req.body.addUserToBoard) {
						var username = req.body.username;

						User.findByUsername(username, function(err, user) {
							if(user) {
								board.users.push({ userID:user._id, access:1 });
								board.save(function(err, board) {
									finish("User Added to Board Successfully");
								});
							} else {
								finish({ type:"error", message:"No user by the username <i>"+username+"</i> exists. Are you sure you entered thier username and not thier display name?" });
							}
						});
					}
					else if(req.body.addsection) {
						var title = req.body.title;

						board.sections.push({ title:title });
						board.save(function(err, board) {
							finish("Section Added Successfully");
						});
					}
					else if(req.body.addcard) {
						var section = req.body.section;
						var title = req.body.title;
						var description = req.body.description;

						if(section < board.sections.length && section >= 0) {
							board.sections[section].cards.push({ title:title, description:description });
							board.save(function(err, board) {
								finish("Card Added Successfully");
							});
						} else {
							// complain
						}
						
					}
					else if(req.body.attachselftocard) {
						var cardID = req.body.card;
						var userID = req.session.user._id;

						board.findCard(cardID, function(err, card){
							card.users.push({ userID:userID });
							board.save(function(err, board) {
								//finish("You are now attached to the card <i>"+card.title+"</i>.");
								writePage(res, "You are now attached to the card <i>"+card.title+"</i>.");
							});
						});
					}
					else if(req.body.addcomment) {
						var cardID = req.body.card;
						var comment = req.body.comment;
						var userID = req.session.user._id;

						board.findCard(cardID, function(err, card){
							card.comments.push({ userID:userID, comment:comment });
							board.save(function(err, board) {
								finish("Comment Added Successfully");
							});
						});
					}

					else if(req.body.editsectiontitle) {
						var sectionI = req.body.section;
						var title = req.body.title;

						board.sections[sectionI].title = title;
						board.save(function(err, board) {
							finish("Section Title Edited Successfully");
						});
					}
					else if(req.body.editcardtitle) {
						var cardID = req.body.card;
						var title = req.body.title;

						board.findCard(cardID, function(err, card){
							card.title = title;
							board.save(function(err, board) {
								finish("Card Title Edited Successfully");
							});
						});
					}
					else if(req.body.editcarddescription) {
						var cardID = req.body.card;
						var description = req.body.description;

						board.findCard(cardID, function(err, card){
							card.description = description;
							board.save(function(err, board) {
								finish("Card Description Edited Successfully");
							});
						});
					}
					else if(req.body.editcardpriority) {
						var cardID = req.body.card;
						var priority = req.body.priority;

						board.findCard(cardID, function(err, card){
							card.priority = priority;
							board.save(function(err, board) {
								finish("Card Priority Edited Successfully");
							});
						});
					}

					else if(req.body.deletesection) {
						var section = req.body.section;
						board.sections[section].remove();
						board.save(function(err, board) {
							finish("Section Deleted Successfully");
						});
					}
					else if(req.body.deletecard) {
						var section = req.body.section;
						var card = req.body.card;
						board.sections[section].cards[card].remove();
						board.save(function(err, board) {
							finish("Card Deleted Successfully");
						});
					}
					else if(req.body.removeattacheduser) {
						var cardID = req.body.card;
						var userID = req.body.user;

						board.findCard(cardID, function(err, card){
							for (var i = 0; i < card.users.length; i++) {
								var user = card.users[i];

								if(user.userID == userID) { 
									card.users[i].remove();
									board.save(function(err, board) {
										//finish("You have been unattached from the card <i>"+card.title+"</i>.");
										writePage(res, "User has successfully been unattached from the card <i>"+card.title+"</i>.");
										return;
									});
								}
							}
						});
					}
					else if(req.body.removeboarduser) {
						var userID = req.body.user;

						for(var i = 0; i < board.users.length; i++) {
							if(board.users[i].userID == userID) {
								board.users[i].remove();
								board.save(function(err, board) {
									writePage(res, "User has successfully been removed from the board.");
									return;
								});
								break;
							}
						}
					}
					else if(req.body.deletecomment) {
						var cardID = req.body.card;
						var commentI = req.body.comment;

						board.findCard(cardID, function(err, card){
							card.comments[commentI].remove();
							board.save(function(err, board) {
								finish("Comment Deleted Successfully");
							});
						});
					}
				}
			});
		}

		function finish(msg) {
			var message = (msg.type == "error" ? msg : { type:"success", message:msg })
			getAfterPost("board", req, res, message);
		}
	};

	exports.page.boardSettings = function(req, res) {
		if(requiresLogin(req, res)) return;
		
		var boardId = req.params.board;
		var html = "";
		Board.findById(boardId, function(err, board) {
			var privacy = board.boardType;
			html += "\
			<a href='/board/"+board._id+"'>< Back To Board</a>\
			<form action='"+req.path+"' method='POST'>\
				<select name='privacy'>\
					<option value='0' "+(privacy == 0 ? "selected" : "")+">Public</option>\
					<option value='1' "+(privacy == 1 ? "selected" : "")+">Private</option>\
					<option value='2' disabled>Public to Organization</option>\
				</select>\
				<input type='submit' name='editprivacy' value='Change Privacy' />\
			</form>\
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
		Board.findById(boardId, function(err, board) {
			if(req.body.delete) {
				board.remove();
				getAfterPost("home", req, res, { type:"success", message:"Board Successfully Deleted." });
			}
			else if(req.body.editprivacy) {
				var privacy = req.body.privacy;
				if(privacy != 0 && privacy != 1) {
					getAfterPost("boardSettings", req, res, { type:"error", message:"Board type isn't valid." });
				} else {
					board.boardType = privacy;
					board.save(function(board){
						getAfterPost("boardSettings", req, res, { type:"success", message:"Privacy successfully changed." });
					});
				}
			}
		});
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
		var organizationID = req.body.organization;
		var privacy = req.body.privacy;

		var message = "";
		var addError = function(msg) { message += ( message === "" ? msg : "<br />"+msg ) };

		var steps = makeSteps(normalChecks, checkOrganization, finish);
		steps.nextStep();

		function normalChecks() {
			if(boardName.length < 6 || boardName.length > 128) addError("Board Name must be between 6-128 characters long.");
			if(privacy != 0 && privacy != 1) addError("Board type isn't valid.");
			steps.nextStep();
		}

		function checkOrganization() {
			if(organizationID == -1) { /*Skip step - no organization selected*/ steps.nextStep(); }
			else {
				//confirm if the user is allowed to add the board to that organization
				//TODO - ##################################################################################### Actually check this ^ and if it exists
				if(false) {
					addError("You don't belong on this board.");
					steps.nextStep();
				}
				else {
					steps.nextStep();
				}
			}
		}

		function finish() {
			if(message === "") {
				var user = req.session.user;

				var newboard = new Board({ boardName: boardName, boardType: privacy });
				if(organizationID != -1) newboard.organizationID = organizationID;
				newboard.users.push({ userID:user._id, access:3 });

				newboard.save(function (err, newboard) {
					if (err) addError(err.message);
					var submitMessage = ( message === ""
						? { type:"success", message:"Board Created. <a href='/board/"+newboard._id+"'>Visit it now.</a>" }
						: { type:"error", message:message }
					);
					getAfterPost('createBoard', req, res, submitMessage);
				});
			} else {
				getAfterPost('createBoard', req, res, { type:"error", message:message });
			}
		}
	};
//}END Boards

//{REGION Organizations
	exports.page.organization = function(req, res) {
		var orgId = req.params.organization;
		var html = "";
		Organization.findById(orgId, function(err, org) {
			if(org) {
				//TODO ##################################################### same as board - check fi public private viewing, and only editable if logged in and in organization
				var canEdit = (req.session.user ? true : false);

				var usersIDs = [];
				for(var i = 0; i < org.users.length; i++) { usersIDs.push(org.users[i].userID); }
				User.findUsersById(usersIDs, function(err, users) {
					html += "<p><b>Created:</b> "+dateFormat(org.creationDate)+"</p>";
					html += "<h2>Users in the organization</h2>\
					<ul>";
					for(var i = 0; i < org.users.length; i++)
					{ var orguser = org.users[i], id = orguser.userID, user = users[id];
						html += util.format("<li><a href='/user/%s'>%s</a> (<b>Access:</b> %s)</li>", user.username, user.displayName, orguser.access);
					}
					html += "</ul>";
					if(canEdit) {
						html += "\
						<form method='POST' action='"+req.path+"'>\
							<label for='username'>Add User:</label>\
							<input type='text' name='username' placeholder='Username' />\
							<input type='submit' name='addUserToOrganization' value='Add' />\
							<p>Note: This must be thier username, not thier display name.</p>\
						</form>\
						";
						html += "<a style='float:right;' href='/organization/"+orgId+"/settings'>Edit Settings</a>";
					}
					writePage(res, pageBuilder.buildPage(html, org.name, req, res, res.submitMessage ));
				});
			} else {
				exports.page.page404(req, res);
			}
		});
	};

	exports.action.organization = function(req, res) {
		if(requiresLogin(req, res)) return;

		var orgId = req.params.organization;
		Organization.findById(orgId, function(err, organization) {
			if(!organization) { exports.page.page404(req, res); }
			else {
				// ###############################################################TODO: check if user on board / in an organization
				// If user cannot access board, print out error message and jump out of thread.
				if(false) {

				}// Else just continue

				if(req.body.addUserToOrganization) {
					var username = req.body.username;

					User.findByUsername(username, function(err, user) {
						if(user) {
							organization.users.push({ userID:user._id, access:1 });
							organization.save(function(err, organization) {
								finish("User Added to Organization Successfully");
							});
						} else {
							finish({ type:"error", message:"No user by the username <i>"+username+"</i> exists. Are you sure you entered thier username and not thier display name?" });
						}
					});
				}
			}

			function finish(msg) {
				var message = (msg.type == "error" ? msg : { type:"success", message:msg })
				getAfterPost("organization", req, res, message);
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
				//TODO ##################################################################################### also remove organizationID from boards (leave board)
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
			var user = req.session.user;

			var neworg = new Organization({ name: name, type: privacy });
			neworg.users.push({ userID:user._id, access:2 });

			neworg.save(function (err, neworg) {
				if (err) addError(err.message);
				var submitMessage = ( message === "" ? { type:"success", message:"Organization Created. (<a href='organization/"+neworg._id+"'>view it now</a>)" } : { type:"error", message:message } );
				getAfterPost('createOrganization', req, res, submitMessage);
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

	function getGravatar(email, size) {
		return "http://www.gravatar.com/avatar/"+md5(email)+"?s="+size+"&d=identicon";
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

	/* Callback returns: Value, Key */
	function forEachInAssoc(array, callback) {
		for(var key in array) { callback(array[key], key); }
	}
//}END Helper Functions