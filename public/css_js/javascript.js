/* Script tag defined at bottom of page, so no onload neccisary */
//{REGION Helper Methods
	function $$(query) { return document.querySelector(query); }
	function $$A(query) { return document.querySelectorAll(query); }

	function forEach(collection, callback) { Array.prototype.forEach.call(collection, callback); }

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
//}END Helper Methods

var board = $$("#board");
var overlay = $$("#overlay");
var messageDiv = $$("#message");

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
	// 		}).fail(function(jqXHR, textStatus, errorThrown){ wndw.innerHTML = errorThrown; });
	// 	});
	// }

	if(board) {
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
									messageDiv.innerHTML = "";
									newElement("div", { className:"success", innerHTML:data }, messageDiv);
								})
								.fail(function(jqXHR, textStatus, errorThrown){ wndw.innerHTML = errorThrown; });
							});
						}

						var removeattacheduser = $$(".removeattacheduser");
						if(removeattacheduser) {
							removeattacheduser.addEventListener("click", function(){
								var card = $$("#cardID").value;
								var user = removeattacheduser.parentElement.dataset.user;
								$.post(document.location.href, { card:card, user:user, removeattacheduser: "remove" }, function(data) {
									removeOverlay();
									messageDiv.innerHTML = "";
									newElement("div", { className:"success", innerHTML:data }, messageDiv);
								})
								.fail(function(jqXHR, textStatus, errorThrown){ wndw.innerHTML = errorThrown; });
							});
						}

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
					})
					.fail(function(jqXHR, textStatus, errorThrown){ wndw.innerHTML = errorThrown; });
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

function windowResized(e) {
	if(board) {
		var footer = $$("body>footer");
		board.style.height = (window.innerHeight - board.offsetTop - footer.offsetHeight - 6/*margin between #content and footer*/)+"px";
	}
}

function newWindow(innerHTML) {
	overlay.style.display = "block";
	overlay.innerHTML = "";
	return newElement("div", { className:"window", innerHTML:innerHTML }, overlay);
}
function removeOverlay(e) { overlay.style.display = "none"; }