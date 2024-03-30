// =======================================================================================================
// tucson.common.js
// =======================================================================================================

// Make sure required JavaScript modules are loaded.
if (typeof jQuery === "undefined") {
	throw "jQuery.js must be loaded before this module.";
}
if (typeof jQuery.blockUI === "undefined") {
	throw "jQuery.blockUI.js must be loaded before this module.";
}

var EMPTY = "";
var CMN = CMN || {};

CMN.BASE_IMAGE_PATH = "themes/base/images/";
CMN.TUCSON_IMAGE_PATH = "themes/tucson/images/";

/**
* Message objects used for lookups.
*/
CMN.msgs = {
	PLEASE_WAIT: 1,
	LOADING: 2,
	SAVING: 3,
	REFRESHING: 4,
	RESETTING: 5,
	DIALOG_OK: 6,
	DIALOG_CANCEL: 7,
	DIALOG_YES: 8,
	DIALOG_NO: 9,
	DIALOG_RETRY: 10,
	ERROR: 11,
	WARNING: 12,
	MESSAGE: 13,
	INVALID_DATA_ERROR: 14,
	INVALID_USERNAME_PASSWORD: 15,
	LOGIN_DISABLED: 16,
	CONFIG_ERROR: 17,
	UNKNOWN_ERROR: 18,
	DEVICE_NOT_RESPONDING: 19,
	FEATURE_UNDERCONSTRUCTION: 20,
	FEATURE_UNAVAILABLE: 21,
	NETWORK_CONN: 22,
	CURRENT_USER: 23,
	REBOOTING: 24
};

