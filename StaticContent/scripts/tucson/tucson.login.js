// =======================================================================================================
// tucson.login.js
// =======================================================================================================
var CMN = window.CMN;
var CFG = window.CFG;

var LGN = {};
LGN.xml = null;

LGN.msgs = {
	PASSWORD_MIN_LEN: 1,
	PASSWORD_REQD: 2,
	USERNAME_MIN_LEN: 3,
	USERNAME_REQD: 4
};

CMN.hideBusy();

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in the 'Username' textbox.
// -------------------------------------------------------------------------------------------
$("#lgn_txtUsername").bind("keypress", function(e) {
	if (e.keyCode === 13 || e.charCode === 13) {
		if ($(this).val() !== EMPTY) {
			e.preventDefault();
			return LGN.login();
		}
	}
	else if (CMN.processKey(e, "alphanumeric"))
		LGN.enableLoginAndResetButtons(e);
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in the 'Password' textbox.
// -------------------------------------------------------------------------------------------
$("#lgn_txtPassword").bind("keypress", function(e) {
	if (e.keyCode === 13 || e.charCode === 13) {
		e.preventDefault();
		return LGN.login();
	}
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when cutting/pasting text to/from the 'Proxy Host' textbox or the
// 'Proxy Port' textbox (allowing only numbers to be pasted).
// -------------------------------------------------------------------------------------------
$("#lgn_txtUsername").bind("cut paste", function(e) {
	//if (CMN.processCutPaste(e, 'alphanumeric'))
	LGN.enableLoginAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Processes cut, paste, and delete when selected from the right-click context menu.
// -------------------------------------------------------------------------------------------
$("#lgn_txtUsername").contextDelete({
	cut: function(e) {
		LGN.enableLoginAndResetButtons(e);
	},
	paste: function(e) {
		LGN.enableLoginAndResetButtons(e);
	},
	contextDelete: function(e) {
		LGN.enableLoginAndResetButtons(e);
	}
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Login' button is clicked.
// -------------------------------------------------------------------------------------------
$("#lgn_btnLogin").on("click", function() {
	if ($("#lgn_txtUsername").val() === EMPTY) {
		CFG.showInvalid();
	} else {
		return LGN.login();
	}
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Reset' button is clicked.
// -------------------------------------------------------------------------------------------
$("#lgn_btnReset").on("click", function() {
	LGN.loadPage();
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Help' button is clicked.
// -------------------------------------------------------------------------------------------
$("#lgn_btnHelp").on("click", function() {
	window.open("help/login.htm");
	return false;
});

// -------------------------------------------------------------------------------------------
// Enables the 'Login' and 'Reset' buttons.
// -------------------------------------------------------------------------------------------
LGN.enableLoginAndResetButtons = function(e) {
	if (e) $("#lgn_btnLogin").prop("disabled", false);
};

// -------------------------------------------------------------------------------------------
// Loads the 'Login' xml object via AJAX call.
// -------------------------------------------------------------------------------------------
LGN.loadPage = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/login?lang=" + CFG.getLanguage(),
		dataType: "xml",
		async: false,
		cache: false,
		success: function(data) {
			LGN.loadPageFromData(data);
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads localized data into page using the specified 'Login' xml object.
// -------------------------------------------------------------------------------------------
LGN.loadPageFromData = function(xml) {
	CFG.setLabelsAndTitles(xml);
	// Get following from a cookie.
	var remember = CMN.getRemember() || false;
	var timeout = CMN.getTimeout() || 300;
	var username = CMN.getUsername(); 
	if (remember) {
		$("#lgn_txtUsername").val(username);
		$("#lgn_btnLogin").prop("disabled", false);
	} else {
		$("#lgn_txtUsername").val("");
		$("#lgn_btnLogin").prop("disabled", true);
	}
	$("#lgn_txtPassword").val("");
	$("#lgn_chkRememberMe").prop("checked", remember);

	// Set the idle max timeout value.
	CFG.idle.max(timeout);
	LGN.xml = xml;
	LGN.setFocus();
};

// -------------------------------------------------------------------------------------------
// Sets focus to either the 'Username' or 'Password' field.
// -------------------------------------------------------------------------------------------
LGN.setFocus = function() {
	var sel = $("#lgn_txtUsername");
	if (sel.val().length !== 0)
		sel = $("#lgn_txtPassword");
	sel.focus().select();
};

// -------------------------------------------------------------------------------------------
// Performs the actual 'Login' using AJAX.
// -------------------------------------------------------------------------------------------
LGN.login = function() {
	var data = LGN.getJsonFromPage();
	$.ajax({
		type: "PUT",
		url: "/services/network/login",
		dataType: "json",
		headers: {
			'x-auth-token': window.localStorage.accessToken,
			"Content-Type": "application/json"
		},
		global: false,
		async: false,
		cache: false,
		data: JSON.stringify(data),
		complete: function(jqXHR) {
			if (jqXHR.status === 200) {
				$("#lgn_txtPassword").val("");
				CFG.hideLogin();
			}
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
			LGN.setFocus();
			return false;
		}
	});
};

// -------------------------------------------------------------------------------------------
// Gets the 'Login' json object by extracting the values from this page.
// -------------------------------------------------------------------------------------------
LGN.getJsonFromPage = function() {
	var obj = {
		username: $("#lgn_txtUsername").val(),
		password: $("#lgn_txtPassword").val(),
		remember: $("#lgn_chkRememberMe").prop("checked")
	};
	return obj;
};

// -------------------------------------------------------------------------------------------
// Returns a value indicating whether the specified password is valid.
// -------------------------------------------------------------------------------------------
LGN.isValidPassword = function(password) {
	return password === EMPTY || password === 0 || (password > 9 && password <= 99999);
};

// -------------------------------------------------------------------------------------------
// Add default validation to this form.
// -------------------------------------------------------------------------------------------
LGN.$container = $("#frmLogin div.errcontainer");
LGN.$validator = $("#frmLogin").validate(
	{
		debug: true,
		errorContainer: LGN.$container,
		errorLabelContainer: $("ol", LGN.$container),
		errorClass: "invalid",
		validClass: "valid",
		wrapper: "li"
	});

// -------------------------------------------------------------------------------------------
// Add or replace validation rules of pertinent items on this page.
// -------------------------------------------------------------------------------------------
LGN.addValidatorRules = function() {
	var sel = $("#lgn_txtUsername");
	sel.rules("remove");
	sel.rules("add", {
		minlength: {
			param: 4
		},
		messages: {
			required: CMN.lookup(LGN.xml, LGN.msgs.USERNAME_REQD),
			minlength: CMN.lookup(LGN.xml, LGN.msgs.USERNAME_MIN_LEN)
		}
	});
	sel = $("#lgn_txtPassword");
	sel.rules("remove");
	sel.rules("add", {
		minlength: {
			param: 6
		},
		messages: {
			required: CMN.lookup(LGN.xml, LGN.msgs.PASSWORD_REQD),
			minlength: CMN.lookup(LGN.xml, LGN.msgs.PASSWORD_MIN_LEN)
		}
	});
};

// Last but not least, execute the load page method.
LGN.loadPage();

//# sourceURL=tucson.login.js