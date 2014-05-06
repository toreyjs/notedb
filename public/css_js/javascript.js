/* Script tag defined at bottom of page, so no onload neccisary */
//{REGION Utilities
	// Uses $$ so it returns a javascript object, not a jquery one.
	function $$(query, parent/*optional*/) { return (parent ? parent : document).querySelector(query); }
	function $$A(query, parent/*optional*/) { return (parent ? parent : document).querySelectorAll(query); }

	function forEach(collection, callback) { if(collection != undefined) { Array.prototype.forEach.call(collection, callback); } }

	// Creates a new HTML element (not jQuery) with specific attributes
	function newElement(tag, attributes, parent) {
		var element = document.createElement(tag);
		if(attributes != undefined) {
			if(attributes.class != undefined) { attributes.className = attributes.class; attributes.class = undefined; }
			if(attributes.inner != undefined) { attributes.innerHTML = attributes.inner; attributes.inner = undefined; }
			for(var key in attributes)
				element[key] = attributes[key];
		}
		if(parent != undefined) parent.appendChild(element);
		return element;
	}

	function removeElem(elem) {
		elem.parentNode.removeChild(elem);
	}

	function addListener(elem, type, callback) {
		if(elem != undefined) {
			elem.addEventListener(type, callback);
		}
	}

	function toggleVisibility(elem) {
		elem.style.visibility = (elem.style.visibility == 'hidden' ? 'visible' : 'hidden');
	}
//}END Utilities

var board = $$("#board");
var overlay = $$("#overlay");
var chat = new Chat();
var socket = io.connect("//"+window.location.hostname
	+(window.location.hostname == "localhost"
		? ""
		: ":"+(window.location.protocol == "http:" ? "8000" : "8443")
	)
);

(function init() {
	doSocketStuff();

	window.addEventListener('resize', windowResized);
	windowResized();

	overlay.addEventListener("click", function(e) { if(e.target.id == "overlay") { removeOverlay(); } } );

	if(loginlink = $$("#loginlink")) {
		loginlink.addEventListener("click", function(e) {
			e.preventDefault();
			var wndw = newWindow("\
			<form id='loginform' action='/login' method='POST' style='display:inline-block; padding-right:10px;'>\
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
			");

			$$("form input[name=username]", wndw).focus();
		});
	}

	addBoardEvents();
})();

function addBoardEvents() {
	if(board) {
		if(addUserToBoard = $$("#addUserToBoard")) {
			addUserToBoard.addEventListener("click", function(){
				var addUserToBoardContainer = addUserToBoard.parentElement;

				toggleVisibility(addUserToBoard);

				var form = newElement("form", { method:'POST', action:document.location.href }, addUserToBoardContainer);
				newElement("input", { type:'text', name:'username', placeholder:'Username' }, form)
				.focus();
				//newElement("input", { type:'hidden', name:'addUserToBoard', value:'true' }, form);
				var submit = newElement("input", { type:'submit', name:'addUserToBoard', value:'Add' }, form);
				newElement("p", { innerHTML:'Note: This must be thier username, not thier display name.' }, form);

				form.onsubmit = function() {
					removeMessage();
					submit.disabled = true;
					$(getLoadingImg()).insertAfter(submit);
					$.post(form.action, serializePlusSubmit(form), function(data) {
						var userData = $(data);
						userData.insertBefore(addUserToBoardContainer);
						userData.bind("click", removeboarduserEvent);
					})
					.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); })
					.always(function() {
						removeElem(form);
						toggleVisibility(addUserToBoard);
					});
					return false; // Stops form from auto-submitting so the javascript can handle it.
				};
			});
		}

		forEach($$A(".cards-inner"), function(inner) {
			var elementwidths = 0;
			forEach(inner.children, function(child) {
				elementwidths += child.offsetWidth;
			});
			inner.style.width = (elementwidths+3/*So zoom doesn't **** it up as often*/)+"px";
		});

		forEach($$A(".removeboarduser"), function(removeboarduser) {
			removeboarduser.addEventListener("click", removeboarduserEvent);
		});

		// Clicking Cards
		forEach($$A(".card"), function(card) {
			addCardEvents(card);
		});

		// Editing Section button
		forEach($$A(".sectionheader.editable"), function(header) {
			header.addEventListener("click", function(e) {
				if(header.querySelector("form") == undefined) {
					var text = header.innerHTML;
					var section = header.dataset.section;

					header.innerHTML = "\
					<form method='POST' action='"+document.location.href+"' style='display:inline-block;'>\
						<input type='hidden' name='section' value='"+section+"' />\
						<input type='text' name='title' value='"+text+"' style='width:500px;' />\
						<input type='submit' name='editsectiontitle' value='Save' />\
					</form>\
					";
				}
			});
		});
	}
}

