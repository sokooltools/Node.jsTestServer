// ====================================================================================================
// AjaxTest.js
// ====================================================================================================
var CFG = window.CFG;

$(document).ready(function() {
	$("#back").button().on("click", function() {
		DEMO.goHome();
		return false;
	});
	$("#run").button().on("click", function() {
		LoadXmlDoc();
		return false;
	});
});

// -------------------------------------------------------------------------------------------
// xhr.readyState
// -------------------------------------------------------------------------------------------
// 0	UNSENT	            Client has been created. open() not called yet.
// 1	OPENED	            open() has been called.
// 2	HEADERS_RECEIVED	send() has been called, and headers and status are available.
// 3	LOADING	            Downloading; responseText holds partial data.
// 4	DONE	            The operation is complete
// -------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------
// Loads text retrieved from the server into the document.
// -------------------------------------------------------------------------------------------
function LoadXmlDoc() {
	var xhr;
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xhr = new window.XMLHttpRequest();
	} else { // code for IE6, IE5
		xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			//document.getElementById('myDiv').innerHTML = xhr.responseText;
			var sel = $("div#myDiv");
			sel.html($.parseHTML(xhr.responseText));
			//eval(sel.innerHTML);  // Doesn't work properly in IE
		}
	};
	try {
		// Note: The following only works when retrieving data from an actual web server!
		xhr.open("GET", "AjaxTest.txt", true);
		xhr.send();
	} catch (e) {
		CFG.showError(e.toString());
	}
}

// -------------------------------------------------------------------------------------------
// Shows a modal dialog.
// -------------------------------------------------------------------------------------------
// ReSharper disable once UnusedLocals
function myShowDialog(message, title) {
	$("<div>").dialog({
		modal: true,
		autoOpen: true,
		open: function() {
			$(this).html(message);
		},
		close: function() {
			$(this).dialog("close");
		},
		buttons: {
			'OK': function() {
				$(this).dialog("close");
			}
		},
		width: 400,
		height: 200,
		title: (title) ? title : "jQuery Demos"
	});
}
