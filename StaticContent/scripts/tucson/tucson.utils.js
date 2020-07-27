// =======================================================================================================
// tucson.utils.js
// =======================================================================================================
var CMN = window.CMN;

// Make sure required JavaScript modules are loaded.
if (typeof jQuery === "undefined") {
	throw "jQuery.js must be loaded before this module.";
}
if (typeof CMN === "undefined") {
	throw "tucson.common.js must be loaded before this module.";
}

var UTL = {};

// -------------------------------------------------------------------------------------------
// winDelta.x = the adjustment for right and left margins of the browser.
// winDelta.y = the adjustment for top and bottom margins plus menubar, toolbars, statusbar.
// -------------------------------------------------------------------------------------------
UTL.winDelta = null;

// -------------------------------------------------------------------------------------------
// Gets or sets the document size (i.e., width and height).
// An object containing the current width and height are always returned (even when the width
// and height arguments are not specified).
// -------------------------------------------------------------------------------------------
UTL.docSize = function(w, h) {
	if (typeof w == "number" && typeof h == "number") {
		if (UTL.winDelta) {
			window.resizeTo(w + UTL.winDelta.x, h + UTL.winDelta.y);
		} else {
			UTL.maximize();
			while (!UTL.winDelta) {
				var size = UTL.docSize();
				var adjX = screen.availWidth - size.Width;
				var adjY = screen.availHeight - size.Height;
				window.resizeTo(w + adjX, h + adjY);
				UTL.winDelta = { x: adjX, y: adjY };
			}
		}
	}
	return { Width: $(document).outerWidth(), Height: $(document).outerHeight() };
};

// -------------------------------------------------------------------------------------------
// Maximizes the current window.
// -------------------------------------------------------------------------------------------
UTL.maximize = function() {
	top.window.moveTo(0, 0);
	if (document.all) {
		top.window.resizeTo(screen.availWidth, screen.availHeight);
	} else if (document.layers || document.getElementById) {
		if (top.window.outerHeight < screen.availHeight || top.window.outerWidth < screen.availWidth) {
			top.window.outerHeight = screen.availHeight;
			top.window.outerWidth = screen.availWidth;
		}
	}
};

// -------------------------------------------------------------------------------------------
// Provides mechanism for calling back to the dot net hosted web browser.
// -------------------------------------------------------------------------------------------
UTL.cb = function(command, obj) {
	var cmd = command.substring(0, 3).toUpperCase();
	var args = UTL.extractArgsFromCommand(command);
	switch (cmd) {
		case "CAP": // CAPture (async)
		case "CAX": // CAPture (synch)
			var rect =
				document.parentWindow.screenLeft +
				"," +
				document.parentWindow.screenTop +
				"," +
				$(document).width() +
				"," +
				$(document).height();
			var waitTime = 100;
			var fileName = null;
			if (args.length > 1) {
				if (UTL.isNumber(args[1])) {
					waitTime = args[1];
				} else {
					fileName = args[1];
				}
			}
			if (args.length > 0) {
				if (UTL.isNumber(args[0])) {
					waitTime = args[0];
				} else {
					fileName = args[0];
				}
			}
			obj = { Rect: rect, WaitTime: waitTime, Filename: fileName, IsAsync: (cmd === "CAP") };
			break;
		case "AUT": // AUTosize (default)
		case "AUX": // AUTosize (optimal)
			var dsz = (window.CFG) ?
				window.CFG.defaultDocSize(cmd === "AUX") :
				{ width: $(document).width(), height: $(document).height() };
			obj = {
				Width: dsz.width,
				Height: dsz.height,
				UseOptimal: (cmd === "AUX"),
				IsAsync: true
			};
			break;
		case "EXE": // EXEcutes the specified script.
			var script = (args.length > 0) ? args[0] : null; // e.g. 'help/scripts/lgn_images.js';
			/*jslint evil: true */
			obj = UTL.execScript(script);
			/*jslint evil: false */
			break;
		case "FOC": // FOCus
			if (args.length > 0)
				$("#" + args[0]).focus();
			break;
		case "CLI": // CLIck
			if (args.length > 0)
				$("#" + args[0]).trigger("click");
			break;
		case "VAL": // VALue
			if (args.length > 1)
				$("#" + args[0]).val(args[1]);
			else if (args.length > 0)
				obj = $("#" + args[0]).val();
			break;
		case "SIZ": // Gets or sets the SIZE of the document window.
			if (args.length > 0) {
				obj = {
					Width: (args.length > 0) ? args[0] : -1,
					Height: (args.length > 1) ? args[1] : -1
				};
			} else {
				obj = UTL.docSize();
			}
			break;
		case "OUT": // Sets the OUTput path used by cropper.
			// Example: 'OUT "help\\images\\login\\test"'
			obj = { OutputPath: (args.length > 0) ? args[0] : null };
			break;
		case "TES": // Runs a TESt returning json content.
			obj = CMN.getJson("demo/data/userssessions.json");
			break;
		case "MSG": // MeSsaGe.
			obj = { Message: (args.length > 0) ? args[0] : null };
			break;
		case "CMD": // CoMmanD.
			obj = {
				Command: (args.length > 0) ? args[0] : null,
				Arguments: (args.length > 1) ? args[1] : null
			};
			break;
	}
	if (cmd && obj) {
		try {
			var jsonString = JSON.stringify(obj);
			window.external.Callback(cmd, jsonString);
		} catch (e) {
			if (e.name === "TypeError")
				console.log("This browser does not support UTL.cb('" + command + "').");
		}
	}
};

