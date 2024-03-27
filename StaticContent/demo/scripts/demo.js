// ====================================================================================================
// Demo.js
// ====================================================================================================

var DEMO = {};

DEMO.loadCommon = function () {
	if ($("#back")) {
		if (document.referrer === "") {
			$("#back").attr("title", "Click to go to the Demo Home page...");
			$("#back").html("« Go to Demo Home");
		} else {
			$("#back").attr("title", "Click to go back to the Demo Home page...");
			$("#back").html("« Go Back");
		}
		$("#back")
			.button()
			.on("click", function () {
				DEMO.goHome();
			});
	}
};

DEMO.getPathRoot = function () {
	if (window.location.pathname.startsWith("/StaticContent")) {
		return `${window.location.origin}/StaticContent`;
	}
	return window.location.origin;
};

// -------------------------------------------------------------------------------------------
// Sets the Protocol, the Port, and the specified IP Address.
// If the specified ip address is null or empty and a cookie containing the ip address exists
// then its value will be used.
// -------------------------------------------------------------------------------------------
DEMO.loadForm = function (ipAddress, port) {
	DEMO.loadCustomComboboxes();

	const isSsl = DEMO.getCookie(document, "isssl", "false");

	const isWeb = DEMO.getCookie(document, "isweb", "false");

	if (!ipAddress) ipAddress = DEMO.getCookie(document, "address", "LocalHost");

	if (!port) port = DEMO.getCookie(document, "port", "3000");

	$("#demo_rdoWeb").prop("checked", isWeb === "true");
	$("#demo_rdoDesktop").prop("checked", isWeb === "false");

	if (isWeb === "true") {
		setDisabled("demo_rdoWeb");
	} else {
		setDisabled("demo_rdoDesktop");
	}

	$("#demo_rdoHttp").prop("checked", isSsl === "false");
	$("#demo_rdoHttps").prop("checked", isSsl === "true");

	$("#demo_cboIpAddress").val(ipAddress);
	$("#demo_cboPort").val(port);

	DEMO.selectIpAddress();

	// Returns a NodeList representing a list of the document's
	// elements that match the specified group of selectors.
	const matches = document.querySelectorAll(".chngRadio");

	function setDisabled(rdoBtnValue) {
		if (rdoBtnValue === "demo_rdoWeb") {
			$("#demo_webGroup, #fsProtocol, #test1, #test2").removeClass("demo-disabled");
			$("#demo_rdoHttp, #demo_rdoHttps, #demo_cboIpAddress, #demo_cboPort").prop("disabled", false);
		} else if (rdoBtnValue === "demo_rdoDesktop") {
			$("#demo_webGroup, #fsProtocol, #test1, #test2").addClass("demo-disabled");
			$("#demo_rdoHttp, #demo_rdoHttps, #demo_cboIpAddress, #demo_cboPort").prop("disabled", true);
		}
	}

	// Iterate through the nodeList using .forEach() method.
	// Attach an eventListener with a callback function.
	matches.forEach((match) => {
		match.addEventListener("change", (e) => {
			setDisabled(e.target.value);
		});
	});
};

// -------------------------------------------------------------------------------------------
// Goes back to the Demo home page.
// -------------------------------------------------------------------------------------------
DEMO.goHome = function () {
	window.location.href = "../demo.htm";
};

