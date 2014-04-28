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
			for(var key in attributes)
				element[key] = attributes[key];
		}
		if(parent != undefined) parent.appendChild(element);
		return element;
	}

	function removeElem(elem) {
		elem.parentNode.removeChild(elem);
	}

	function toggleVisibility(elem) {
		elem.style.visibility = (elem.style.visibility == 'hidden' ? 'visible' : 'hidden');
	}
//}END Utilities

var board = $$("#board");
var overlay = $$("#overlay");
//var socket = io.connect('http://localhost');
//{REGION Sockets
	// socket.on('news', function (data) {
	// 	console.log(data);
	// 	socket.emit('my other event', { my: 'data' });
	// });
//}END Sockets

(function init() {
	window.addEventListener('resize', windowResized);
	windowResized();

	overlay.addEventListener("click", function(e) { if(e.target.id == "overlay") { removeOverlay(); } } );

	// var loginlink = $$("#loginlink");
	// if(loginlink) {
	// 	loginlink.addEventListener("click", function(e) {
	// 		e.preventDefault();
	// 		var wndw = newWindow("Un momento, por favour...");
	// 		$.get( "/login?get=window", function(data) {
	// 			wndw.innerHTML = data;
	// 		}).fail(function(jqXHR){ wndw.innerHTML = jqXHR.responseText; });
	// 	});
	// }

	if(board) {
		var addUserToBoard = $$("#addUserToBoard");
		if(addUserToBoard) {
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
					.fail(function(jqXHR){ console.log(arguments); printMessage(FAIL, jqXHR.responseText); })
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
			card.addEventListener("click", function(e) {
				if(e.target.className == "card") {
					var wndw = newWindow("Loading...");
					$.get( document.URL+"?get=window&card="+card.id, function(data) {
						wndw.innerHTML = data;

						var editcardtitle = $$(".editcardtitle");
						if(editcardtitle) {
							editcardtitle.addEventListener("click", function(){
								var title = editcardtitle.parentElement;
								var text = title.querySelector(".cardtitle-text").innerHTML;
								var card = title.dataset.card;

								title.innerHTML = "\
								<form method='POST' action='"+document.location.href+"'>\
									<input type='hidden' name='card' value='"+card+"' />\
									<input type='text' name='title' value='"+text+"' style='width:407px;' />\
									<input type='submit' name='editcardtitle' value='Save Title' />\
								</form>\
								";
							});
						}

						var editcarddescription = $$(".editcarddescription");
						if(editcarddescription) {
							editcarddescription.addEventListener("click", function(){
								var desc = editcarddescription.parentElement;
								var text = desc.querySelector(".description-text").innerHTML;
								var card = desc.dataset.card;

								desc.innerHTML = "\
								<form method='POST' action='"+document.location.href+"'>\
									<input type='hidden' name='card' value='"+card+"' />\
									<textarea name='description' style='width:100%;'>"+text+"</textarea><br />\
									<input type='submit' name='editcarddescription' value='Save Description' />\
								</form>\
								";
							});
						}

						var attachselftocard = $$(".attachselftocard");
						if(attachselftocard) {
							attachselftocard.addEventListener("click", function(){
								var card = $$("#cardID").value;
								$.post(document.location.href, { card:card, attachselftocard: "attach" }, function(data) {
									removeOverlay();
									printMessage(SUCCESS, data);
								})
								.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
							});
						}

						forEach($$A(".removeattacheduser"), function(removeattacheduser) {
							removeattacheduser.addEventListener("click", function(){
								var card = $$("#cardID").value;
								var user = removeattacheduser.parentElement.dataset.user;

								removeMessage();
								$.post(document.location.href, { card:card, user:user, removeattacheduser: "remove" }, function(data) {
									removeOverlay();
									printMessage(SUCCESS, data);
								})
								.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
							});
						});

						var editcardpriority = $$(".editcardpriority");
						if(editcardpriority) {
							editcardpriority.addEventListener("click", function(){
								var priority = editcardpriority.parentElement;
								var pInt = priority.dataset.priority;
								var card = priority.dataset.card;

								priority.innerHTML = "\
								<form method='POST' action='"+document.location.href+"'>\
									<input type='hidden' name='card' value='"+card+"' />\
									<select name='priority'>\
										<option value='0' "+(pInt == 0 ? "selected" : "")+">[None]</option>\
										<option value='1' "+(pInt == 1 ? "selected" : "")+">Low</option>\
										<option value='2' "+(pInt == 2 ? "selected" : "")+">Medium</option>\
										<option value='3' "+(pInt == 3 ? "selected" : "")+">High</option>\
									</select>\
									<input type='submit' name='editcardpriority' value='Save Title' />\
								</form>\
								";
							});
						}

						var newcommentform = $$(".newcomment form");
						if(newcommentform) {
							newcommentform.onsubmit = function() {
								var loading = getLoadingImg(newcommentform);
								removeMessage();

								$.post(newcommentform.action, serializePlusSubmit(newcommentform), function(data) {
									var comment = $(data)[0];
									newcommentform.parentElement.parentElement.appendChild(comment);
									newcommentform.reset();
									$$(".comment .comment-wrapper form", comment).onsubmit = deletecommentEvent;
								})
								.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); })
								.always(function() {
									removeElem(loading);
								});
								return false; // Stops form from auto-submitting so the javascript can handle it.
							}
						}

						forEach($$A(".comment .comment-wrapper form"), function(form) {
							form.onsubmit = deletecommentEvent;
						});
					})
					.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
				}
			});
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
})();

//{REGION Event Handlers
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
			removeElem(form.parentElement.parentElement);
		})
		.fail(function(jqXHR){ printMessage(FAIL, jqXHR.responseText); });
		return false; // Stops form from auto-submitting so the javascript can handle it.
	}
//}END Event Handlers

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
		return newElement("div", { className:"window", innerHTML:innerHTML }, overlay);
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