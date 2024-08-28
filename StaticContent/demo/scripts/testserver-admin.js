// ====================================================================================================
// TestServer-admin.js
// ====================================================================================================
var DEMO = window.DEMO;

var sampleText;
var responseText;

$(function () {
	DEMO.loadCommon();

	$("#clearscreen").on("click", function () {
		doGet("/test/clear", showResponse);
	});

	$("#getAbout").on("click", function () {
		doGet("/test/about", showResponse);
	});

	$("#getJson").on("click", function () {
		doGet("/test/json", showResponse);
	});

	$("#getArray").on("click", function () {
		doGet("/test/array", showResponse);
	});

	$("#getSnippets").on("click", function () {
		doGet("/test/snippets", showResponse);
	});

	$("#getVersions").on("click", function () {
		doGet("/test/versions", showResponse);
	});

	$("#getVersionsExt").on("click", function () {
		let tree_depth = $("input#tree_depth").val() || -1;
		doGet(`/test/versionsExt/${tree_depth}`, showRawResponse, 9000);
	});

	$("#getPing").on("click", function () {
		doGet("/test/ping", showResponse, 50);
	});

	$("#resizeGif").on("click", function () {
		const json = {
			"base64String": sampleText.val(),
			"width": 150
		};
		doPut("/test/resize-gif", json, showResponse);
	});

	$("#uploadGif").on("click", function () {
		const json = {
			"base64String": sampleText.val(),
			"filename": "testserver.gif"
		};
		doPut("/test/upload-gif", json, showResponse);
	});

	$("button#copySample").on("click", (e) => {
		copySample(e);
	});

	$("button#copyResponse").on("click", (e) => {
		copyResponse(e);
	});

	sampleText = $("textarea#sampleText");
	sampleText.val(ts_jsonText);
	responseText = $("textarea#responseText");

	setToolTips();
});

function doGet(route, callback, msTimeout) {
	modal_background.style.display = "block";
	DEMO.doGet(route, callback, msTimeout);
}

function doPut(route, data, callback) {
	modal_background.style.display = "block";
	DEMO.doPut(route, data, callback);
}

function showResponse() {
	let retVal = JSON.stringify(arguments[0], null, 2);
	responseText.val(retVal);
	modal_background.style.display = "none";
}

function showRawResponse() {
	let retVal = JSON.stringify(arguments[0], null, 2);
	retVal = getUnescapedString(retVal);
	responseText.val(retVal);
	modal_background.style.display = "none";
}

function copySample(e) {
	const textArea = document.getElementById("sampleText");
	const text = getSelectedText(textArea);
	if (!text) {
		MISC.showDialog("There is nothing to copy.", e.target, 3000, textArea);
		return;
	}
	textArea.focus();
	navigator.clipboard.writeText(text);
	const isAll = textArea.selectionStart === textArea.selectionEnd;
	MISC.showDialog(`${isAll ? "All the" : "The selected"} 'Sample' text was copied to the clipboard!`, e.target, 3000, textArea);
}

function copyResponse(e) {
	const textArea = document.getElementById("responseText");
	let text = getSelectedText(textArea);
	if (!text) {
		MISC.showDialog("There is nothing to copy.", e.target, 3000, textArea);
		return;
	}
	if (e.ctrlKey) {
		text = getUnescapedString(text);
	}
	textArea.focus();
	navigator.clipboard.writeText(text);
	const isAll = textArea.selectionStart === textArea.selectionEnd;
	MISC.showDialog(`${isAll ? "All the" : "The selected"} 'Response' text was copied ${e.ctrlKey ? "(unescaped)" : ""} to the clipboard!`, e.target, 3000, textArea);
}

function getUnescapedString(escapedString) {
	return (!escapedString)
		? null
		: escapedString
			.replace(/[\n]+$/g, "")
			.replace(/\\'/g, "'")
			.replace(/\\"/g, '"')
			.replace(/\\t/g, "\t")
			.replace(/\\n/g, "\n")
			.replace(/\\r/g, "\r")
		;
}

function getSelectedText(textArea) {
	// Obtain index of the first selected character.
	const start = textArea.selectionStart;
	// Obtain index of the last selected character.
	const finish = textArea.selectionEnd;
	// Return selected text.
	return (start !== finish) ? textArea.value.substring(start, finish) : textArea.value;
}

function setToolTips() {
	$("#clearscreen").tooltip({
		content: "<b>Clears</b> the <i>Test Server</i> console window."
			+ "<p class='small'>[Uses: '/test/clear' route].</p>"
	});
	$("#getAbout").tooltip({
		content: "Gets <b>About</b> html data from the <i>Test Server</i>."
			+ "<p class='small'>[Uses: '/test/about' route].</p>"
	});
	$("#getArray").tooltip({
		content: "Gets an <b>Array</b> from the <i>Test Server</i>."
			+ "<p class='small'>[Uses: '/test/array' route].</p>"
	});
	$("#getJson").tooltip({
		content: "Gets a <b>Json</b> object from the <i>Test Server</i>."
			+ "<p class='small'>[Uses: '/test/json' route].</p>"
	});
	$("#getSnippets").tooltip({
		content: "Gets all the <b>Snippets</b> from DevTools."
			+ "<p class='small'>[Uses: '/test/snippets' route].</p>"
	});
	$("#getVersions").tooltip({
		content: "Gets the <b>dependencies</b> of each module referenced in the <i>Test Server's</i> '<b>package.json</b>' file."
			+ "<p class='small'>[Uses: '/test/versions' route].</p>"
	});
	$("#getVersionsExt").tooltip({
		content: "Gets the <b>dependencies</b> of each module referenced in the <i>Test Server's</i> '<b>package.json.lock</b>' file."
			+ "<p class='small'>[Uses: '/test/versionsext/{depth}' route].</p>"
	});
	$("#tree_depth_label, #tree_depth").tooltip({
		content: "Specifies the depth (a number between 0 and 9), of the tree to be displayed."
	});
	$("#getPing").tooltip({
		content: "Pings the server and returns \"{success}\" or \"Fetch request timed out.\"."
			+ "<p class='small'>[Uses: '/test/ping' route].</p>"
	});
	$("#copySample").tooltip({ content: "Click to copy all the <b>'Sample'</b> text to the clipboard …" });
	$("#sampleText").tooltip({ content: "Contains the base64string used for test purposes." });
	$("#resizeGif").tooltip({
		content: "Resizes the image (i.e., scales it by 50%), represented by the base64string"
			+ "<p class='small'>[Uses: '/test/resize-gif' route].</p>"
	});
	$("#uploadGif").tooltip({
		content: "Uploads the GIF data (Base64String) to the <i>Test Server</i>."
			+ "<p class='small'>[Uses: '/test/upload-gif'] route.</p>"
	});
	$("#copyResponse").tooltip({
		content: "Click to copy <i>all</i> or just the <i>selected</i> <b>'Response'</b> text to the clipboard."
			+ "<p class='small'>(Hold down the control key to&nbsp;<b>unescape</b>&nbsp;the copied text) …</p>"
	});
	$("#responseText").tooltip({ content: "Shows the response text received from the <i>Test Server</i>." });
}
