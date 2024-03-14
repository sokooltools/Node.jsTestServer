// ====================================================================================================
// TestServer-admin.js
// ====================================================================================================
var DEMO = window.DEMO;

var sampleText;

$(function () {
	DEMO.loadCommon();

	$("#clearscreen").on("click", function () {
		DEMO.doGet("/test/clear", foo);
	});

	$("#getAbout").on("click", function () {
		DEMO.doGet("/test/about", foo);
	});

	$("#getJson").on("click", function () {
		DEMO.doGet("/test/json", foo);
	});

	$("#getArray").on("click", function () {
		DEMO.doGet("/test/array", foo);
	});

	$("#getVersion").on("click", function () {
		DEMO.doGet("/test/versions", foo);
	});

	$("#resizeGif").on("click", function () {
		const json = {
			"base64String": sampleText.val(),
			"width": 150
		}
		DEMO.doPut("/test/resize-gif", json, foo);
	});

	$("#uploadGif").on("click", function () {
		const json = {
			"base64String": sampleText.val(),
			"filename": "testserver.gif"
		}
		DEMO.doPut("/test/upload-gif", json, foo);
	});

	sampleText = $("textarea#sampleText")
	sampleText.val(ts_jsonText);
});

function foo(data) {
	$("textarea#responseText").val(data);
}

// Select all div elements 
const divElements = document.querySelectorAll('div'); 
 
// Function to disable div content 
function disableDivContent() { 
  divElements.forEach((div) => { 
    div.style.pointerEvents = 'none'; // Disable pointer events 
    div.style.opacity = '0.5'; // Reduce opacity to visually disable the content 
    div.setAttribute('disabled', true); // Set disabled attribute 
  }); 
} 