function addCardEvents(card) {
	card.addEventListener("click", function(e) {
		if(e.target.className == "card") {
			var wndw = newWindow(getLoadingImg().outerHTML+" Loading...");
			$.get( document.URL+"?get=window&card="+card.id, function(data) {
				wndw.innerHTML = data;

				addListener($$(".editcardtitle"), "click", editcardtitleEvent);

				addListener($$(".editcarddescription"), "click", editcarddescriptionEvent);

				addListener($$(".attachselftocard"), "click", attachselftocardEvent);

				forEach($$A(".removeattacheduser"), function(removeattacheduser) {
					removeattacheduser.addEventListener("click", removeattacheduserEvent);
				});

				addListener($$(".editcardpriority"), "click", editcardpriorityEvent);

				if(newcommentform = $$(".newcomment form")) {
					newcommentform.onsubmit = function() {
						var loading = getLoadingImg(newcommentform);
						removeMessage();

						$.post(newcommentform.action, serializePlusSubmit(newcommentform), function(data) {
							$$(".comments-section").innerHTML = data;
							newcommentform.reset();
							forEach($$A(".comment .deletecommentForm"), function(form) {
								form.onsubmit = deletecommentEvent;
							});
						})
						.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); })
						.always(function() {
							removeElem(loading);
						});
						return false; // Stops form from auto-submitting so the javascript can handle it.
					}
				}

				forEach($$A(".comment .deletecommentForm"), function(form) {
					form.onsubmit = deletecommentEvent;
				});
			})
			.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
		}
	});
}