/**
* The icons used in dialogs.
*/
CMN.icons = {
	INFORMATION: "information.png",
	EXCLAMATION: "exclamation.png",
	QUESTION: "question.png",
	ASTERISK: "asterisk.png"
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an indication as to whether this application is running in 'Mock' data mode.
 * (Used primarily for testing purposes).
 * @returns {} 
 */
CMN.isMockMode = function() {
	return (!document.domain || document.domain === "localhost" || document.domain === "127.0.0.1");
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an indication as to whether the current browser is IE (Microsoft Internet Explorer).
 * @returns {} 
 */
CMN.isIE = function() {
	return window.detect.parse(navigator.userAgent).browser.family === "IE";
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Retrieves the name of the currently logged in user from a cookie.
 * @returns {} 
 */
CMN.getUsername = function() {
	return CMN.getCookie(document, "username");
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Retrieves the level of the currently logged in user from a cookie.
 * @returns {} 
 */
CMN.getUserLevel = function() {
	var ul = CMN.getCookie(document, "userlevel");
	return (ul) ? parseInt(ul, 10) : 1;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Retrieves an indication as to whether 'Remember me' was previously checkmarked from a cookie.
 * @returns {} 
 */
CMN.getRemember = function() {
	var ul = CMN.getCookie(document, "remember");
	return (ul) ? ul : false;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Retrieves the timeout value from a cookie.
 * @returns {} 
 */
CMN.getTimeout = function() {
	return CMN.getCookie(document, "timeout");
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Retrieves an indication as to whether a user is currently logged in or not.
 * @returns {} 
 */
CMN.isLoggedIn = function() {
	var ul = CMN.getCookie(document, "key");
	return !!ul;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an indication as to whether the current user is an Admin.
 * @returns {} 
 */
CMN.isAdminLevel = function() {
	return CMN.getUserLevel() === 0;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Validates the control corresponding to the 'id' property of the specified target.
 * @param {} e 
 * @returns {} 
 */
CMN.validateMe = function(e) {
	window.setTimeout(function() {
		return ((e.target) ? $("#" + e.target.id).valid() : true);
	}, 100);
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns only the 'Data' element extracted from the original xml document object.
 * @param {} xmlDoc 
 * @returns {} 
 */
CMN.getDataXml = function(xmlDoc) {
	var xml = xmlDoc;
	$(xml).children().children().not(function() { return this.tagName === "Data"; }).remove();
	return CMN.xmlToString(xml);
};

// -------------------------------------------------------------------------------------------
/**
* Returns a string value obtained from the static XML content corresponding to properties of 
* the specified 'Messages' tag in the xml file.
* @param {} xml the xml file
* @returns {} 
*/
CMN.lookup = function(xml, id) {
	var result = EMPTY;
	var nodes = $(xml).find("Messages");
	$(nodes).each(
		function() {
			var cn = $(this)[0].childNodes;
			$(cn).each(function() {
				if (parseInt($(this).attr("Id"), 10) === id) {
					result = window.unescape($(this).text());
					return;
				}
			});
			return;
		}
	);
	return result;
};


/* -------------------------------------------------------------------------------------------*/ /**
* Returns an indication as to whether the content of the two specified xml document objects are equal.
	* @param { } xmlDoc1 The 1st xml document object.
	* @param { } xmlDoc2 The 2nd xml document object.
	* @returns { }
*/
CMN.isXmlEqual = function(xmlDoc1, xmlDoc2) {
	var pat = /^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/;
	return CMN.xmlToString(xmlDoc1).replace(pat, "") === CMN.xmlToString(xmlDoc2).replace(pat, "");
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns a string containing the serialized output from the specified xml document object.
 * @param {} xmlDoc The xml document object.
 * @returns {} 
 */
CMN.xmlToString = function(xmlDoc) {
	var xmlString;
	// IE
	if (window.ActiveXObject) {
		xmlString = xmlDoc.xml;
	}
	// Mozilla, Firefox, Opera, etc.
	else {
		xmlString = (new XMLSerializer()).serializeToString(xmlDoc);
	}
	return xmlString;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an indication as to whether the specified selector control contains a checkmark.
 * @param {} sel The jQuery selector.
 * @returns {} 
 */
CMN.isChecked = function(sel) { return sel.is(":checked"); };

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns a JSON object retrieved from the specified URL.
 * @param {} url The URL.
 * @returns {} 
 */
CMN.getJson = function(url) {
	var retVal;
	$.ajax({
		type: "GET",
		url: url,
		dataType: "json",
		async: false,
		success: function(data) {
			retVal = data;
		},
		error: function(jqXHR) {
			throw new Error(jqXHR.responseJSON, jqXHR.status);
		}
	});
	return retVal;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an XML object retrieved from the specified URL.
 * @param {} url The URL.
 * @returns {} 
 */
CMN.getXml = function(url) {
	var retVal;
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		async: false,
		success: function(data) {
			retVal = data;
		},
		error: function(jqXHR) {
			throw new Error(jqXHR.responseText, jqXHR.status);
		}
	});
	return retVal;
};

//CMN.isEqual = function(o1, o2) {
//	var k1 = JSON.stringify(Object.keys(o1).sort());
//	var k2 = JSON.stringify(Object.keys(o2).sort());
//	if (k1.length !== k2.length) return false;
//	return k1 === k2;
//};

//CMN.compare = function(obj1, obj2) {
//	// check for obj2 overlapping props
//	if (!Object.keys(obj2).every(key => obj1.hasOwnProperty(key))) {
//		return false;
//	}
//	// check every key for being same
//	return Object.keys(obj1).every(function(key) {
//		// Check if object
//		if ((typeof obj1[key] == "object") && (typeof obj2[key] == "object")) {
//			// Recursively check
//			return CMN.compare(obj1[key], obj2[key]);
//		} else {
//			// Do the normal compare
//			return obj1[key] === obj2[key];
//		}
//	});
//};

CMN.copyProps = function(obj1, obj2) {
	for (var key in obj1) {
		if (obj1.hasOwnProperty(key)) {
			if ((key in obj2)) {
				obj2[key] = obj1[key];
			}
		}
	}
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an indication as to whether the two specified objects contain the same properties and values.
 * @returns {} 
 */
CMN.compare = function(o1, o2) {
	var k, kDiff;
	for (k in o1) {
		if (!o1.hasOwnProperty(k)) {
		} else if (typeof o1[k] != 'object' || typeof o2[k] != 'object') {
			if (!(k in o2) || o1[k] != o2[k]) {
				return false; // Property is missing or its value has changed.
			}
		} else {
			kDiff = CMN.compare(o1[k], o2[k]);
			if (!kDiff)
				return false; // Has object with a property having a different value.
		}
	}
	for (k in o2) {
		if (o2.hasOwnProperty(k) && !(k in o1)) {
			return false; // Object2 has a property not in object1.
		}
	}
	return true;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns a new object containing the differences between the two specified objects.
 * @returns {} 
 */
CMN.getDifferences = function(o1, o2) {
	var k, kDiff, diff = {};
	for (k in o1) {
		if (!o1.hasOwnProperty(k)) {
		} else if (typeof o1[k] != 'object' || typeof o2[k] != 'object') {
			if (!(k in o2) || o1[k] != o2[k]) {
				diff[k] = o2[k]; // Property is missing or its value has changed.
			}
		} else {
			kDiff = CMN.getDifferences(o1[k], o2[k]);
			if (!jQuery.isEmptyObject(kDiff))
				diff[k] = kDiff; // Has object with a property having a different value.
		}
	}
	for (k in o2) {
		if (o2.hasOwnProperty(k) && !(k in o1)) {
			diff[k] = o2[k]; // Object2 has a property not in object1.
		}
	}
	for (k in diff) {
		if (diff.hasOwnProperty(k)) {
			return diff;
		}
	}
	return diff;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the selected text in the current document or false when there is no selection.
 * @returns {} 
 */
CMN.getSelectedText = function() {
	if (window.getSelection) {
		return window.getSelection();
	} else if (document.getSelection) {
		return document.getSelection();
	} else {
		var selection = document.selection && document.selection.createRange();
		if (selection.text) {
			return selection.text;
		}
		return false;
	}
};

//String.prototype.toTitleCase = function() { return ...

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the specified text converted to its title case representation.
 * @param {} text 
 * @returns {} 
 */
CMN.toTitleCase = function(text) {
	return text.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the date and time formatted using "MM/DD/YYYY hh:mm:ss A". If no date is specified
 * the current date and time is used.                                                                                                
 * @returns {} 
 */
CMN.getFormattedDateTime = function(dt) {
	if (!dt)
		dt = new Date();
	//return (dt.getMonth() + 1) + '/' + dt.getDate() + '/' + dt.getFullYear() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();
	return moment(dt).format("MM/DD/YYYY hh:mm:ss A");
};

/* -------------------------------------------------------------------------------------------*/ /**
 *  Returns the position of the cursor within the current input element.
 * @returns {} 
 */
$.fn.getCursorPosition = function() {
	var input = this.get(0);
	if (!input) {
		return 0; // No (input) element found.
	}
	if ("selectionStart" in input) {
		// Standard-compliant browsers.
		return input.selectionStart;
	} else if (document.selection) {
		// IE
		input.focus();
		var sel = document.selection.createRange();
		var selLen = document.selection.createRange().text.length;
		sel.moveStart("character", -input.value.length);
		return sel.text.length - selLen;
	}
	return 0;
};

(function($) {
	/**
	* Handle "cut", "copy", "paste", "delete" right-click context menu items.
	* @param {} options 
	* @returns {} 
	*/
	$.fn.contextDelete = function(options) {
		var set = {
			'obj': $(this),
			'menu': false,
			'paste': false,
			'cut': false,
			'copy': false,
			'set': "",
			'ie': null
		};
		var opts = $.extend({
			'contextDelete': function() { },
			'paste': function() { },
			'cut': function() { },
			'copy': function() { },
			'allContext': false
		}, options);

		$(window).on({
			click: function() {
				set.menu = false;
			},
			keyup: function() {
				set.menu = false;
			}
		});
		set.obj.on({
			contextmenu: function() {
				set.menu = true;
				set.paste = false;
				set.cut = false;
				set.copy = false;
				set.val = set.obj.val();
				// Begin IE Hack
				if (CMN.isIE) {
					set.ie = window.setInterval(function() {
						set.obj.trigger($.Event("input"));
						if (!set.menu) {
							window.clearInterval(set.ie);
						}
					}, 300);
				} // End IE Hack
			},
			paste: function(e) {
				set.paste = true;
				if (opts.allContext) {
					if (set.menu) {
						opts.paste(e);
						set.menu = false;
					}
				} else {
					opts.paste(e);
				}
			},
			cut: function(e) {
				set.cut = true;
				if (opts.allContext) {
					if (set.menu) {
						opts.cut(e);
						set.menu = false;
					}
				} else {
					opts.cut(e);
				}
			},
			copy: function(e) {
				set.copy = true;
				if (opts.allContext) {
					if (set.menu) {
						opts.copy(e);
						set.menu = false;
					}
				} else {
					opts.copy(e);
				}
			},
			input: function(e) {
				if (set.menu && (!set.paste) && (!set.cut) && (!set.copy)) {
					if (set.obj.val().length < set.val.length) {
						opts.contextDelete(e);
						set.menu = false;
					}
				}
			}
		});
	};
})(jQuery);

/* ------------------------------------------------------------------------------------------- */ /**
 * Handles both "keydown" and "keypress" events allowing only certain characters to be entered.
 * If the character is legit, true is returned providing a mechanism for the calling of another
 * method on the page - for example, to enable its 'Save' and 'Reset' buttons.
 * @param {} e 
 * @param {} eventType The event type.
 * @param {} allowspace When set to true allows a space to be entered into the field.
 * @returns {} 
 */
CMN.processKey = function(e, eventType, allowspace) {
	var k = e.keyCode || e.charCode;
	if (e.type === "keydown") {
		// Allow: backspace
		if (k === 8) {
			// Ensure we are not at the beginning of the field.
			return ((CMN.getSelectedText()) || (e.target.value.length > 0 && $(e.target).getCursorPosition() > 0));
		}
		// Allow: delete
		else if (k === 46) {
			return ((CMN.getSelectedText()) || ($(e.target).getCursorPosition() < e.target.value.length));
		}
		// Allow: tab, escape, enter, and F12
		else if (k === 9 ||
			k === 27 ||
			k === 13 ||
			k === 123 ||
		// Allow: ctrl key // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Y, Ctrl+Z
			(e.ctrlKey) ||
		// && (k === 65 || k === 67 || k === 86 || k === 88 || k === 90)) ||
		// Allow: home, end, left, right
			(!e.shiftKey && (k >= 35 && k <= 39))) {
			// Let it happen, don't do anything.
			return false;
		}
	}
	if (eventType === "numeric") {
		// Ensure that it is a number [0-9]; otherwise stop the keydown or keypress.
		if (e.shiftKey || (k < 48 || k > 57) && (k < 96 || k > 105)) {
			e.preventDefault();
			return false;
		}
		return true;
	} else if (e.type === "keypress" && eventType === "alphanumeric") {
		// backspace or (space when allowspace is true)
		if (k === 8 || (k === 32 && (allowspace) && allowspace !== "false")) {
			return true;
		}
		// Firefox: tab, left arrow, right arrow, home, end.
		if (k === 9 || (!e.shiftKey && (k >= 36 && k <= 39)))
			return true;
		// Ensure that it is: a number [0-9], character [a-zA-Z], [-], or [.]; otherwise stop the keypress.
		if ((e.shiftKey && (k >= 48 && k <= 57)) ||
			(String.fromCharCode(k).replace(/^[a-zA-Z0-9\-\.]*$/g, "") !== "") && ((e.shiftKey || (k !== 189 && k !== 190)))) {
			if (k !== 13)
				e.preventDefault();
			return false;
		}
		return true;
	} else if (e.type === "keypress" && eventType === "filepath") {
		// The "\047" below represents a "'" (single quote) in hex.
		if (String.fromCharCode(k).replace(/^[a-zA-Z0-9\~\!\@\#\$\%\^\&\(\)\_\-\+\=\{\}\[\]\,\.\047 ]+$/g, "") === "") {
			return true;
		} else {
			e.preventDefault();
		}
	}
	return false;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Handles the 'cut' and 'paste' process ensuring only certain characters be pasted into
 * a particular field. If the character is legit, true is returned providing a mechanism for
 * calling another method on the page (for example, to enable its 'Save' and 'Reset' buttons).
 * @param {} e The event
 * @param {} eventType The event type
 * @param {} allowspace When set to true allows a space to be pasted into the field.
 * @returns {} 
 */
CMN.processCutPaste = function(e, eventType, allowspace) {
	if (e.type === "cut") {
		return true;
	} else if (e.type === "paste") {
		var data = window.clipboardData ?
			window.clipboardData.getData("Text") : // IE Only.
			e.originalEvent.clipboardData.getData("text/plain");
		var expr = null;
		if (eventType === "numeric") {
			expr = /[0-9]*/g;
		} else if (eventType === "alphanumeric") {
			expr = ((allowspace) && allowspace !== "false") ? /^[a-zA-Z0-9\-\. ]*$/g : /^[a-zA-Z0-9\-\.]*$/g;
		} else if (eventType === "filepath") {
			expr = /^[a-zA-Z0-9\~\!\@\#\$\%\^\&\(\)\_\-\+\=\{\}\[\]\,\.\047 ]+$/g;
		}
		if ((data && expr) ? (data.replace(expr, "") === "") : false) {
			return true;
		}
		e.preventDefault();
	}
	return false;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Gets the value from the specified cookie corresponding to the specified document.
 * @param {} doc The document.
 * @param {} cname The cookie name.
 * @returns {} 
 */
CMN.getCookie = function(doc, cname) {
	var nameEq = cname + "=";
	var ca = doc.cookie.split(";");
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) === " ")
			c = c.substring(1, c.length);
		if (c.indexOf(nameEq) === 0)
			return window.unescape(c.substring(nameEq.length, c.length));
	}
	return null;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Sets the specified value (and expiration date) into the cookie.
 * If the specified expiration date is null the cookie expires when the browser is closed.
 * @param {} doc the document
 * @param {} cname the cookie name
 * @param {} value  the cookie value
 * @param {} exdays the number of days until expiration
 * @returns {} 
 */
CMN.setCookie = function(doc, cname, value, exdays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var cvalue = window.escape(value) + ((exdays === null) ? "" : "; Expires=" + exdate.toUTCString()); // Path=/;
	doc.cookie = cname + "=" + cvalue;
};

/* -------------------------------------------------------------------------------------------*/ /**
  * Shows the specified 'Busy' message on the screen and blocks the UI.
  * @param {} any message to display in the busy dialog 
  * @returns {} 
  */
CMN.showBusy = function(message) {
	jQuery.blockUI.defaults.css = {};
	jQuery.blockUI.defaults.fadeOut = 800;
	jQuery.blockUI({
		message: "<img src='" + CMN.BASE_IMAGE_PATH + "busy.gif'/>&nbsp;&nbsp;" + message,
		//timeout: 62000,
		theme: false,
		ignoreIfBlocked: false,
		css: {
			width: "500px",
			top: "137px",
			left: ($(window).width() - 532) / 2 + "px",
			padding: "10px",
			margin: "10px",
			fontSize: "12pt",
			textAlign: "center",
			color: "#000000",
			border: "3px solid #aaa",
			backgroundColor: "#ffffff",
			cursor: "wait"
		},
		overlayCSS: { backgroundColor: "#A0A0A0" }
	});
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Hides the current 'Busy' message.
 * @returns {} 
 */
CMN.hideBusy = function() { jQuery.unblockUI(); };

/* -------------------------------------------------------------------------------------------*/ /**
 * Shows a modal dialog containing the specified text. (The title, height, and width are optional).
 * @param {} message Text to display in the dialog.
 * @param {} title Title displayed at the top of the dialog.
 * @param {} width Width of the dialog.
 * @param {} height Height of the dialog.
 * @returns {} 
 */
CMN.showDialog = function(message, title, width, height) {
	jQuery.unblockUI();
	window.setTimeout(function() {
		jQuery("<div>").dialog({
			modal: true,
			dialogClass: "dialog_style1",
			autoOpen: true,
			resizable: true,
			buttons: {
				'OK': function() {
					$(this).dialog("close");
				}
			},
			title: (title) ? title : document.title,
			width: (width) ? width : 450,
			height: (height) ? height : 200,
			open: function() {
				$(this).html(message);
			},
			close: function() {
				$(this).dialog("close");
			}
		});
	}, 400);
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Shows a confirmation dialog (title, height, and width are optional)
 * @param {} message 
 * @param {} title 
 * @param {} icn 
 * @param {} btn1 
 * @param {} btn2 
 * @param {} width 
 * @param {} height 
 * @returns {} 
 */
CMN.showConfirm = function(message, title, icn, btn1, btn2, width, height) {
	var defer = $.Deferred();
	var btnClicked = false;
	var htm = (icn) ? '<span class="dialog_image"><img src="' + CMN.TUCSON_IMAGE_PATH + icn + '"></span>' + message : message;
	$("<div></div>").html(htm).dialog({
		modal: true,
		dialogClass: "dialog_style1",
		autoOpen: true,
		buttons: [
			{
				text: btn1,
				click: function() {
					btnClicked = true;
					defer.resolve(btn1); // What gets returned.
					$(this).dialog("close");
				}
			},
			{
				text: btn2,
				click: function() {
					btnClicked = true;
					defer.resolve(btn2);
					$(this).dialog("close");
				}
			}
		],
		title: (title) ? title : document.title,
		width: (width) ? width : 450,
		height: (height) ? height : 200,
		close: function() {
			if (!btnClicked)
				defer.resolve(""); // cancelled
			$(this).remove();
		}
	});
	return defer.promise();
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Opens a new window using the specified url location. If the window is already open it just 
 * activates it and refreshes its content.
 * @param {} winUrl 
 * @param {} winName 
 * @param {} winFeatures 
 * @param {} winObj 
 * @returns {} 
 */
CMN.openWindow = function(winUrl, winName, winFeatures, winObj) {
	// First check to see if the window already exists.
	if (winObj) {
		// The window has already been created, but did the user close it?
		// If so, then reopen it. Otherwise make it the active window.
		if (!winObj.closed) {
			winObj.focus();
			winObj.location.reload();
			return winObj;
		}
	}
	// Hold onto our opened window.
	// If it got here, then the window hasn't been created yet, or it was closed by the user.
	var theWin = window.open(winUrl, winName, winFeatures);
	return theWin;
};


/* -------------------------------------------------------------------------------------------*/ /**
 * Dynamically loads the specified style sheet into the document header as long as it doesn't
 * already exist in the page.
 * @param href the stylesheet
 * @returns {} 
 */
CMN.loadStyle = function(href) {
	var load = true;
	jQuery("link[type='text/css']")
		.each(function() {
			load = (href !== $(this).attr("href"));
			return;
		});
	if (load) {
		var style = document.createElement("link");
		style.rel = "stylesheet";
		style.type = "text/css";
		style.media = "screen";
		style.href = href;
		document.getElementsByTagName("head")[0].appendChild(style);
	}
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Dynamically loads a script as long as it doesn't already exist in the page. The ability  
 * for it to be 'cached' is provided as well as the ability for it to execute a 'function'
 * callback on success.
 * The last two arguments are interchangeable.
 * Example usage:
 * CMN.loadScript('scripts/myscript.js', true, function(){window.alert('success!');});
 *
 * @param {} url The URL.
 * @param {} arg1 
 * @param {} arg2 
 * @returns {} 
 */
CMN.loadScript = function(url, arg1, arg2) {
	var isCached;
	var callback;
	// arg1 and arg2 can be interchangable.
	if ($.isFunction(arg1)) {
		callback = arg1;
		isCached = arg2;
	} else {
		isCached = arg1;
		callback = arg2;
	}
	var load = true;
	// Check all existing script tags in the page for the url.
	jQuery("script[type='text/javascript']")
		.each(function() {
			load = (url !== $(this).attr("src"));
			return load;
		});
	if (load) {
		// Didn't find it in the page, so load it.
		jQuery.ajax({
			type: "GET",
			url: url,
			async: false,
			dataType: "script",
			cache: isCached, // TODO: RAS 03/16/2017
			success: callback
		});
	} else {
		// Already loaded so just call the callback.
		if (jQuery.isFunction(callback)) {
			if (callback) {
				callback.call(this);
			}
		}
	}
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Pauses script execution for the specified number of milliseconds.
 * @param {} ms 
 * @returns {} 
 */
CMN.pause = function(ms) {
	ms += new Date().getTime();
	while (new Date() < ms) {
	}
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the value corresponding to the specified query string name part of the current URL.
 * @param {} name 
 * @returns {} 
 */
CMN.getQueryStringByName = function(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns a date converted from the specified number of milliseconds since midnight 01-01-1970.
 * @param {} milliseconds 
 * @returns {} 
 */
CMN.millisecondsToDate = function(milliseconds) {
	return new Date(parseFloat(milliseconds));
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the local date converted from the specified number of milliseconds UTC since midnight
 * 01-01-1970.
 * @param {} milliseconds 
 * @returns {} 
 */
CMN.millisecondsUtcToDate = function(milliseconds) {
	var millisecOffset = (new Date()).getTimezoneOffset() * 60000;
	return new Date(parseFloat(milliseconds) + millisecOffset);
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the number of milliseconds between the specified date and midnight 01-01-1970.
 * The current date and time is used when no date is specified.
 * @param {} dt 
 * @returns {} 
 */
CMN.dateToMilliseconds = function(dt) {
	return Date.parse(!dt ? (new Date()) : dt);
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the number of milliseconds UTC between the specified date and midnight 01-01-1970.
 * The current date and time is used when no date is specified.
 * @param {} dt 
 * @returns {} 
 */
CMN.dateToMillisecondsUtc = function(dt) {
	if (!dt) dt = new Date();
	return Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds());
};


/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the specified number as a comma-separated string.
 * @param {} x 
 * @returns {} 
 */
CMN.numberWithCommas = function(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); };

/* -------------------------------------------------------------------------------------------*/ /**
 * Fixes response text to make it compatible with modal dialog.
 * @param {} responseText 
 * @returns {} 
 */
CMN.fixResponseText = function(responseText) {
	var s = responseText.replace("<html", "<div");
	s = s.replace("<html>", "</div>");
	s = s.replace("<head>", "");
	s = s.replace("<body>", "");
	s = s.replace("<center>", "");
	s = s.replace("</head>", "");
	s = s.replace("</body>", "");
	s = s.replace("</center>", "");
	s = s.replace("540px;", "100%;");
	s = s.replace("600px;", "100%;");
	s = s.replace(/auto/g, "0");
	s = s.replace(/20px/g, "0");
	s = s.replace(/50px/g, "0");
	s = s.replace(/40px/g, "10px");
	s = s.replace("float: left;", "");
	s = s.replace("background-color: #f0f0f0;", "");
	s = s.replace("<div style='clear: both;'/>", "");
	s = s.replace("9pt;'>\r", "8pt;'>\r");
	s = s.replace("11pt;", "11pt; margin-right: 45px;");
	s = s.replace("padding-right: 10px", "padding-right: 30px");
	s = s.replace("<br/><br/>", "<br/>");
	return s;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an indication as to whether the specifed filename exists.
 * @param {} filename 
 * @returns {} 
 */
CMN.fileExists = function(filename) {
	var response = jQuery.ajax(
		{
			type: "HEAD",
			url: filename,
			async: false
		}).status;
	return (response === 200) ? true : false;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns the specified text after being trimmed of space characters from its left and right.
 * @param {} text 
 * @returns {} 
 */
CMN.trim = function(text) { return text.replace(/^\s+|\s+$/g, ""); };

/* -------------------------------------------------------------------------------------------*/ /**
 * Extends the string class with formatting.
 * Note: the first argument must be the string containing the format items (e.g. '{0}').
 * @returns {} 
 */
String.format = function() {
	var theString = arguments[0];

	// Start with the second argument (i = 1)
	for (var i = 1; i < arguments.length; i++) {
		// 'gm' = RegEx options for Global search (more than one instance) and for Multiline search.
		var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
		theString = theString.replace(regEx, arguments[i]);
	}
	return theString;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns a unique Query String for appending to the end of a Url.
 * @returns {} 
 */
CMN.uniqueQueryString = function() { return "?_=" + new Date().getTime(); };

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns a random eight digit number.
 * @returns {} 
 */
CMN.getRandom = function() { return Math.floor(Math.random() * 101010101); };

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns indication as to whether the specified input box is actually empty.
 * @param {} sel The selector
 * @returns {} 
 */
CMN.isReallyEmpty = function(sel) {
	return (sel.val()) && sel.val().replace(/^\s+|\s+$/gm, EMPTY) === EMPTY;
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Check whether there is an error value specified in the cookie.
 * @returns {} 
 */
CMN.checkForError = function() {
	var error = CMN.getCookie(document, "error");
	if (error) {
		CMN.setCookie(document, "error", null, -1);
		CMN.showDialog(error, "PAC Configuration Tool Error");
	}
};

/* -------------------------------------------------------------------------------------------*/ /**
 * Writes information to the developer console window.
 * @param {} message 
 * @returns {} 
 */
CMN.debugLog = function(message) {
	if (typeof window.console !== "undefined") {
		if (CMN.isIE()) // Internet Explorer doesn't output time.
			window.console.log(moment().format("hh:mm:ss") + " -- " + message);
		else
			window.console.log(message);
	}
};

///* -------------------------------------------------------------------------------------------*/ /**
// * Returns json string converted to an object.
// * @param {} val 
// * @returns {} 
// */
//CMN.jsonToObject = function(val) { return CMN.getEval(val); };

///* -------------------------------------------------------------------------------------------*/ /**
// * Performs evaluation and returns the result.
// * @param {} val 
// * @returns {} 
// */
//CMN.getEval = function(val) {
//	/*jslint evil: true */
//	var e = eval(val);
//	/*jslint evil: false */
//	return e;
//};

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns a clone of the specified XML document.
 * @param {} oldDoc The XML document to be cloned.
 * @returns {} 
 */
CMN.cloneXmlDoc = function(oldDoc) {
	var newDoc = oldDoc.implementation.createDocument(
		oldDoc.namespaceURI, // namespace to use
		null, // name of the root element (or for empty document)
		null // doctype (null for XML)
	);
	var newNode = newDoc.importNode(
		oldDoc.documentElement, // node to import
		true // clone its descendants
	);
	newDoc.appendChild(newNode);
	return newDoc;
};

CMN.defaultRoot = "http://localhost:3000";

CMN.getFullRoute = function (route) {
	return route.startsWith("http") ? route : CMN.defaultRoot + (route.startsWith("/") ? route : "/" + route);
};

CMN.doGet = function (route, callback, msTimeout) {
	// Create a new AbortController instance.
	const controller = new AbortController();
	const signal = controller.signal;

	// Make the fetch request with the signal.
	const fetchPromise = fetch(CMN.getFullRoute(route), {
		signal,
	});

	// Timeout after specified number of milliseconds.
	const timeoutId = setTimeout(() => {
		controller.abort();
		// Abort the fetch request.
		if (callback) callback("Fetch request timed out.");
	}, msTimeout || 5000);

	// Handle the fetch request
	fetchPromise
		.then((response) => {
			// Check if the request was successful.
			if (!response.ok) {
				throw new Error(response.statusText);
			}
			// Parse the response as JSON
			//return response.json();
			//return response.body;
		})
		.then((data) => {
			// Handle the JSON data.
			if (callback) callback(data);
		})
		.catch((error) => {
			// Handle any errors that occurred during the fetch.
			console.error(error);
		})
		.finally(() => {
			// Clear the timeout.
			clearTimeout(timeoutId);
		});
};

///* -------------------------------------------------------------------------------------------*/ /**
// *  Another example of returning json data from the specified URL.
// * @param {} url 
// * @returns {} 
// */
//CMN.getJson2 = function(url) {
//	var retVal;
//	var jqxhr = $.getJSON(url, function(data) {
//		retVal = data;
//	})
//	.done(function() {
//		console.log("done");
//	})
//	.fail(function() {
//		console.log("Error occured loading grid from JSON.");
//	})
//	.always(function() {
//		console.log("always");
//	});
//	// Set another completion function for the request above.
//	jqxhr.complete(function(data) {
//		console.log("complete");
//		retVal = data;
//	});
//	return retVal;
//};

