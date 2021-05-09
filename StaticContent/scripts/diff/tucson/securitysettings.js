// =======================================================================================================
// SecuritySettings.js
// =======================================================================================================
var CFG = window.CFG;
var CMN = window.CMN;

var SEC = SEC || {};
SEC.xml = null;
SEC.json = null;

SEC.UserLevels = [];
SEC.DateTimeFormat = "";

SEC.msgs = {
	INVALID_USERNAME_PASSWORD: 1,
	PASSWORD_MIN_LEN: 2,
	PASSWORD_REQD: 3,
	PASSWORDS_MUST_MATCH: 4,
	USERNAME_MIN_LEN: 5,
	USERNAME_REQD: 6,
	ADD_USER_MODE: 7,
	UPD_USER_MODE: 8,
	REM_USER_MODE: 9
};

var EMPTYPassword = "@@@@@@@@";
var DefaultPassword = "        ";
var originalValues = [];

// -------------------------------------------------------------------------------------------
// Loads the 'Security Settings' into the page.
// -------------------------------------------------------------------------------------------
$(document).ready(function() {
	CFG.performFunction(function() {
		SEC.loadPage();
		var rowNum = SEC.getRownumByUsername(SEC.getUsername());
		SEC.grid.setSelectedRows([rowNum]);
		SEC.grid.scrollRowToTop([rowNum - 1]);
	}, CFG.getCaption(CMN.msgs.LOADING));
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Help' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sec_btnHelp").on("click", function() {
	window.open("help/securitysettings.htm");
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the focus event of the password fields.
// -------------------------------------------------------------------------------------------
$("#sec_txtPassword, #sec_txtPasswrd2").focus(function() {
	if (!originalValues[this.id]) {
		originalValues[this.id] = $(this).val();
	}
	if ($(this).val() === originalValues[this.id]) {
		$(this).val(EMPTY);
	}
});

// -------------------------------------------------------------------------------------------
// Handles the blur event of the password fields.
// -------------------------------------------------------------------------------------------
$("#sec_txtPassword, #sec_txtPasswrd2").blur(function() {
	if ($(this).val() === EMPTY) {
		$(this).val(originalValues[this.id]);
		if (this.id === "sec_txtPasswrd2") {
			$("#frmSecuritySettings").valid();
		}
	}
});

// -------------------------------------------------------------------------------------------
// Process cut, paste, and delete when selected from the right-click context menu.
// -------------------------------------------------------------------------------------------
$("#sec_txtUsername").contextDelete({
	cut: function(e) {
		SEC.enableSaveAndResetButtons(e);
	},
	paste: function(e) {
		SEC.enableSaveAndResetButtons(e);
	},
	contextDelete: function(e) {
		SEC.enableSaveAndResetButtons(e);
	}
});

// -------------------------------------------------------------------------------------------
// Processes cut, paste, and delete when selected from the right-click context menu.
// (contextDelete does not work if this selector is combined with above!)
// -------------------------------------------------------------------------------------------
$("#sec_txtPassword").contextDelete({
	cut: function(e) {
		SEC.enableSaveAndResetButtons(e);
	},
	paste: function(e) {
		SEC.enableSaveAndResetButtons(e);
	},
	contextDelete: function(e) {
		SEC.enableSaveAndResetButtons(e);
	}
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in the 'Username' or a 'Password' textbox.
// -------------------------------------------------------------------------------------------
$("#sec_txtUsername, #sec_txtPassword, #sec_txtPasswrd2").bind("keypress keydown", function(e) {
	if (CMN.processKey(e, "alphanumeric"))
		SEC.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when cutting/pasting text to/from the 'Username' or a 'Password'
// textbox.
// -------------------------------------------------------------------------------------------
$("#sec_txtUsername, #sec_txtPassword, #sec_txtPasswrd2").bind("cut paste", function(e) {
	if (CMN.processCutPaste(e, "alphanumeric"))
		SEC.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'No Password Required' checkbox is clicked.
// -------------------------------------------------------------------------------------------
$("#sec_chkNoPwdReqd").on("click", function() {
	var isBlank = $(this).is(":checked");
	$("#sec_txtPassword, #sec_txtPasswrd2").prop("disabled", isBlank).val(isBlank ? String.empty : DefaultPassword);
	SEC.enableSaveAndResetButtons(this);
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'User Level' combobox value is changed.
// -------------------------------------------------------------------------------------------
$("select#sec_cboUserLevel").change(function() {
	SEC.enableSaveAndResetButtons(this);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'New User' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sec_btnAddUser").on("click", function() {
	SEC.loadFormFromDataItem();
	SEC.grid.setSelectedRows({});
	SEC.grid.setActiveCell({});
	$("#sec_txtUsername").prop("disabled", false);
	$("#sec_txtUsername").focus().select();
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Remove User' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sec_btnRemUser").on("click", function() {
	SEC.showEditMode(SEC.msgs.REM_USER_MODE);
	$("#sec_btnRemUser").prop("disabled", true);
	$("#sec_btnAddUser").prop("disabled", true);
	$("#sec_txtUsername").prop("disabled", true);
	$("#sec_chkNoPwdReqd").prop("disabled", true);
	$("#sec_txtPassword").prop("disabled", true);
	$("#sec_txtPasswrd2").prop("disabled", true);
	$("#sec_cboUserLevel").prop("disabled", true);
	$("#sec_btnSave").prop("disabled", false);
	$("#sec_chkLoginEnabled").prop("disabled", true);
	$("#sec_chkDeleted").prop("checked", true);
	$("#sec_txtUsername").addClass("sec_to_delete");
	$("#sec_txtPassword").addClass("sec_to_delete");
	$("#sec_txtPasswrd2").addClass("sec_to_delete");
	$("#sec_cboUserLevel").addClass("sec_to_delete");
	$("#sec_txtDateCreated").addClass("sec_to_delete");
	$("#sec_txtDateModified").addClass("sec_to_delete");
	$(".selected.slick-cell").addClass("sec_to_delete");
	$("#sec_btnRefresh").addClass("hidden");
	$("#sec_btnReset").removeClass("hidden");
	$("#sec_btnSave").focus();
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Is User Enabled' checkbox is clicked.
// -------------------------------------------------------------------------------------------
$("#sec_chkLoginEnabled").on("click", function() {
	SEC.enableDisableInputs();
	SEC.enableSaveAndResetButtons(this);
	SEC.resetValidation($(this).is(":checked"));
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Save' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sec_btnSave").on("click", function() {
	if ($("#sec_chkDeleted").is(":checked") || $("#frmSecuritySettings").valid()) {
		CFG.performFunction(SEC.savePage, CFG.getCaption(CMN.msgs.SAVING));
	} else {
		CFG.showInvalid();
	}
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when either the 'Refresh' or 'Reset' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sec_btnRefresh, #sec_btnReset").on("click", function() {
	var msg = CFG.getCaption($("#sec_btnSave").is(":disabled") ? CMN.msgs.REFRESHING : CMN.msgs.RESETTING);
	CFG.performFunction(SEC.loadPage, msg);
	return false;
});

// -------------------------------------------------------------------------------------------
// Loads the 'Security Settings' xml object via AJAX call.
// -------------------------------------------------------------------------------------------
SEC.loadPage = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/securitysettings?lang=" + CFG.getLanguage(),
		dataType: "xml",
		async: false,
		cache: false,
		success: function(xml) {
			SEC.loadPageFromXml(xml);
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified 'Security Settings' xml object.
// -------------------------------------------------------------------------------------------
SEC.loadPageFromXml = function(xml) {
	SEC.xml = xml;
	
	SEC.DateTimeFormat = $(xml).find("SecuritySettings").find("DateTimeFormat").text();

	SEC.loadUserLevelsComboFromXml(xml);

	SEC.loadSecurityGrid();

	// Select the row of the grid corrresponding to the username.
	var username = SEC.getUsername() || CMN.getUsername();
	var rownum = SEC.getRownumByUsername(username);
	SEC.grid.setSelectedRows([rownum]);

	// Load the rest of the page.
	var rows = SEC.grid.getSelectedRows();
	if (rows.length) {
		var dataItem = SEC.grid.getDataItem(rows[0]);
		SEC.loadFormFromDataItem(dataItem);
	}

	SEC.enableDisableInputs();

	SEC.disableSaveAndResetButtons();

	CFG.setLabelsAndTitles(xml);
	$("#sec_chkNoPwdReqd").prop("title", $("#sec_lblNoPasswordReqd").prop("title"));
	$("#sec_chkLoginEnabled").prop("title", $("#sec_lblLoginEnabled").prop("title"));

	SEC.addValidatorRules();

	SEC.resetValidation();

	SEC.makeSecure();

};

// -------------------------------------------------------------------------------------------
// Saves the 'Security Settings' text/xml object via AJAX call.
// -------------------------------------------------------------------------------------------
SEC.savePage = function() {
	var isError = false;
	var rowNum = SEC.getSelectedRownum();
	var rowCnt = SEC.getRowCount();
	var data = SEC.getJsonFromPage();
	$.ajax({
		type: "PUT",
		url: "/services/network/securitydata",
		dataType: "json",
		headers: {
			'x-auth-token': localStorage.accessToken,
			"Content-Type": "application/json"
		},
		cache: false,
		global: false,
		async: false,
		data: JSON.stringify(data),
		complete: function(jqXHR) {
			if (jqXHR.status === 200) {
				SEC.loadPage();
			}
		},
		error: function(jqXHR) { // function(jqXHR, textStatus, thrownError)
			if (jqXHR.status !== 200) {
				isError = true;
				CFG.handleError(jqXHR);
			}
		}
	});
	if (!isError) {
		var newRowCnt = SEC.getRowCount();
		if (newRowCnt < rowCnt) { // User was removed.
			rowNum -= (rowCnt - newRowCnt);
		} else {  // User was added or updated.
			rowNum = SEC.getRownumByUsername(data.username);
		}
		SEC.grid.setSelectedRows([rowNum]);
		SEC.grid.scrollRowIntoView(SEC.grid.getSelectedRows()[0], true);
	}
};

// -------------------------------------------------------------------------------------------
// Gets the 'Security Settings' json string by extracting the values from the page.
// -------------------------------------------------------------------------------------------
SEC.getJsonFromPage = function() {
	var password = $("#sec_chkNoPwdReqd").is(":checked") ?
		EMPTYPassword :
		CMN.trim($("#sec_txtPassword").val());
	var user = {
		username: SEC.getUsername(),
		password: password,
		userlevel: parseInt($("#sec_cboUserLevel").val(), 10),
		enabled: SEC.isUserAllowedLogin() ? 1 : 0,
		deleted: $("#sec_chkDeleted").is(":checked") ? 1 : 0
	};
	return user;
};

// -------------------------------------------------------------------------------------------
// Gets the current username.
// -------------------------------------------------------------------------------------------
SEC.getUsername = function() {
	return CMN.toTitleCase(CMN.trim($("#sec_txtUsername").val()));
};

// -------------------------------------------------------------------------------------------
// Loads data into the form using the specified data item.
// -------------------------------------------------------------------------------------------
SEC.loadFormFromDataItem = function(itm) {
	if (!itm || itm.__group) {
		$("#sec_txtUsername").val(EMPTY);
		$("#sec_chkLoginEnabled").prop("checked", true);
		$("#sec_chkDeleted").prop("checked", false);
		$("#sec_txtDateCreated").val(EMPTY);
		$("#sec_txtDateModified").val(EMPTY);
		$("#sec_txtPassword").val(EMPTY);
		$("#sec_txtPasswrd2").val(EMPTY);
		$("#sec_btnRefresh").addClass("hidden");
		$("#sec_btnReset").removeClass("hidden");
		$("#sec_cboUserLevel").prop("selectedIndex", 1);
		$("#sec_btnAddUser").prop("disabled", true);
		$("#sec_btnRemUser").prop("disabled", true);
		SEC.showEditMode(SEC.msgs.ADD_USER_MODE);
	} else {
		$("#sec_txtUsername").val(itm.username);
		$("#sec_chkLoginEnabled").prop("checked", (itm.enabled === 1));
		$("#sec_chkDeleted").prop("checked", (itm.deleted === 1));
		$("#sec_txtDateCreated").val(moment(CMN.millisecondsToDate(itm.datecreated)).format(SEC.DateTimeFormat));
		$("#sec_txtDateModified").val(moment(CMN.millisecondsToDate(itm.datemodified)).format(SEC.DateTimeFormat));
		$("#sec_txtPassword").val(DefaultPassword);
		$("#sec_txtPasswrd2").val(DefaultPassword);
		$("#sec_btnRefresh").removeClass("hidden");
		$("#sec_btnReset").addClass("hidden");
		$("#sec_cboUserLevel").prop("selectedIndex", parseInt(itm.userlevel, 10));
		var isDisabled = !CMN.isAdminLevel();
		$("#sec_btnAddUser").prop("disabled", isDisabled);
		$("#sec_btnRemUser").prop("disabled", isDisabled || itm.username === "Admin");
		SEC.showEditMode(SEC.msgs.UPD_USER_MODE);
	}
	$("#sec_btnSave").prop("disabled", true);
	$("#sec_chkNoPwdReqd").prop("checked", false);
	$(".sec_to_delete").removeClass("sec_to_delete");

	SEC.enableDisableInputs();
	if (SEC.$validator) {
		SEC.$validator.resetForm();
	}
};

// -------------------------------------------------------------------------------------------
// Loads the data into the 'User Level' combo box using the specified xml object.
// -------------------------------------------------------------------------------------------
SEC.loadUserLevelsComboFromXml = function(xml) {
	var sel = $("#sec_cboUserLevel");
	sel.empty();
	var nodes = $(xml).find("UserLevels").children();
	$(nodes).each(
		function() {
			var id = $(this).attr("Id");
			var lbl = $(this).attr("lbl");
			sel.append($("<option/>").attr("value", id).text(lbl));
			SEC.UserLevels.push({ Key: id, Value: lbl });
		}
	);
};

// -------------------------------------------------------------------------------------------
// Shows the current edit mode (i.e., Add, Update, Delete) in the page.
// -------------------------------------------------------------------------------------------
SEC.showEditMode = function(msg) {
	$("#sec_lblEditMode").text(
		CMN.isAdminLevel() || (msg.id === 8 && $("#sec_txtUsername").val() === CMN.getUsername()) ? "[" + CMN.lookup(SEC.xml, msg) + "]" : "");
};

// -------------------------------------------------------------------------------------------
// Enables or disables the 'Username' and 'Password' input boxes depending on whether the
// 'Enabled' checkbox contains a checkmark.
// -------------------------------------------------------------------------------------------
SEC.enableDisableInputs = function() {
	var isAdminLevel = CMN.isAdminLevel();
	var isAddingUser = $("#sec_btnAddUser").prop("disabled");
	var isAdminSelected = $("#sec_txtUsername").val() === "Admin";
	$("#sec_txtUsername").prop("disabled", !isAdminLevel || !isAddingUser);
	if (isAdminLevel || !isAddingUser && SEC.isUserAllowedLogin()) {
		$("#sec_txtPassword, #sec_txtPasswrd2").prop("disabled", $("#sec_chkNoPwdReqd").is(":checked"));
		$("#sec_chkNoPwdReqd").prop("disabled", false);
		$("#sec_cboUserLevel").prop("disabled", isAdminSelected);
	} else {
		$("#sec_chkNoPwdReqd, #sec_cboUserLevel").prop("disabled", true);
		$("#sec_txtPassword, #sec_txtPasswrd2").prop("disabled", $("#sec_txtUsername").val() !== CMN.getUsername());
	}
	$("#sec_chkLoginEnabled").prop("disabled", !isAdminLevel || isAdminSelected);
};

// -------------------------------------------------------------------------------------------
// Enable or disable controls based on Security Level.
// -------------------------------------------------------------------------------------------
SEC.makeSecure = function() {
	// Currently all handled by SEC.loadFormFromDataItem()!
};

// -------------------------------------------------------------------------------------------
// Enables 'Save' and 'Reset' buttons (by showing 'Reset' and hiding 'Refresh').
// -------------------------------------------------------------------------------------------
SEC.enableSaveAndResetButtons = function(e) {
	$("#sec_btnSave").prop("disabled", false);
	$("#sec_btnRefresh").addClass("hidden");
	$("#sec_btnReset").removeClass("hidden");
	CMN.validateMe(e);
};

// -------------------------------------------------------------------------------------------
// Disables the 'Save' and 'Reset' buttons (by showing 'Refresh' and hiding 'Reset').
// -------------------------------------------------------------------------------------------
SEC.disableSaveAndResetButtons = function() {
	$("#sec_btnSave").prop("disabled", true);
	$("#sec_btnReset").addClass("hidden");
	$("#sec_btnRefresh").removeClass("hidden");
};

// -------------------------------------------------------------------------------------------
// Returns a value indicating whether the 'Is User Enabled' checkbox contains a checkmark.
// -------------------------------------------------------------------------------------------
SEC.isUserAllowedLogin = function() {
	return ($("#sec_chkLoginEnabled").is(":checked"));
};

// -------------------------------------------------------------------------------------------
// Sets the initial focus.
// -------------------------------------------------------------------------------------------
SEC.setInitialFocus = function() {
	$("#secGrid").focus().select();
};

// -------------------------------------------------------------------------------------------
// Add default validation for this particular form.
// -------------------------------------------------------------------------------------------
SEC.$container = $("#frmSecuritySettings div.errcontainer");
SEC.$validator = $("#frmSecuritySettings").validate(
	{
		//debug: true,
		errorContainer: SEC.$container,
		errorLabelContainer: $("ol", SEC.$container),
		errorClass: "invalid",
		validClass: "valid",
		wrapper: "li"
	});

// -------------------------------------------------------------------------------------------
// Add or replace validation rules of items on this page.
// -------------------------------------------------------------------------------------------
SEC.addValidatorRules = function() {
	var $sel = $("#sec_txtUsername");
	$sel.rules("remove");
	$sel.rules("add", {
		required: {
	},
	minlength: {
		param: 3
	},
	messages: {
		required: CMN.lookup(SEC.xml, SEC.msgs.USERNAME_REQD),
		minlength: String.format(CMN.lookup(SEC.xml, SEC.msgs.USERNAME_MIN_LEN), 3)
	}
});
$sel = $("#sec_txtPassword");
$sel.rules("remove");
$sel.rules("add", {});
$sel = $("#sec_txtPasswrd2");
$sel.rules("remove");
$sel.rules("add", {	equalTo: {		depends: function() { return SEC.isUserAllowedLogin() && !CMN.isReallyEmpty($("#sec_txtPassword")); },		param: "#sec_txtPassword"	},	messages: {		equalTo: CMN.lookup(SEC.xml, SEC.msgs.PASSWORDS_MUST_MATCH)	}});
};

// -------------------------------------------------------------------------------------------
//  Resets Validation.
// -------------------------------------------------------------------------------------------
SEC.resetValidation = function(isEnabledChecked) {
	if (isEnabledChecked) {
		$("#sec_txtUsername, #sec_txtPasswrd2").valid();
	} else {
		SEC.$validator.resetForm();
		$("#sec_txtUsername, #sec_txtPasswrd2").removeClass("invalid");
	}
};

//SEC.getDataItem = function() {
//	// add a 'name' property
//	var jsObj = { name: 'a' };
//	var anotherObj = { other: 'b' };
//	// will add 'other' property to jsObj
//	$.extend(jsObj, anotherObj);
//	return jsObj;
//};

//# sourceURL=securitysettings.js