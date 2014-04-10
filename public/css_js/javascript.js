/* Script tag defined at bottom of page, so no onload neccisary */
//{REGION Helper Methods
	function $$(query) { return document.querySelector(query); }
	function $$A(query) { return document.querySelectorAll(query); }

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

(function init() {
	window.addEventListener('resize', windowResized);
	windowResized();

	var cards = $$A(".card");
	var overlay = $$("#overlay");
	Array.prototype.forEach.call(cards, function(card) {
		card.addEventListener("click", function () {
			overlay.style.display = "block";
			overlay.innerHTML = "";

			var wndw = newElement("div", { className:"window", innerHTML:"Loading..." }, overlay);

			$.get( document.URL+"?get=window&card="+card.id, function(data) {
				console.log("Got");
				wndw.innerHTML = data;
			}).fail(function(jqXHR, textStatus, errorThrown){ wndw.innerHTML = errorThrown; });
		});
	});

	overlay.addEventListener("click", removeOverlay);
	function removeOverlay() { overlay.style.display = "none"; }
})();

function windowResized(e) {
	if(board) {
		var footer = $$("body>footer");
		board.style.height = (window.innerHeight - board.offsetTop - footer.offsetHeight - 6/*margin between #content and footer*/)+"px";
	}
}