// -------------------------------------------------------------------------------------------
// Loads the two custom comboboxes.
// -------------------------------------------------------------------------------------------
DEMO.loadCustomComboboxes = function () {
	$.widget("custom.combobox", {
		_create: function () {
			this.wrapper = $("<span>").addClass("custom-combobox").insertAfter(this.element);

			this.element.hide();
			this._createAutocomplete();
			this._createShowAllButton();
		},
		_createAutocomplete: function () {
			const selected = this.element.children(":selected");
			const value = selected.val() ? selected.text() : "";

			this.input = $("<input>")
				.appendTo(this.wrapper)
				.val(value)
				.attr("title", "")
				.attr("spellcheck", "false")
				.on("keydown", function () {
					if (DEMO.isEnterkey(event)) {
						DEMO.doClick();
					}
				})
				.addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
				.autocomplete({
					delay: 0,
					minLength: 0,
					source: $.proxy(this, "_source"),
				})
				.tooltip({
					classes: {
						"ui-tooltip": "ui-state-highlight",
					},
				});

			this._on(this.input, {
				autocompleteselect: function (event, ui) {
					ui.item.option.selected = true;
					this._trigger("select", event, {
						item: ui.item.option,
					});
				},
			});
		},
		_createShowAllButton: function () {
			var input = this.input,
				wasOpen = false;
			$("<a>")
				.attr("tabIndex", -1)
				.attr("title", "Show All Items")
				.tooltip()
				.appendTo(this.wrapper)
				.button({
					icons: {
						primary: "ui-icon-triangle-1-s",
					},
					text: false,
				})
				.removeClass("ui-corner-all")
				.addClass("custom-combobox-toggle ui-corner-right")
				.on("mousedown", function () {
					wasOpen = input.autocomplete("widget").is(":visible");
				})
				.on("click", function () {
					input.trigger("focus");

					// Close if already visible
					if (wasOpen) {
						return;
					}

					// Pass empty string as value to search for, displaying all results
					input.autocomplete("search", "");
				});
		},
		_source: function (request, response) {
			var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
			response(
				this.element.children("option").map(function () {
					const text = $(this).text();
					if (this.value && (!request.term || matcher.test(text))) {
						return {
							label: text,
							value: text,
							option: this,
						};
					}
					return {};
				})
			);
		},
		_destroy: function () {
			this.wrapper.remove();
			this.element.show();
		},
	});

	$("#combobox1").combobox();
	$("#test1 > span.custom-combobox > input.ui-autocomplete-input").attr("id", "demo_cboIpAddress");
	$("#demo_cboIpAddress").css("width", "120px").css("font-size", "12pt").css("font-weight", "bold");

	$("#combobox2").combobox();
	$("#test2 > span.custom-combobox > input.ui-autocomplete-input").attr("id", "demo_cboPort");
	$("#demo_cboPort").css("width", "50px").css("font-size", "12pt").css("font-weight", "bold");
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the specified event code is an enter key.
// -------------------------------------------------------------------------------------------
DEMO.isEnterkey = function (e) {
	return e.keyCode === 13 || e.charCode === 13;
};

const defaultRoot = "http://localhost:3000";

DEMO.getFullRoute = function (route) {
	return route.startsWith("http") ? route : defaultRoot + (route.startsWith("/") ? route : "/" + route);
};

/**
 * Does a GET to the server.
 *
 * @param {String} route The route.
 * @param {JSON} jsonData The JSON string.
 * @param {function} callback The function callback.
 */
DEMO.doGet = function (route, callback, msTimeout) {
	// Create a new AbortController instance.
	const controller = new AbortController();
	const signal = controller.signal;

	// Make the fetch request with the signal.
	const fetchPromise = fetch(DEMO.getFullRoute(route), {
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
			return response.json();
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

/**
 * Does a PUT to the server.
 *
 * @param {String} route The route (minus the URL root).
 * @param {JSON} jsonData The JSON string.
 * @param {function} callback The function callback.
 */
DEMO.doPut = function (route, jsonData, callback) {
	// Set up options for the fetch request.
	let jsonBody = JSON.stringify(jsonData);
	const options = {
		method: "PUT",
		headers: {
			// Set content type to JSON.
			"Content-Type": "application/json",
			"Content-Length": jsonBody.length
		},
		// Convert JSON data to a string and set it as the request body.
		body: jsonBody,
	};
	// Make the fetch request using the provided options.
	fetch(DEMO.getFullRoute(route), options)
		.then((response) => {
			// Check if the request was successful.
			if (!response.ok) {
				throw new Error(response.statusText);
			}
			// Parse the response as JSON.
			return response.json();
		})
		.then((data) => {
			// Handle the JSON data.
			if (callback) callback(data);
		})
		.catch((error) => {
			// Handle any errors that occurred during the fetch.
			console.error(error);
		});
};

// -------------------------------------------------------------------------------------------
// Handles the event raised when one of the hyperlinks is clicked.
// -------------------------------------------------------------------------------------------
DEMO.doClick = function () {
	if ($("#demo_rdoWeb").is(":checked")) {
		const urlRoot = DEMO.getUrlRoot();
		DEMO.showBusy(`Connecting to: '${urlRoot}'...<br/>Please wait.`);
		let page;
		if (arguments[0]) {
			page = arguments[0].substring(0, 3) === "../" ? arguments[0].substring(3) : "demo/pages/" + arguments[0];
		} else {
			page = "configtool.htm";
		}
		DEMO.goToPage(document, urlRoot, page);
	} else {
		// Get the extension to make sure it is html
		const ext = arguments[0].split("/").reverse()[0].split(".").reverse()[0];
		if (!(ext === "htm" || ext === "html")) {
			$.unblockUI({
				onUnblock: function () {
					DEMO.showDialog('Sorry... only raw "html" pages can be opened from the desktop!');
				},
			});
			return false;
		}
		DEMO.setCookie(document, "isweb", false, 14);
		const path = $(window.location).prop("href");
		//  path = "file:///D:/Parker/Tucson/trunk/ParkerWebCF/StaticContent/demo/Demo.htm"
		const url = path.replace(path.split("/").reverse()[0], "pages/" + arguments[0]);
		window.location.href = url;
	}
	return false;
};

// -------------------------------------------------------------------------------------------
// Returns the currently selected protocol (i.e., 'Http:' or 'Https:').
// -------------------------------------------------------------------------------------------
DEMO.getProtocol = function () {
	return $("#demo_rdoHttp").is(":checked") ? "http:" : "https:";
};

// -------------------------------------------------------------------------------------------
// Selects the last octet of the ip address.
// -------------------------------------------------------------------------------------------
DEMO.selectIpAddress = function () {
	const sel = $("#demo_cboIpAddress");
	const len = sel.val().length;
	const idx = sel.val().lastIndexOf(".");
	const start = idx > -1 ? idx + 1 : len;
	sel.setSelection(start, len);
};

// -------------------------------------------------------------------------------------------
// Sets the window location to the specified document unless 'Simulation Mode' has been
// checkmarked in which case it opens the document directly from the PC running the browser.
// -------------------------------------------------------------------------------------------
DEMO.openDoc = function (doc) {
	var path;
	if ($("#demo_rdoWeb").prop("checked")) {
		// Open the document located on the web.
		path = DEMO.getProtocol() + "//" + DEMO.getUrlRoot() + "/docs/" + doc;
	} else {
		// Open the document located on this computer.
		path = $(window.location).prop("href");
		const splitPath = path.split("/").reverse();
		const searchValue = splitPath[2] + "/" + splitPath[1] + "/" + splitPath[0];
		const replaceValue = `documentation/${doc}`;
		path = path.replace(searchValue, replaceValue);
	}
	window.location.href = path;
};

// -------------------------------------------------------------------------------------------
// Gets the web address with the port number appended to it (if it has been specified).
// -------------------------------------------------------------------------------------------
DEMO.getUrlRoot = function () {
	const addr = $("#demo_cboIpAddress").val();
	const port = $("#demo_cboPort").val();
	const urlRoot = addr + (port ? `:${port}` : "");
	return urlRoot;
};

// -------------------------------------------------------------------------------------------
// Sets the page to busy mode displaying the specified message in the center of the screen.
// -------------------------------------------------------------------------------------------
DEMO.showBusy = function (msg) {
	jQuery.blockUI.defaults.css = {};
	jQuery.blockUI({
		message: `<img src="themes/base/images/busy.gif"/> ${msg}`,
		//timeout: 15000,
		overlayCSS: {
			backgroundColor: "#A0A0A0",
		},
	});
};

// -------------------------------------------------------------------------------------------
// Checks whether this web page can be connected to the Padarn Server on the CE using the
// current IP Address and if so goes to the page.
// -------------------------------------------------------------------------------------------
DEMO.goToPage = function (doc, urlRoot, page, numAttempt) {
	const protocol = DEMO.getProtocol();
	if (!numAttempt) numAttempt = 1;
	DEMO.debugLog(`Attempting to connect to: '${urlRoot}'... (${numAttempt})`);
	//var img = new window.Image();  //document.createElement("img");
	//img.onload = function()
	//{
	const url = protocol + "//" + urlRoot + (page ? `/${page}` : "");
	window.location.href = url;

	var address = urlRoot;
	var port = "";
	const itms = urlRoot.split(":");
	if (itms.length > 1) {
		[address, port] = itms;
	}
	const isweb = $("#demo_rdoWeb").is(":checked");
	const isssl = $("#demo_rdoHttps").is(":checked");

	DEMO.setCookie(doc, "isssl", isssl, 14);
	DEMO.setCookie(doc, "address", address, 14);
	DEMO.setCookie(doc, "port", port, 14);
	DEMO.setCookie(doc, "isweb", isweb, 14);
	//};
	//img.onabort = function() {
	//	jQuery.unblockUI();
	//};
	//img.onerror = function() {
	//	if (numAttempt < 2)	// Try it twice. (The timeout period for each interval is ~21 seconds.)
	//		goToPage(doc, urlRoot, page, ++numAttempt);
	//	else {
	//		jQuery.unblockUI({ onUnblock: function() { myShowInDialog("Could not connect to '<b>" + urlRoot + "</b>'."); } });
	//	}
	//};
	//var gifPath = protocol +  "//" + urlRoot + "/themes/base/images/ping.png" + uniqueQueryString();
	//img.src = gifPath;
};

// -------------------------------------------------------------------------------------------
// Shows a modal dialog.
// -------------------------------------------------------------------------------------------
DEMO.showDialog = function (message, title) {
	$("<div>").dialog({
		modal: true,
		autoOpen: true,
		open: function () {
			$(this).html(message);
		},
		close: function () {
			$(this).dialog("close");
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
			},
		},
		width: 400,
		height: 200,
		title: title ? title : "jQuery Demos",
	});
};

// -------------------------------------------------------------------------------------------
// Gets a cookie value corresponding to the specified document and cookie name.
// -------------------------------------------------------------------------------------------
DEMO.getCookie = function (doc, name, deflt) {
	const nameEq = name + "=";
	const ca = doc.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEq) === 0) return encodeURI(c.substring(nameEq.length, c.length));
	}
	return deflt;
};

