/* Script tag defined at bottom of page, so no onload neccisary */
function $$(query) { return document.querySelector(query); }

(function init() {
	window.addEventListener('resize', windowResized);
	windowResized();
})();

function windowResized(e) {
	var board = $$("#board");
	if(board) {
		var footer = $$("body>footer");
		board.style.height = (window.innerHeight - board.offsetTop - footer.offsetHeight - 6/*margin between #content and footer*/)+"px";
	}
}