//{REGION Event Handlers
	function editcardtitleEvent(e){
		var editcardtitle = e.target;
		var title = editcardtitle.parentElement;
		var text = title.querySelector(".cardtitle-text").innerHTML;
		var card = title.dataset.card;

		title.innerHTML = "";
		var form = newElement("form", {
			method:"POST",
			action:document.location.href,
			innerHTML:"\
			<input type='hidden' name='card' value='"+card+"' />\
			<input type='text' name='title' value='"+text+"' style='width:407px;' />\
			<input type='submit' name='editcardtitle' value='Save Title' />\
			"
		}, title);

		form.onsubmit = function() {
			var submit = $$("[type=submit]", form);
			submit.disabled = true;
			$(getLoadingImg()).insertAfter(submit);

			$.post(form.action, serializePlusSubmit(form), function(data) {
				title.innerHTML = data;
				$$(".editcardtitle").addEventListener("click", editcardtitleEvent);
			})
			.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
			return false;
		}
	}

	function editcarddescriptionEvent(e){
		var editcarddescription = e.target;
		var desc = editcarddescription.parentElement;
		var text = desc.querySelector(".description-text").innerHTML;
		var card = desc.dataset.card;

		desc.innerHTML = "";
		var form = newElement("form", {
			method:"POST",
			action:document.location.href,
			innerHTML:"\
			<input type='hidden' name='card' value='"+card+"' />\
			<textarea name='description' style='width:100%;'>"+text+"</textarea><br />\
			<input type='submit' name='editcarddescription' value='Save Description' />\
			"
		}, desc);

		form.onsubmit = function() {
			var submit = $$("[type=submit]", form);
			submit.disabled = true;
			$(getLoadingImg()).insertAfter(submit);

			$.post(form.action, serializePlusSubmit(form), function(data) {
				desc.innerHTML = data;
				$$(".editcarddescription").addEventListener("click", editcarddescriptionEvent);
			})
			.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
			return false;
		}
	}

	function attachselftocardEvent(e){
		var attachselftocard = e.target;
		var container = attachselftocard.parentElement;

		var card = $$("#cardID").value;
		$.post(document.location.href, { card:card, attachselftocard: "attach" }, function(data) {
			container.innerHTML = data;
			forEach($$A(".removeattacheduser"), function(removeattacheduser) {
				removeattacheduser.addEventListener("click", removeattacheduserEvent);
			});
		})
		.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
	}

	function removeattacheduserEvent(e){
		var removeattacheduser = e.target;
		var card = $$("#cardID").value;
		var user = removeattacheduser.parentElement.dataset.user;
		var container = removeattacheduser.parentElement.parentElement;

		removeMessage();
		$.post(document.location.href, { card:card, user:user, removeattacheduser: "remove" }, function(data) {
			container.innerHTML = data;
			addListener($$(".attachselftocard"), "click", attachselftocardEvent);
			forEach($$A(".removeattacheduser"), function(removeattacheduser) {
				removeattacheduser.addEventListener("click", removeattacheduserEvent);
			});
		})
		.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
	}

	function editcardpriorityEvent(e) {
		var editcardpriority = e.target;
		var priority = editcardpriority.parentElement;
		var pInt = priority.dataset.priority;
		var card = priority.dataset.card;

		priority.innerHTML = "";
		var form = newElement("form", {
			method:"POST",
			action:document.location.href,
			innerHTML:"\
			<input type='hidden' name='card' value='"+card+"' />\
			<select name='priority'>\
				<option value='0' "+(pInt == 0 ? "selected" : "")+">[None]</option>\
				<option value='1' "+(pInt == 1 ? "selected" : "")+">Low</option>\
				<option value='2' "+(pInt == 2 ? "selected" : "")+">Medium</option>\
				<option value='3' "+(pInt == 3 ? "selected" : "")+">High</option>\
			</select>\
			<input type='submit' name='editcardpriority' value='Save Title' />\
			"
		}, priority);

		form.onsubmit = function(e) {
			var submit = $$("[type=submit]", form);
			submit.disabled = true;
			$(getLoadingImg()).insertAfter(submit);
			$.post(form.action, serializePlusSubmit(form), function(data) {
				priority.outerHTML = data;
				$$(".editcardpriority").addEventListener("click", editcardpriorityEvent);
			})
			.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
			return false;
		}
	}

	function removeboarduserEvent(e){
		var removeboarduser = e.target;
		var parent = removeboarduser.parentElement;
		var user = parent.dataset.user;

		removeMessage();
		$.post(document.location.href, { user:user, removeboarduser: "remove" }, function(data) {
			removeElem(parent);
			printMessage(SUCCESS, data);
		})
		.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
	}

	function deletecommentEvent(e){
		var form = e.target;
		getLoadingImg(form);
		// Why does this kill everything?
		//$$("[type=submit]", form).disabled = true;
		removeMessage();

		$.post(form.action, serializePlusSubmit(form), function(data) {
			$$(".comments-section").innerHTML = data;
			forEach($$A(".comment .deletecommentForm"), function(form) {
				form.onsubmit = deletecommentEvent;
			});
		})
		.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
		return false; // Stops form from auto-submitting so the javascript can handle it.
	}
//}END Event Handlers

