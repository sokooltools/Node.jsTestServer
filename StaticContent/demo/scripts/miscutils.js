// ---------------------------------------------------------------------
// miscutils.js
// ---------------------------------------------------------------------

var MISC = {};

MISC.formatFileSize = function (bytes, decimalPoint) {
	if (bytes === 0)
		return "0 Bytes";
	if (!decimalPoint)
		decimalPoint = 0;
	const k = 1000;
	const dm = decimalPoint;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{([0-9]+)}/g, (match, index) => typeof args[index] == "undefined" ? match : args[index]);
	}
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Shows a dialog containing the specified message matching object.
 * @param {string} msg The message to display in the dialog.
 * @param {string} elem The optional element to use for locating the dialog beside; otherwise dialog is centered in window.
 * @param {number} timeout The optional amount of time (in milliseconds) to wait before the dialog is auto-closed; otherwise indefinite.
 * @param {any} focusElement The optional element which should gain the focus after the dialog has closed; otherwise the last focused element. 
 */
MISC.showDialog = function (msg, elem, timeout, focusElement) {
	let timeoutID;
	const td = $("#testdlg");
	// Select the dialog div and show it as a jQuery dialog.
	td.dialog({
		autoOpen: false,
		resizable: false,
		modal: true,
		width: 400,
		open: function () {
			jQuery(this).html(msg);
		},
		buttons: {
			"OK": function () {
				$(this).dialog("close");
			}
		},
		hide: {
			effect: "fade",
			duration: 500
		},
		close: function () {
			clearTimeout(timeoutID);
			if(focusElement){
				focusElement.focus({ preventScroll: false })
			}
		},
		// position: {
		// 	my: "center",
		// 	at: "center"
		// },
		// // Add these 2 options below to use click outside feature.
		// clickOutside: true,
		// // Clicking outside the dialog will close it.
		// clickOutsideTrigger: ".copyContent"// Element (id or class) that triggers the dialog opening 
	});
	td.dialog("option", "title", window.document.title);
	td.dialog("option", "height", "auto");
	if (elem) {
		elem.focus();
		td.dialog("option", "position", { my: "left+40", at: "top", of: elem });
	} else {
		td.dialog("option", "position", { my: "center", at: "center", of: window });
	}
	td.dialog("open");
	if (timeout) {
		timeoutID = setTimeout(function () {
			td.dialog("close");
		}, timeout);
	}
}