// -------------------------------------------------------------------------------------------
// Executes a script and returns the result as json.
// @Example:  UTL.execScript('help/scripts/login/lgn_images.js');
// -------------------------------------------------------------------------------------------
UTL.getScript = function(fpath) {
	fpath = UTL.trim(fpath);
	if (!fpath) {
		return { Result: "Error: A script file must be provided as an argument." };
	}
	if (!CMN.fileExists(fpath)) {
		return { Result: "Error: The specified script file ('" + fpath + "') does not exist." };
	}
	$.ajax({
		type: "GET",
		url: fpath,
		dataType: "text",
		async: false,
		success: function(s) {
			/*jslint evil: true */
			var rslt = UTL.execScript(s);
			/*jslint evil: false */
			return rslt;
		}
	});
	return {};
};

//// -------------------------------------------------------------------------------------------
//// Executes the specified script breaking up the string into groups based on brackets.
//// -------------------------------------------------------------------------------------------
///*jslint evil: true */
//UTL.execScript = function(s) {
//	var tokens = s.replace(/\/\/.*$/gm, '');
//	tokens = tokens.replace(/\{/gm, '').replace(/(^\s+|\s+$)/gm, '').replace(/\r\n/gm, '');
//	if (tokens.substr(tokens.length - 1) === '}')
//		tokens = tokens.substr(0, tokens.length - 1);
//	tokens = tokens.split('}');
//	// Add a message to the end of the script.
//	tokens.push('UTL.cb(\'msg \"Script finished.\"\');');
//	for (var i = 0; i < tokens.length; i++) {
//		eval("window.setTimeout(function() { " + tokens[i] + " }," + (i + 1) * 1000 + ");");
//	}
//	return { Result: 'Success' };
//};
///*jslint evil: false */

// -------------------------------------------------------------------------------------------
// Returns the specified string after converting 'WAIT nnnn' to window.setTimeout...
// -------------------------------------------------------------------------------------------
/*jslint evil: true */
UTL.execScript = function(s) {
	s = UTL.convertString(s);
	eval(s);
};
/*jslint evil: false */

// -------------------------------------------------------------------------------------------
// Dummy method for legitimitizing javascript call from within Visual Studio.
// -------------------------------------------------------------------------------------------
// ReSharper disable once UnusedLocals
function wait() { }

// -------------------------------------------------------------------------------------------
// Returns the specified string with the 'window.setTimeout' function interwoven.
// -------------------------------------------------------------------------------------------
UTL.convertString = function(tok) {
	tok = tok.replace(/\/\/.*$/gm, "").replace(/(^\s+|\s+$)/gm, "").replace(/\r\n/gm, "");
	tok = 'UTL.cb(\'msg \"Script started.\"\');' + tok;
	tok += 'wait();UTL.cb(\'msg \"Script finished.\"\');';
	var reg = /wai[t]*\s*\(\s*[0-9]*\s*\)\s*;\s*/gi;
	var arr = tok.match(reg);
	for (var i = arr.length - 1; i >= 0; i--) {
		var msecs = arr[i].match("[0-9]+") || 1000;
		var idx = tok.lastIndexOf(arr[i]);
		tok = tok.substr(0, idx) + "window.setTimeout(function(){" + tok.substr(idx + arr[i].length) + "}, " + msecs + ");";
	}
	return tok;
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the specified value is a number.
// -------------------------------------------------------------------------------------------
UTL.isNumber = function(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};

// -------------------------------------------------------------------------------------------
// Gets the arguments part of the command string.
// -------------------------------------------------------------------------------------------
UTL.extractArgsFromCommand = function(command) {
	var idx = command.indexOf(" ");
	if (idx < 0)
		return [];
	command = command.replace(/ /g, "š");
	// Special handling for double-quoted strings.
	while (true) {
		var qt = command.match(/"([^"]+)"/);
		if (qt === null)
			break;
		command = command.replace(qt[0], qt[1].replace(/š/g, " "));
	}
	var args = command.substr(idx + 1).split("š");
	return args;
};

// -------------------------------------------------------------------------------------------
// Trims spaces, single-quotes and double-quotes from both sides of the specified text and
// returns it.
// -------------------------------------------------------------------------------------------
UTL.trim = function(str) { return (str) ? str.replace(/^[\s''""]+|[\s''""]+$/gm, "") : null; };

// -------------------------------------------------------------------------------------------
// Pauses script execution for the specified number of milliseconds.
// -------------------------------------------------------------------------------------------
UTL.sleep = function(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
};

// -------------------------------------------------------------------------------------------
// Convenience method for outputting multiple lines of text to the Developer Console.
// -------------------------------------------------------------------------------------------
// ReSharper disable once UnusedLocals
var log = function(s) {
	var arr;
	if (s.mimeType && s.mimeType === "XML File" ||
		s.contentType && s.contentType.endsWith("/xml")) {
		s = new XMLSerializer().serializeToString(s.documentElement);
		if (!CMN.isIE()) {
			console.log("\r\n" + s);
			return;
		}
		arr = s.split("\n");
	} else {
		arr = s.split("\r\n");
	}
	if (arr.length > 1) {
		console.group("");
		for (var v in arr) {
			if (arr.hasOwnProperty(v)) {
				console.log(arr[v]);
			}
		}
		console.groupEnd();
	} else {
		console.log(s);
	}
};

// -------------------------------------------------------------------------------------------
// Downloads the specified text to the specified file name in the default "downloads" folder.
// Note this is available on limited number of browsers.
// Example: UTL.download("hello.txt", "This is the content of my file :)");
// -------------------------------------------------------------------------------------------
UTL.download = function(filename, text) {
	var link = document.createElement('a');
	link.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	link.setAttribute("download", filename);
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

//function myConcat(separator) {
//	var args = Array.prototype.slice.call(arguments, 1);
//	return args.join(separator);
//};

// sourceURL=tucson.utils.js