//{REGION Sockets
	function doSocketStuff() {
		// socket.on('news', function (data) {
		// 	console.log(data);
		// 	socket.emit('my other event', { my: 'data' });
		// });

		
		//  $("#setNickName").click(function(){
		// 	$("#setNickSpace").hide();
		// 	$("#chat").show();
		// 	chat.Connect($("#nickname").val(), $("#room").val());
		// } );
		if($$("#chat") != undefined) {
			var displayname = $$("#userbox .userLink") != undefined ? $$("#userbox .userLink").innerHTML : "Guest";
			chat.Connect(displayname, window.location.pathname);
			
			$('textarea#chatMessage').bind('keypress', function(e) {
				if(e.keyCode==13){
					e.preventDefault();
					sendMsg();
				}
			});
			$("#sendChatMessage").click(function() {
				sendMsg();
			});
			function sendMsg(){
				var chatMessage = $$("#chatMessage");
				chat.Send(chatMessage.value);
				chatMessage.value = "";
			}
			var today = new Date();
			var offset = -(today.getTimezoneOffset()/60);
		}
	}

	//http://www.ranu.com.ar/post/50418940422/redisstore-and-rooms-with-socket-io
	function Chat(){
		var MESSAGE_TYPE = Object.freeze({ SYSTEM:"system", USER:"user" });
		var chatElement = $$("#chat");
		var _nickname = "";
		var _room = "";

		this.Connect = function(nick, room){
			_nickname = nick;
			_room = room;

			socket.on('connect', function (data) {
				socket.emit('chatSignIn', {nick: nick, room: room});
			});

			socket.on("message", printMessage);
		};

		this.Send = function Send(msg) {
			socket.emit("message", {msg: msg, nick: _nickname} , function(response) {
				printMessage(response);
			});
		};

		function printMessage(response) {
			var type = response.type, message = response.msg, messageElement = "No message?";
			switch(type) {
				case MESSAGE_TYPE.SYSTEM:
					messageElement = newElement("div", { class:"systemMessage", inner:message });
					break;
				case MESSAGE_TYPE.USER:
					messageElement = newElement("div", { class:"userMessage", inner:("<span class='name'>"+response.nick+":</span> "+message) });
					break;
			}
			chatElement.appendChild(messageElement);
			chatElement.scrollTop = chatElement.scrollHeight;
		}
	}
//}END Sockets

//{REGION Helper Methods
	function windowResized(e) {
		if(board) {
			var footer = $$("#pagefooter");
			board.style.height = (window.innerHeight - board.offsetTop - footer.offsetHeight - 6/*margin between #content and footer*/)+"px";
		}
	}

	function newWindow(innerHTML) {
		overlay.style.display = "block";
		overlay.innerHTML = "";
		var wndw = newElement("div", { className:"window" }, overlay);
		newElement("div", { id:"windowMessage", className:"message-container" }, wndw);
		var wndwContent = newElement("div", { innerHTML:innerHTML }, wndw);
		return wndwContent;
	}
	function removeOverlay(e) { overlay.style.display = "none"; }

	function getLoadingImg(parent/*optional [appends to parent just like newElement]*/) {
		return newElement("img", { src:'/images/loading.gif', alt:'Loading...' }, parent);
	}

	var messageDiv = $$("#message"), SUCCESS = "success", FAIL = "error";
	function printMessage(type, message) {
		removeOverlay();
		messageDiv.innerHTML = "";
		newElement("div", { className:type, innerHTML:message }, messageDiv);
		windowResized();
	}
	function removeMessage() {
		messageDiv.innerHTML = "";
		windowResized();
	}

	function serializePlusSubmit(form) {
		var $form = (form instanceof jQuery ? form : $(form));
		var text = $form.serialize();
		var firstSubmit = $form.find("[type=submit]")[0];
		if(firstSubmit) {
			text += (text != "" ? "&" : "")+firstSubmit.name+"="+firstSubmit.value;
		}
		return text;
	}
//}END Helper Methods