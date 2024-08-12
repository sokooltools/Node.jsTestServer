// =======================================================================================================
// InternetSettings.js
// =======================================================================================================
var CMN = window.CMN;
var CFG = window.CFG;

var INT = {

	xml: null,

	json: null,

	key: "INT",

	msgs: {
		PROXY_MIN_LEN_PROXYHOST: 1,
		PROXY_REQUIRED_PROXYHOST: 2,
		PROXY_MIN_LEN_PROXYPORT: 3,
		PROXY_REQUIRED_PROXYPORT: 4
	},

	//$container,

	//$validator,

	init: function () {

		// -------------------------------------------------------------------------------------------
		// Add default validation for this particular form.
		// -------------------------------------------------------------------------------------------
		$container = $("#frmInternetSettings div.errcontainer");

		$validator = $("#frmInternetSettings").validate(
			{
				debug: true,
				errorContainer: INT.$container,
				errorLabelContainer: $("ol", INT.$container),
				errorClass: "invalid",
				validClass: "valid",
				wrapper: "li"
			});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when the 'Help' button is clicked.
		// -------------------------------------------------------------------------------------------
		$("#int_btnHelp").on("click", function () {
			window.open("help/internetsettings.htm");
			return false;
		});

		// -------------------------------------------------------------------------------------------
		// Processes cut, paste, and delete when selected from the right-click context menu.
		// -------------------------------------------------------------------------------------------
		$("#int_txtProxyHost").contextDelete({
			cut: function (e) {
				INT.enableSaveAndResetButtons(e);
			},
			paste: function (e) {
				INT.enableSaveAndResetButtons(e);
			},
			contextDelete: function (e) {
				INT.enableSaveAndResetButtons(e);
			}
		});

		// -------------------------------------------------------------------------------------------
		// Processes cut, paste, and delete when selected from the right-click context menu.
		// (contextDelete does not work if this selector is combined with above!)
		// -------------------------------------------------------------------------------------------
		$("#int_txtProxyPort").contextDelete({
			cut: function (e) {
				INT.enableSaveAndResetButtons(e);
			},
			paste: function (e) {
				INT.enableSaveAndResetButtons(e);
			},
			contextDelete: function (e) {
				INT.enableSaveAndResetButtons(e);
			}
		});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when the 'Access Internet using proxy server' checkbox is clicked.
		// -------------------------------------------------------------------------------------------
		$("#int_chkIsProxyEnabled").on("click", function (e) {
			INT.enableDisableProxyInputs();
			INT.enableSaveAndResetButtons(e);
			$("#int_txtProxyHost, #int_txtProxyPort").valid();
			return true;
		});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when the 'Bypass proxy server for local addresses' checkbox is clicked.
		// -------------------------------------------------------------------------------------------
		$("#int_chkIsBypassLocal").on("click", function (e) {
			INT.enableSaveAndResetButtons(e);
			return true;
		});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when a key is pressed in the 'Proxy Host' textbox.
		// -------------------------------------------------------------------------------------------
		$("#int_txtProxyHost").on("keypress keydown", function (e) {
			if (CMN.processKey(e, "alphanumeric"))
				INT.enableSaveAndResetButtons(e);
		});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when a key is pressed in the 'Proxy Port' textbox.
		// -------------------------------------------------------------------------------------------
		$("#int_txtProxyPort").on("keypress keydown", function (e) {
			if (CMN.processKey(e, "numeric"))
				INT.enableSaveAndResetButtons(e);
		});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when cutting/pasting text to/from the 'Proxy Host' textbox or the
		// 'Proxy Port' textbox (allowing only numbers to be pasted).
		// -------------------------------------------------------------------------------------------
		$("#int_txtProxyHost, #int_txtProxyPort").on("cut paste", function (e) {
			if (CMN.processCutPaste(e, e.target.id === "int_txtProxyHost" ? "alphanumeric" : "numeric"))
				INT.enableSaveeAndResetButtons(e);
		});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when the 'Save' button is clicked.
		// -------------------------------------------------------------------------------------------
		$("#int_btnSave").on("click", function () {
			if (!$("#frmInternetSettings").valid()) {
				CFG.showInvalid();
				return false;
			}
			CFG.performFunction(INT.savePage, CFG.getCaption(CMN.msgs.SAVING));
			return false;
		});

		// -------------------------------------------------------------------------------------------
		// Handles the event raised when the 'Reset' button is clicked.
		// -------------------------------------------------------------------------------------------
		$("#int_btnRefresh, #int_btnReset").on("click", function () {
			var msg = $("#int_btnSave").is(":disabled") ? CMN.msgs.REFRESHING : CMN.msgs.RESETTING;
			CFG.performFunction(INT.loadPage, CFG.getCaption(msg));
			return false;
		});

		this.loadPage();
	},

	// -------------------------------------------------------------------------------------------
	// Loads the 'Internet Settings' xml object via AJAX call.
	// -------------------------------------------------------------------------------------------
	loadPage: function () {
		$.ajax({
			type: "GET",
			url: "/services/network/internetsettings?lang=" + CFG.getLanguage(),
			dataType: "json",
			async: false,
			cache: false,
			success: function (data) {
				INT.loadPageSettings(data);
			},
			error: function (jqXHR) {
				CFG.handleError(jqXHR);
			}
		});
	},

	// -------------------------------------------------------------------------------------------
	// Loads localized settings into page using the specified xml object.
	// -------------------------------------------------------------------------------------------
	loadPageSettings: function (xml) {
		INT.xml = xml;
		CFG.setLabelsAndTitles(xml);
		INT.enableDisableProxyInputs();
		INT.disableSaveAndResetButtons();
		
	},

	// -------------------------------------------------------------------------------------------
	// Loads data into the page using the specified json object.
	// -------------------------------------------------------------------------------------------
	loadPageData: function (json) {
		INT.json = json;
		$("#int_chkIsProxyEnabled").prop("checked", json.isproxyenabled);
		$("#int_txtProxyHost").val(json.proxyhost);
		$("#int_txtProxyPort").val(json.proxyport);
		$("#int_chkIsBypassLocal").prop("checked", json.isbypasslocal);
	},

	// -------------------------------------------------------------------------------------------
	// Saves the 'Internet Settings' text/xml object via AJAX call.
	// -------------------------------------------------------------------------------------------
	savePage: function () {
		var json = INT.getJsonFromPage();
		$.ajax({
			type: "PUT",
			url: "/services/network/internetdata",
			contentType: "json",
			global: false,
			async: false,
			data: JSON.stringify(json),
			complete: function (jqXHR) {
				if (jqXHR.status === 200) {
					INT.loadPage();
				}
			},
			error: function (jqXHR) { // function(jqXHR, textStatus, thrownError)
				CFG.handleError(jqXHR);
			}
		});
	},

	// -------------------------------------------------------------------------------------------
	// Gets the 'Internet Settings' json data object by extracting the values from the page.
	// -------------------------------------------------------------------------------------------
	getJsonFromPage: function () {
		// Get a clone of the original json object, update its properties, then return it.
		var json = JSON.parse(JSON.stringify(INT.json));
		json.isproxyenabled = $("#int_chkIsProxyEnabled").is(":checked");
		json.proxyhost = $("#int_txtProxyHost").val();
		json.proxyport = $("#int_txtProxyPort").val();
		json.isbypasslocal = $("#int_chkIsBypassLocal").is(":checked");
		return json;
	},

	// -------------------------------------------------------------------------------------------
	// Returns a value indicating whether the specified proxy port is valid.
	// -------------------------------------------------------------------------------------------
	IsValidProxyPort: function (proxyPort) {
		return proxyPort === "" || proxyPort === 0 || (proxyPort > 9 && proxyPort <= 99999);
	},

	// -------------------------------------------------------------------------------------------
	// Add or replace validation rules of items on this page.
	// -------------------------------------------------------------------------------------------
	addValidatorRules: function () {
		var $sel = $("#int_txtProxyHost");
		$sel.rules("remove");
		$sel.rules("add", {
			required: {
				depends: function () { return INT.isProxyEnabledChecked(); }
			},
			minlength: {
				depends: function () { return INT.isProxyEnabledChecked(); },
				param: 4
			},
			messages: {
				required: CMN.lookup(INT.xml, INT.msgs.PROXY_REQUIRED_PROXYHOST),
				minlength: CMN.lookup(INT.xml, INT.msgs.PROXY_MIN_LEN_PROXYHOST)
			}
		});
		$sel = $("#int_txtProxyPort");
		$sel.rules("remove");
		$sel.rules("add", {
			required: {
				depends: function () { return INT.isProxyEnabledChecked(); }
			},
			minlength: {
				depends: function () { return INT.isProxyEnabledChecked(); },
				param: 2
			},
			messages: {
				required: CMN.lookup(INT.xml, INT.msgs.PROXY_REQUIRED_PROXYPORT),
				minlength: CMN.lookup(INT.xml, INT.msgs.PROXY_MIN_LEN_PROXYPORT)
			}
		});
	},

	// -------------------------------------------------------------------------------------------
	// Enable or disable controls based on Security Level.
	// -------------------------------------------------------------------------------------------
	makeSecure: function () {
		$("#int_chkIsProxyEnabled, #int_chkIsBypassLocal").prop("disabled", !CMN.isAdminLevel());
		INT.enableDisableProxyInputs();
	},

	// -------------------------------------------------------------------------------------------
	// Enables or disables the 'Proxy Host' and 'Proxy Port' input boxes depending on whether
	// the 'Is Proxy Server' checkbox contains a checkmark.
	// -------------------------------------------------------------------------------------------
	enableDisableProxyInputs: function () {
		$("#int_txtProxyHost, #int_txtProxyPort").prop("disabled", !INT.isProxyEnabledChecked());
	},

	// -------------------------------------------------------------------------------------------
	// Enables the 'Save' and 'Reset' buttons and changes the 'Reset' button text to 'Reset'.
	// -------------------------------------------------------------------------------------------
	enableSaveAndResetButtons: function (e) {
		$("#int_btnSave").prop("disabled", false);
		$("#int_btnRefresh").addClass("hidden");
		$("#int_btnReset").removeClass("hidden");
		CMN.validateMe(e);
	},

	// -------------------------------------------------------------------------------------------
	// Disables the 'Save' button and changes the 'Reset' button text to 'Refresh'.
	// -------------------------------------------------------------------------------------------
	disableSaveAndResetButtons: function () {
		$("#int_btnSave").prop("disabled", true);
		$("#int_btnReset").addClass("hidden");
		$("#int_btnRefresh").removeClass("hidden");
	},

	// -------------------------------------------------------------------------------------------
	// Returns a value indicating whether the 'Is Proxy Server' checkbox contains a checkmark.
	// -------------------------------------------------------------------------------------------
	isProxyEnabledChecked: function () {
		return ($("#int_chkIsProxyEnabled").is(":checked"));
	},
}

// -------------------------------------------------------------------------------------------
// Load the 'Internet Settings' into the page.
// -------------------------------------------------------------------------------------------
CFG.performFunction(function () {
	INT.init();
}, CFG.getCaption(CMN.msgs.LOADING));

//// -------------------------------------------------------------------------------------------
//// Global error event handler for all AJAX calls.
//// -------------------------------------------------------------------------------------------
//$(document).ajaxError(function(e, xhr, options, exception)
//{
//	if (options.url == "/services/network/internetsettings" && exception.arguments) {
//		CFG.showError(exception.arguments[0].responseText);
//	}
//});

//# sourceURL=internetsettings.js