// -------------------------------------------------------------------------------------------
// Sets the specified cookie value corresponding to the specified cookie name.
// -------------------------------------------------------------------------------------------
DEMO.setCookie = function (doc, name, value, expdays) {
	const exdate = new Date();
	exdate.setDate(exdate.getDate() + expdays);
	const cvalue = `${name}=${encodeURI(value)}${expdays == null ? "" : `; expires=${exdate.toUTCString()}`}`;
	doc.cookie = cvalue;
};

// -------------------------------------------------------------------------------------------
// Returns the value corresponding to the specified query string name part of the current URL.
// -------------------------------------------------------------------------------------------
DEMO.getQueryStringByName = function (name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
	const results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

// -------------------------------------------------------------------------------------------
// Utility function for writing the specified message to the developer console window.
// -------------------------------------------------------------------------------------------
DEMO.debugLog = function (message) {
	if (!(typeof window.console === "undefined")) window.console.log(new Date().toLocaleTimeString() + " -- " + message);
};

// -------------------------------------------------------------------------------------------
// Extension method used for selecting the last two digits of the IP Address enabling quick
// editing of the IP Address.
// -------------------------------------------------------------------------------------------
jQuery.fn.setSelection = function (selectionStart, selectionEnd) {
	if (this.length === 0) return this;
	const input2 = this[0];
	if (input2.createTextRange) {
		const range = input2.createTextRange();
		range.collapse(true);
		range.moveEnd("character", selectionEnd);
		range.moveStart("character", selectionStart);
		range.select();
	} else if (input2.setSelectionRange) {
		input2.focus();
		input2.setSelectionRange(selectionStart, selectionEnd);
	}
	return this;
};
