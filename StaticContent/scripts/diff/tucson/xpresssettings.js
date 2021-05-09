// =======================================================================================================
// XpressSettings.js
// =======================================================================================================
var CMN = window.CMN;
var CFG = window.CFG;

$("head").append('<link rel="stylesheet" type="text/css" href="themes/tucson/xpresssettings.css">');

var XPS = {};
XPS.xml = null;
XPS.json = null;
XPS.win = null;

XPS.msgs = {
	PROJECTNAME_REQD: 1,
	PROJECTNAME_MIN_LEN: 2,
	VERSION1_REQD: 3,
	VERSION2_REQD: 4,
	INVALID_FILETYPE: 5,
	SENDING_PROJECTFILE: 6,
	RESTARTING_XPRESS: 7,
	DELETING_PROJECTFILE: 8,
	STILL_LOADING1: 9,
	STILL_LOADING2: 10
};

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Help' button is clicked.
// -------------------------------------------------------------------------------------------
$("#xps_btnHelp").on("click", function() {
	window.open("help/XpressSettings.htm");
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Launch Xpress Shell' button is clicked.
// -------------------------------------------------------------------------------------------
$("#xps_btnLaunchShell").on("click", function() {
	if (XPS.isProjectLoaded()) {
		var url = (CMN.isMockMode() ? window.location.origin + "/services/xpressshell" : "http://" + window.location.hostname);
		var winName = "xpressshell";
		var features = "height=577, width=849, resizable=yes, location=no, toolbar=no, menubar=no, scrollbars=no, directories=no, status=no";
		//XPS.win = window.open(url, winName).focus(); // Use this for opening in a browser tab.
		XPS.win = CMN.openWindow(url, winName, features, XPS.win);
	}
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Auto Generate PLC Tags' checkbox is clicked.
// -------------------------------------------------------------------------------------------
$("#xps_chkAutoGenPlcTags").on("click", function(e) {
	XPS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Delete' project button is clicked.
// -------------------------------------------------------------------------------------------
$("#xps_btnProjDel").on("click", function() {
	$("#xps_txtProjName, #xps_txtProjVers1, #xps_txtProjVers2").addClass("xps_to_delete").prop("disabled", true);
	$("#xps_btnProjDel, #xps_btnProjSend, #xps_btnProjGet, #xps_txtProjFile").prop("disabled", true);
	XPS.enableSaveAndResetButtons(this);
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Get...' project button is clicked.
// -------------------------------------------------------------------------------------------
$("#xps_btnProjGet").on("click", function() {
	if (CMN.isMockMode()) {
		CFG.showInfo(XPS.xml);
	} else {
		var prj = $("#xps_txtProjName").val().replace(/#/g, "x").replace(/&/g, "x");
		window.location.href = "download.aspx?=" + prj + ".lrp";
	}
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'File to Send' input box value changes. (Used for
// enabling the Send button).
// -------------------------------------------------------------------------------------------
$("#xps_txtProjFile").on("change", function() {
	window.setTimeout(function() {
		$("#xps_btnProjSend").prop("disabled", ($("#xps_txtProjFile").val() === EMPTY));
	}, 10);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the form is submitted by clicking the 'Send' button.
// (NOTE: 'Upload.aspx' file is called upon to actually perform the upload since AJAX methods
//  to upload files do not work with versions prior to IE 10!)
// -------------------------------------------------------------------------------------------
$("#frmXpressSettings").submit(function(e) {
	var projFile = $("#xps_txtProjFile").val();
	if (projFile.length > 0) {
		var ext = projFile.substring(projFile.lastIndexOf("."), projFile.length);
		if (ext.toLowerCase() === ".lrp") {
			if (CMN.isMockMode()) {
				CFG.showInfo(XPS.xml);
				XPS.loadPage();
			} else {
				e.target.submit();
				CMN.showBusy(CMN.lookup(XPS.xml, XPS.msgs.SENDING_PROJECTFILE));
			}
		} else {
			CFG.showInfo(XPS.xml, XPS.msgs.INVALID_FILETYPE, projFile.split('\\').pop());
		}
	}
	return false;
});

// -------------------------------------------------------------------------------------------
// Binds the mouseup event to input elements so as to enable save and reset buttons.
// Mousedown and mouseup events are fired on input elements when the 'clear' button is clicked.
// -------------------------------------------------------------------------------------------
$("input").bind("mouseup", function(e) {
	var $input = $(this),
		oldValue = $input.val();
	if (oldValue === "")
		return;
	// When this event is fired after the 'clear' button is clicked the value is not cleared yet.
	// We have to wait for it.
	window.setTimeout(function() {
		var newValue = $input.val();
		if (newValue === "") {
			// Gotcha
			$input.trigger("cleared");
			XPS.enableSaveAndResetButtons(e);
		}
	}, 1);
});

// -------------------------------------------------------------------------------------------
// Processes cut, paste, and delete when selected from the right-click context menu.
// -------------------------------------------------------------------------------------------
$("#xps_txtProjName").contextDelete({
	cut: function(e) {
		XPS.enableSaveAndResetButtons(e);
	},
	paste: function(e) {
		XPS.enableSaveAndResetButtons(e);
	},
	contextDelete: function(e) {
		XPS.enableSaveAndResetButtons(e);
	}
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in the 'Project Name' textbox.
// -------------------------------------------------------------------------------------------
$("#xps_txtProjName").bind("keypress keydown", function(e) {
	if (CMN.processKey(e, "filepath", true))
		XPS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when cutting/pasting text to/from the 'Project Name' textbox 
// (allowing only certain alphanumerics to be pasted).
// -------------------------------------------------------------------------------------------
$("#xps_txtProjName").bind("cut paste", function(e) {
	if (CMN.processCutPaste(e, "filepath", true))
		XPS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in a 'Project Version' textbox.
// -------------------------------------------------------------------------------------------
$("#xps_txtProjVers1, #xps_txtProjVers2").bind("keypress keydown", function(e) {
	if (CMN.processKey(e, "numeric"))
		XPS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when cutting/pasting text to/from a 'Project Version' textbox 
// (allowing only numbers to be pasted).
// -------------------------------------------------------------------------------------------
$("#xps_txtProjVers1, #xps_txtProjVers2").bind("cut paste", function(e) {
	if (CMN.processCutPaste(e, "numeric"))
		XPS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Save' button is clicked.
// -------------------------------------------------------------------------------------------
$("#xps_btnSave").on("click", function() {
	if (!$("#xps_btnProjDel").is(":disabled") && !$("#frmXpressSettings").valid()) {
		CFG.showInvalid();
		return false;
	}
	var json = XPS.getJsonFromPage();
	if (json.project.name === EMPTY) {
		XPS.deleteProject();
	} else {
		CFG.performFunction(XPS.savePage, CFG.getCaption(CMN.msgs.SAVING));
	}
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Refresh' or 'Reset' button is clicked.
// -------------------------------------------------------------------------------------------
$("#xps_btnRefresh, #xps_btnReset").on("click", function() {
	var msg = $("#xps_btnSave").is(":disabled") ? CMN.msgs.REFRESHING : CMN.msgs.RESETTING;
	CFG.performFunction(XPS.loadPage, CFG.getCaption(msg));
	return false;
});

// -------------------------------------------------------------------------------------------
// Loads the 'Xpress HMI Settings' via AJAX call.
// -------------------------------------------------------------------------------------------
XPS.loadPage = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/xpresssettings?lang=" + CFG.getLanguage(),
		dataType: "xml",
		async: false,
		cache: false,
		success: function(data) {
			XPS.loadPageFromXml(data);
			XPS.loadData();
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads the 'Xpress HMI Settings' page using the specified xml object.
// -------------------------------------------------------------------------------------------
XPS.loadPageFromXml = function(xml) {
	XPS.xml = xml;
	CFG.setLabelsAndTitles(xml);
	XPS.clearFileInputs($("#frmXpressSettings"));
	XPS.disableSaveAndResetButtons();
	XPS.addValidatorRules();
	XPS.resetValidation();
};

// -------------------------------------------------------------------------------------------
// Loads the 'Xpress HMI Settings' data via AJAX call.
// -------------------------------------------------------------------------------------------
XPS.loadData = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/xpressdata",
		dataType: "json",
		async: false,
		cache: false,
		success: function(json) {
			XPS.loadDataFromJson(json);
			XPS.makeSecure(json);
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads the 'Xpress HMI Settings' data into the page using the specified json object.
// -------------------------------------------------------------------------------------------
XPS.loadDataFromJson = function(json) {
	$(".xps_to_delete").removeClass("xps_to_delete").prop("disabled", false);
	$("#xps_chkAutoGenPlcTags").prop("checked", json.autogenerateplctags);
	$("#xps_txtProjName").val(json.project.name);
	$("#xps_txtProjVers1").val(json.project.projectversion1);
	$("#xps_txtProjVers2").val(json.project.projectversion2);
	XPS.json = json;
};

// -------------------------------------------------------------------------------------------
// Saves the 'Xpress HMI Settings' to the PAC via AJAX call.
// -------------------------------------------------------------------------------------------
XPS.savePage = function() {
	var json = XPS.getJsonFromPage();
	$.ajax({
		type: "PUT",
		url: "/services/network/xpressdata",
		dataType: "json",
		headers: {
			'x-auth-token': window.localStorage.accessToken,
			"Content-Type": "application/json"
		},
		global: false,
		async: false,
		data: JSON.stringify(json),
		complete: function(jqXHR) {
			if (jqXHR.status === 200) {
				XPS.loadPage();
			}
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Gets an updated json object by extracting the values from the page.
// -------------------------------------------------------------------------------------------
XPS.getJsonFromPage = function() {
	var json = XPS.json;
	if ($("#xps_btnProjDel").is(":disabled")) {
		json.project.name = "";
		json.project.projectversion1 = 0;
		json.project.projectversion2 = 0;
	} else {
		json.project.name = $("#xps_txtProjName").val();
		json.project.projectversion1 = parseInt($("#xps_txtProjVers1").val(), 10);
		json.project.projectversion2 = parseInt($("#xps_txtProjVers2").val(), 10);
	}
	json.autogenerateplctags = CMN.isChecked($("#xps_chkAutoGenPlcTags"));
	return json;
};

// -------------------------------------------------------------------------------------------
// Enables the 'Save' and 'Reset' buttons and changes the 'Reset' button text to 'Reset'.
// -------------------------------------------------------------------------------------------
XPS.enableSaveAndResetButtons = function(e) {
	$("#xps_btnSave").prop("disabled", false);
	$("#xps_btnRefresh").addClass("hidden");
	$("#xps_btnReset").removeClass("hidden");
	if (!e.id)
		CMN.validateMe(e);
};

// -------------------------------------------------------------------------------------------
// Disables the 'Save' button and changes the 'Reset' button text to 'Refresh'.
// -------------------------------------------------------------------------------------------
XPS.disableSaveAndResetButtons = function() {
	$("#xps_btnSave").prop("disabled", true);
	$("#xps_btnReset").addClass("hidden");
	$("#xps_btnRefresh").removeClass("hidden");
};

// -------------------------------------------------------------------------------------------
// Enables or disables controls based on Security Level.
// -------------------------------------------------------------------------------------------
XPS.makeSecure = function(json) {
	var isLicensed = json.islicensed;
	var isEnabled = json.isenabled;
	var isAdmin = CMN.isAdminLevel();
	$("#xps_txtProjName, #xps_txtProjVers1, #xps_txtProjVers2").prop("disabled", !isLicensed || !isAdmin || !isEnabled);
	$("#xps_btnProjGet, #xps_btnProjDel").prop("disabled", !isLicensed || !isAdmin || !isEnabled);
	$("#xps_chkAutoGenPlcTags, #xps_txtProjFile").prop("disabled", !isLicensed || !isAdmin);
	$("#xps_btnLaunchShell").prop("disabled", !isLicensed);
	$("#xps_btnProjSend").prop("disabled", !isLicensed || !isAdmin || $("#xps_txtProjFile").val() === "");
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the Xpress project is currenly loaded.
// -------------------------------------------------------------------------------------------
XPS.isProjectLoaded = function() {
	if (XPS.json.isprojectloaded)
		return true;
	XPS.loadPage();
	if (XPS.json.isprojectloaded)
		return true;
	var msg = '<div id="stillLoading1">' + CMN.lookup(XPS.xml, XPS.msgs.STILL_LOADING1) + "</div>";
	msg += '<div id="stillLoading2">' + CMN.lookup(XPS.xml, XPS.msgs.STILL_LOADING2) + "</div>";
	CFG.showInvalid(msg);
	return false;
};

// -------------------------------------------------------------------------------------------
// Special handling for when deleting an Xpress Project.
// -------------------------------------------------------------------------------------------
XPS.deleteProject = function() {
	CMN.showBusy(CMN.lookup(XPS.xml, XPS.msgs.DELETING_PROJECTFILE));
	window.setTimeout(function() {
		XPS.savePage();
		CMN.hideBusy();
	}, 1000);
};

// -------------------------------------------------------------------------------------------
//  Resets Validation.
// -------------------------------------------------------------------------------------------
XPS.resetValidation = function() {
	XPS.$validator.resetForm();
	$("#xps_txtProjName, #xps_txtProjVers1, #xps_txtProjVers2").removeClass("invalid");
};

// -------------------------------------------------------------------------------------------
//  Clears all the file-based input fields on the specified form.
//  see http://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery
// -------------------------------------------------------------------------------------------
XPS.clearFileInputs = function($frm) {
	$frm.find('input[type="file"]').each(function() {
		$(this).wrap("<form>").closest("form").get(0).reset();
		$(this).unwrap();
	});
};

//// -------------------------------------------------------------------------------------------
//// Adds values to the xpress settings xml and returns it.
//// -------------------------------------------------------------------------------------------
//XPS.addValuesToXpressSettingsXml = function(xml1) {
//	var xml2 = CMN.getXml("/services/network/demo/xpresssettings");
//	$(xml2).children().children().each(function() { $(xml1)[0].documentElement.appendChild(this); });
//	return xml1;
//};

// -------------------------------------------------------------------------------------------
// Adds default validation to this form.
// -------------------------------------------------------------------------------------------
XPS.$container = $("#frmXpressSettings div.errcontainer");
XPS.$validator = $("#frmXpressSettings").validate(
	{
		//debug: true,
		errorContainer: XPS.$container,
		errorLabelContainer: $("ol", XPS.$container),
		errorClass: "invalid",
		validClass: "valid",
		wrapper: "li"
	});

// -------------------------------------------------------------------------------------------
// Adds or replaces validation rules of items on this page.
// -------------------------------------------------------------------------------------------
XPS.addValidatorRules = function() {
	var $sel = $("#xps_txtProjName");
	$sel.rules("remove");
	$sel.rules("add", {
		required: {},
		minlength: {
			param: 3
		},
		messages: {
			required: CMN.lookup(XPS.xml, XPS.msgs.PROJECTNAME_REQD),
			minlength: CMN.lookup(XPS.xml, XPS.msgs.PROJECTNAME_MIN_LEN)
		}
	});
	$sel = $("#xps_txtProjVers1");
	$sel.rules("remove");
	$sel.rules("add", {
		required: {},
		messages: {
			required: CMN.lookup(XPS.xml, XPS.msgs.VERSION1_REQD)
		}
	});
	$sel = $("#xps_txtProjVers2");
	$sel.rules("remove");
	$sel.rules("add", {
		required: {},
		messages: {
			required: CMN.lookup(XPS.xml, XPS.msgs.VERSION2_REQD)
		}
	});
	$sel = $("#xps_txtProjFile");
	$sel.rules("remove");
	$sel.rules("add", {
		required: false,
		messages: {}
	});
};

// -------------------------------------------------------------------------------------------
// Loads the 'Xpress HMI Settings' data into the page.
// -------------------------------------------------------------------------------------------
CFG.performFunction(function() {
	XPS.loadPage();
}, CFG.getCaption(CMN.msgs.LOADING));

$(document).ready(function() {
	CMN.checkForError();
});

//# sourceURL=xpresssettings.js