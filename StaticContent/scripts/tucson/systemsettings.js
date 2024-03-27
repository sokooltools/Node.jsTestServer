// =======================================================================================================
// SystemSettings.js
// =======================================================================================================
var CFG = window.CFG;
var CMN = window.CMN;
var DTS = window.DTS;

$("head").append('<link rel="stylesheet" type="text/css" href="themes/tucson/systemsettings.css">');

var SYS = {};
SYS.xml = null;
SYS.json = {};
SYS.isSaveEnabled = true;

SYS.msgs = {
	MACHINENAME_EXISTS: 1,
	MACHINENAME_MIN: 2,
	MACHINENAME_REQD: 3,
	MACHINENAME_VALID: 4,
	CONFIRM_REBOOT: 5,
	INTERNETTIMESERVER_MIN: 6,
	INTERNETTIMESERVER_REQD: 7,
	REFRESHINTERVAL_RANGE: 8,
	REFRESHINTERVAL_REQD: 9,
	VALIDATING_MACHINENAME: 10,
	REBOOT_RECOMMENDED: 11
};

// -------------------------------------------------------------------------------------------
// Provides validation for items on this page.
// -------------------------------------------------------------------------------------------
SYS.$container = $("#frmSystemSettings div.errcontainer");

SYS.$validator = $("#frmSystemSettings").validate(
	{
		debug: true,
		errorContainer: SYS.$container,
		errorLabelContainer: $("ol", SYS.$container),
		errorClass: "invalid",
		validClass: "valid",
		wrapper: "li",
		rules: {
			sys_txtMachineDesc: {
				required: false
			},
			sys_chkIsSyncWithMyClock: {
				required: false
			},
			sys_chkIsSyncWithInternet: {
				required: false
			},
			sys_chkIsAutoDst: {
				required: false
			},
			sys_txtRefreshInterval: {
				required: true
			},
			sys_cboInternetTimeServer: { // RAS
				required: true
			}
		}
	});

// -------------------------------------------------------------------------------------------
// Binds the mouseup event to input elements so as to enable save and reset buttons.
// Mousedown and mouseup events are fired on input elements when the 'clear' button is clicked.
// -------------------------------------------------------------------------------------------
$("input").on("mouseup", function(e) {
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
			SYS.enableSaveAndResetButtons(e);
		}
	}, 1);
});

// -------------------------------------------------------------------------------------------
// Processes cut, paste, and delete when selected from the right-click context menu.
// -------------------------------------------------------------------------------------------
$("#sys_txtMachineName").contextDelete({
	cut: function(e) {
		SYS.enableSaveAndResetButtons(e);
	},
	paste: function(e) {
		if (CMN.processCutPaste(e, "alphanumeric", e.target.id === "sys_txtMachineDesc"))
			SYS.enableSaveAndResetButtons(e);
	},
	contextDelete: function(e) {
		SYS.enableSaveAndResetButtons(e);
	}
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in the 'Machine Name' textbox.
// -------------------------------------------------------------------------------------------
$("#sys_txtMachineName").on("keypress keydown", function(e) {
	if (CMN.processKey(e, "alphanumeric"))
		SYS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when cutting/pasting text to or from the 'Machine Name' textbox.
// -------------------------------------------------------------------------------------------
$("#sys_txtMachineName").on("cut paste", function(e) {
	if (CMN.processCutPaste(e, "alphanumeric"))
		SYS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in the 'Machine Desc' textbox.
// -------------------------------------------------------------------------------------------
$("#sys_txtMachineDesc").on("keypress keydown", function(e) {
	if (CMN.processKey(e, "alphanumeric", true))
		SYS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when cutting/pasting text to or from the 'Machine Desc' textbox.
// -------------------------------------------------------------------------------------------
$("#sys_txtMachineDesc").on("cut paste", function(e) {
	if (CMN.processCutPaste(e, "alphanumeric", true))
		SYS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Processes cut, paste, and delete when selected from the right-click context menu.
// (contextDelete does not work if this selector is combined with selector above!)
// -------------------------------------------------------------------------------------------
$("#sys_txtMachineDesc").contextDelete({
	cut: function(e) {
		SYS.enableSaveAndResetButtons(e);
	},
	paste: function(e) {
		if (CMN.processCutPaste(e, "alphanumeric", true))
			SYS.enableSaveAndResetButtons(e);
	},
	contextDelete: function(e) {
		SYS.enableSaveAndResetButtons(e);
	}
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when a key is pressed in the 'Refresh Interval' textbox.
// -------------------------------------------------------------------------------------------
$("#sys_txtRefreshInterval").on("keypress keydown", function(e) {
	if (CMN.processKey(e, "numeric"))
		SYS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when cutting/pasting text to or from the 'Refresh Interval' textbox 
// (allowing only numbers to be pasted).
// -------------------------------------------------------------------------------------------
$("sys_txtRefreshInterval").on("cut paste", function(e) {
	if (CMN.processCutPaste(e, "numeric"))
		SYS.enableSaveAndResetButtons(e);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the spin value is changed and cursor leaves the field.
// -------------------------------------------------------------------------------------------
$("#sys_txtRefreshInterval").on("spin", function() {
	SYS.enableSaveAndResetButtons(this);
	$("#frmSystemSettings").valid();
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Help' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sys_btnHelp").on("click", function() {
	window.open("help/systemsettings.htm");
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Refresh' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sys_btnRefresh, #sys_btnReset").on("click", function() {
	SYS.doRefresh();
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Refresh' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sys_btnReboot").on("click", function() {
	SYS.doReboot();
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Save' button is clicked.
// -------------------------------------------------------------------------------------------
$("#sys_btnSave, #sys_btnSaveD").on("click", function() {
	SYS.doSave();
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles event raised when the 'Synch with my Clock' checkbox is clicked. This is used for
// disabling the 'date time' and 'time zone' fields and begins synchronizing them with the
// browser's date and time information.
// -------------------------------------------------------------------------------------------
$("#sys_chkIsSyncWithMyClock").on("click", function() {
	return DTS.syncWithMyClock(this);
});

// -------------------------------------------------------------------------------------------
// Handles event raised when the 'Synch with Internet time server' checkbox is clicked. This
// is used for disabling the date and time and time zone fields and begins synchronizing them
// with an Internet Time Server.
// -------------------------------------------------------------------------------------------
$("#sys_chkIsSyncWithInternet").on("click", function() {
	return SYS.syncWithInternet(this, this.checked);
});

// -------------------------------------------------------------------------------------------
// Handles event raised when the 'Adjust for Daylight Saving Time' checkbox value or the
// 'Refresh Units' combobox value is changed.
// -------------------------------------------------------------------------------------------
$("#sys_chkIsAutoDst, select#sys_cboRefreshUnits").change(function() {
	SYS.enableSaveAndResetButtons(this);
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles event raised when the 'Synch with Internet time server' checkbox is clicked. This
// is used for disabling the date and time and time zone fields and begins synchronizing them
// with an Internet Time Server.
// -------------------------------------------------------------------------------------------
SYS.syncWithInternet = function(sender, isChecked) {
	if (isChecked) {
		$("#sys_chkIsSyncWithMyClock").prop("checked", false);
		$("#sys_grpSyncWithInternet").css("display", "block");
	} else {
		$("#sys_grpSyncWithInternet").css("display", "none");
	}
	DTS.syncWithInternet(sender);
	$("#frmSystemSettings").valid();
	return true;
};

// -------------------------------------------------------------------------------------------
// Perform a refresh of the page.
// -------------------------------------------------------------------------------------------
SYS.doRefresh = function() {
	var msg = $("#sys_btnSave").is(":disabled") ? CMN.msgs.REFRESHING : CMN.msgs.RESETTING;
	CFG.performFunction(function() {
		SYS.loadPage();
		SYS.loadData();
		DTS.loadData();
	}, CFG.getCaption(msg));
};

// -------------------------------------------------------------------------------------------
// Perform a reboot of the PAC following user confirmation.
// -------------------------------------------------------------------------------------------
SYS.doReboot = function() {
	var title = $("#sys_lblSystemSettings").text();
	var msg = CMN.lookup(SYS.xml, SYS.msgs.CONFIRM_REBOOT);
	var btn1 = CMN.lookup(CFG.xml, CMN.msgs.DIALOG_OK);
	var btn2 = CMN.lookup(CFG.xml, CMN.msgs.DIALOG_CANCEL);
	CMN.showConfirm(msg, title, CMN.icons.EXCLAMATION, btn1, btn2).then(function(answer) {
		if (answer.toString() === btn1) {
			CFG.doReboot();
		}
	});
};

// -------------------------------------------------------------------------------------------
// Saves the System Settings.
// -------------------------------------------------------------------------------------------
SYS.doSave = function() {
	if (!SYS.isSaveEnabled)
		return;
	if (!$("#frmSystemSettings").valid()) {
		CFG.showInvalid();
		return;
	}
	if (!SYS.isRefreshIntervalValid()) {
		var msg = "<div class='img_exclamation'></div><div id='invalid_text'>";
		msg += CMN.lookup(SYS.xml, SYS.msgs.REFRESHINTERVAL_RANGE);
		msg += "</div>";
		CMN.showDialog(msg);
		return;
	}
	var newMachineName = $("#sys_txtMachineName").val();
	var isNewMachineName = newMachineName !== SYS.json.machinename;
	if (isNewMachineName) {
		CFG.performFunction(function() {
			var status = SYS.isExistingMachineName(newMachineName);
			if (status === undefined)
				return;
			if (status === true) {
				SYS.showExistingMachineNameDialog(newMachineName);
				return;
			}
			SYS.completeSave();
		}, CMN.lookup(SYS.xml, SYS.msgs.VALIDATING_MACHINENAME));
	} else {
		SYS.completeSave();
	}
};

// -------------------------------------------------------------------------------------------
// Completes the save of the the System Settings.
// -------------------------------------------------------------------------------------------
SYS.completeSave = function() {
	CFG.performFunction(function() {
		// Because of latency, always save the 'Date and Time' data first!
		DTS.saveData();
		SYS.savePage();
	}, CFG.getCaption(CMN.msgs.SAVING));
};

// -------------------------------------------------------------------------------------------
// Loads the 'System Settings' xml object via an AJAX call.
// -------------------------------------------------------------------------------------------
SYS.loadPage = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/systemsettings?lang=" + CFG.getLanguage(),
		dataType: "xml",
		async: false,
		cache: false,
		success: function(xml) {
			SYS.loadPageFromXml(xml);
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified 'System Settings' xml object.
// -------------------------------------------------------------------------------------------
SYS.loadPageFromXml = function(xml) {
	SYS.xml = xml;
	CFG.setLabelsAndTitles(xml);
	SYS.addValidatorRules();
	// This needs to be performed after SYS.xml has been set, but before makeSecure;
	DTS.init();
	SYS.makeSecure();
};

// -------------------------------------------------------------------------------------------
// Loads the 'System Data' from a JSON object returned via an AJAX call.
// -------------------------------------------------------------------------------------------
SYS.loadData = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/systemdata",
		dataType: "json",
		cache: false,
		async: false,
		success: function(json) {
			SYS.loadPageData(json);
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified json object.
// -------------------------------------------------------------------------------------------
SYS.loadPageData = function(json) {
	SYS.json = json;
	$("#sys_txtMachineName").val(json.machinename);
	$("#sys_txtMachineDesc").val(json.machinedesc);
	$("#sys_cboInternetTimeServer").val(json.internettimeservers[0]);
	var timeobj = DTS.millisecondsToTime(json.refreshinterval);
	spinner.spinner("value", timeobj.timeValue);
	$("#sys_cboRefreshUnits").val(timeobj.units);

	// 'Sync With My Clock' always starts out as unchecked.
	$("#sys_chkIsSyncWithMyClock").prop("checked", false);

	$("#sys_chkIsSyncWithInternet").prop("checked", json.isautoupdate);

	SYS.syncWithInternet($("#sys_chkIsSyncWithInternet"), json.isautoupdate);

	SYS.disableSaveAndResetButtons();
};

// -------------------------------------------------------------------------------------------
// Saves the 'System Settings' after validating the machine name if it has changed.
// -------------------------------------------------------------------------------------------
SYS.savePage = function() {
	var json = SYS.getJsonFromPage();
	var isRebootRecommended = SYS.isRebootRecommended(json);
	if (CMN.compare(json, SYS.json)) {
		SYS.disableSaveAndResetButtons();
		return;
	}
	SYS.saveJson(json);
	if (isRebootRecommended) {
		var msg = "<div class='img_exclamation'></div><div id='invalid_text'>";
		msg += CMN.lookup(SYS.xml, SYS.msgs.REBOOT_RECOMMENDED);
		msg += "</div>";
		CMN.showDialog(msg);		
	}
};

// -------------------------------------------------------------------------------------------
// Saves the specified 'System Settings' json text to the device via an AJAX call.
// -------------------------------------------------------------------------------------------
SYS.saveJson = function(json) {
	$.ajax({
		type: "PUT",
		url: "/services/network/systemdata",
		dataType: "json",
		headers: {
			'x-auth-token': localStorage.accessToken,
			"Content-Type": "application/json"
		},
		global: false,
		async: false,
		data: JSON.stringify(json),
		complete: function(jqXHR) {
			if (jqXHR.status === 200) {
				SYS.json = json;
				SYS.disableSaveAndResetButtons();
				// Update machine name on the 'Network Settings' page.
				$("span#net_txtMachineName").text($("#sys_txtMachineName").val());
			}
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Gets the 'System Data' json string by extracting the values from the page.
// -------------------------------------------------------------------------------------------
SYS.getJsonFromPage = function() {
	var its = ($("#sys_cboInternetTimeServer").val());
	var json = {
		machinename: $("#sys_txtMachineName").val(),
		machinedesc: $("#sys_txtMachineDesc").val(),
		isautoupdate: SYS.isInternetTimeServerChecked(),
		internettimeservers: [its],
		isautodst: $("#sys_chkIsAutoDst").is(":checked"),
		refreshinterval: SYS.getRefreshInterval(),
		// The following values are not stored in the page:
		serverrole: SYS.json.serverrole,
		threshold: SYS.json.threshold,
		recoveryrefresh: SYS.json.recoveryrefresh
	};
	return json;
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the 'Refresh Interval' value must be at least 5 minutes
// and no more than 2 weeks.
// -------------------------------------------------------------------------------------------
SYS.isRefreshIntervalValid = function() {
	var refreshInterval = SYS.getRefreshInterval();
	return !SYS.isInternetTimeServerChecked() ||
		(refreshInterval >= 300000 && refreshInterval <= 1209600000);
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the 'Synch with Internet Time Server' checkbox 
// contains a checkmark.
// -------------------------------------------------------------------------------------------
SYS.isInternetTimeServerChecked = function() {
	return $("#sys_chkIsSyncWithInternet").is(":checked");
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether a reboot is recommended.
// -------------------------------------------------------------------------------------------
SYS.isRebootRecommended = function(newJson) {
	return newJson.machinename !== SYS.json.machinename || 
		(SYS.isInternetTimeServerChecked() && newJson.isautoupdate != SYS.json.isautoupdate);
};

// -------------------------------------------------------------------------------------------
// Returns the current internet time server refresh interval in milliseconds.
// -------------------------------------------------------------------------------------------
SYS.getRefreshInterval = function() {
	var time = spinner.spinner("value");
	var units = parseInt($("#sys_cboRefreshUnits").val(), 10);
	return DTS.timeToMilliseconds(time, units);
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the specified 'Machine Name' already exists on the network.
// -------------------------------------------------------------------------------------------
SYS.isExistingMachineName = function(machineName) {
	var retval;
	$.ajax({
		type: "GET",
		url: "/services/network/isexistingmachinename/" + machineName,
		dataType: "json",
		async: false,
		cache: false,
		success: function(json) {
			retval = json.isexisting;
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
	return retval;
};

// -------------------------------------------------------------------------------------------
// Shows a dialog indicating the specified 'Machine Name' already exists on the network.
// -------------------------------------------------------------------------------------------
SYS.showExistingMachineNameDialog = function(newMachineName) {
	var msg = "<div class='img_exclamation'></div><div id='invalid_text'>";
	msg += String.format(CMN.lookup(SYS.xml, SYS.msgs.MACHINENAME_EXISTS), newMachineName);
	msg += "</div>";
	CMN.showDialog(msg);
};

// -------------------------------------------------------------------------------------------
// Enables 'Save' and shows 'Reset'; hides 'Refresh'; disables 'Sync Now'.
// -------------------------------------------------------------------------------------------
SYS.enableSaveAndResetButtons = function(e) {
	if (!CMN.isAdminLevel())
		return;
	$("#sys_btnSave").prop("disabled", false);
	$("#sys_btnSyncNow").prop("disabled", true);
	$("#sys_btnRefresh").addClass("hidden");
	$("#sys_btnReset").removeClass("hidden");
	if (!e.id)
		CMN.validateMe(e);
	SYS.isSaveEnabled = true;
};

// -------------------------------------------------------------------------------------------
// Disables 'Save' and hides 'Reset'; shows 'Refresh'; enables 'Sync Now'.
// -------------------------------------------------------------------------------------------
SYS.disableSaveAndResetButtons = function() {
	$("#sys_btnSave").prop("disabled", true);
	$("#sys_btnSyncNow").prop("disabled", false);
	$("#sys_btnReset").addClass("hidden");
	$("#sys_btnRefresh").removeClass("hidden");
	if (SYS.$validator)
		SYS.$validator.resetForm();
	SYS.isSaveEnabled = false;
};

// -------------------------------------------------------------------------------------------
// Returns the date format extracted from the xml to use for display purposes.
// -------------------------------------------------------------------------------------------
SYS.getDateFormat = function() {
	var fmt = $(SYS.xml).find("DateFormat").text();
	return fmt ? fmt : "mm/dd/yy";
};

// -------------------------------------------------------------------------------------------
// Returns the time format extracted from the xml to use for display purposes.
// -------------------------------------------------------------------------------------------
SYS.getTimeFormat = function() {
	var fmt = $(SYS.xml).find("TimeFormat").text();
	return fmt ? fmt : "hh:mm:ss TT";
};

// -------------------------------------------------------------------------------------------
// Sets the initial focus.
// -------------------------------------------------------------------------------------------
SYS.setInitialFocus = function() {
	$("#sys_txtMachineName").focus().select();
};

// -------------------------------------------------------------------------------------------
// Enables or disables controls based on User's Security Level.
// -------------------------------------------------------------------------------------------
SYS.makeSecure = function() {
	var isAdmin = CMN.isAdminLevel();
	if (!isAdmin) {
		$("#sys_txtMachineName, #sys_txtMachineDesc, #sys_chkIsAutoDst, #sys_cboMachineTimeZone," +
		" #sys_chkIsSyncWithMyClock, #sys_chkIsSyncWithInternet, #sys_cboInternetTimeServer," +
		" #sys_txtRefreshInterval, #sys_cboRefreshUnits, #sys_btnReboot").prop("disabled", true);
		//spinner.spinner("option", "disabled", true);
		$("span.ui-spinner > a").remove();
		$("span.custom-combobox > a").remove();
	}
	DTS.enableDatetimePicker(isAdmin);
};

// -------------------------------------------------------------------------------------------
// Adds or replaces 'validation rules' of items on this page.
// -------------------------------------------------------------------------------------------
SYS.addValidatorRules = function() {
	var $sel = $("#sys_txtMachineName");
	$sel.rules("remove");
	$sel.rules("add", {
		required: {},
		minlength: { param: 4 },
		validmachinename: true,
		messages: {
			required: CMN.lookup(SYS.xml, SYS.msgs.MACHINENAME_REQD),
			minlength: CMN.lookup(SYS.xml, SYS.msgs.MACHINENAME_MIN),
			validmachinename: CMN.lookup(SYS.xml, SYS.msgs.MACHINENAME_VALID)
		}
	});
	$sel = $("#sys_txtRefreshInterval");
	$sel.rules("remove");
	$sel.rules("add", {
		//validrefreshinterval: true,
		required: {
			depends: function() { return SYS.isInternetTimeServerChecked(); }
		},
		range: {
			depends: function() { return SYS.isInternetTimeServerChecked(); },
			param: [1, 9999]
		},
		messages: {
			required: CMN.lookup(SYS.xml, SYS.msgs.REFRESHINTERVAL_REQD),
			range: CMN.lookup(SYS.xml, SYS.msgs.REFRESHINTERVAL_RANGE)
			//,validrefreshinterval: CMN.lookup(SYS.xml, SYS.msgs.REFRESHINTERVAL_RANGE)
		}
	});
	$sel = $("#sys_cboInternetTimeServer");
	$sel.rules("remove");
	$sel.rules("add", {
		//validrefreshinterval: true,
		required: {
			depends: function() { return SYS.isInternetTimeServerChecked(); }
		},
		minlength: {
			depends: function() { return SYS.isInternetTimeServerChecked(); },
			param: 4
		},
		messages: {
			required: CMN.lookup(SYS.xml, SYS.msgs.INTERNETTIMESERVER_REQD),
			minlength: CMN.lookup(SYS.xml, SYS.msgs.INTERNETTIMESERVER_MIN)
			//,validrefreshinterval: CMN.lookup(SYS.xml, SYS.msgs.REFRESHINTERVAL_RANGE)
		}
	});
};

// -------------------------------------------------------------------------------------------
// Refresh Interval must be at least 5 minutes when Internet Time Server is checkmarked.
// -------------------------------------------------------------------------------------------
jQuery.validator.addMethod("validrefreshinterval", function() {
	return !SYS.isInternetTimeServerChecked() || SYS.getRefreshInterval() >= 300000;
});

// -------------------------------------------------------------------------------------------
// Machine name must begin with a character and end with a character or a number.
// -------------------------------------------------------------------------------------------
jQuery.validator.addMethod("validmachinename", function(machinename) {
	var validMachineName = /^[a-zA-Z]{1}[a-zA-Z0-9\-_]{2,13}[^\-_]$/;
	return machinename.replace(validMachineName, "") === "";
});

// -------------------------------------------------------------------------------------------
// Load the 'System Settings' into the page, followed by the 'Datetime Settings'.
// -------------------------------------------------------------------------------------------
CFG.performFunction(function() {
	CMN.loadScript("scripts/tucson/datetimesettings.js", true, {});
	SYS.loadPage();
	SYS.loadData();
	DTS.loadData();
}, CFG.getCaption(CMN.msgs.LOADING));

// -------------------------------------------------------------------------------------------
// Adds the 'Internet Time Server' auto-completion combobox to the page.
// -------------------------------------------------------------------------------------------
$.widget("custom.combobox", {
	_create: function() {
		this.wrapper = $("<span>")
			.addClass("custom-combobox")
			.insertAfter(this.element);
		this.element.hide();
		this._createAutocomplete();
		this._createShowAllButton();
	},
	_createAutocomplete: function() {
		var selected = this.element.children(":selected"),
			value = selected.val() ? selected.text() : "";
		this.input = $("<input>")
			.appendTo(this.wrapper)
			.on("keypress keydown", function(e) {
				if (CMN.processKey(e, "alphanumeric"))
					SYS.enableSaveAndResetButtons(e);
			})
			.on("cut paste", function(e) {
				if (CMN.processCutPaste(e, "alphanumeric"))
					SYS.enableSaveAndResetButtons(e);
			})
			.val(value)
			.attr("title", "")
			.attr("spellcheck", "false")
			.addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
			.autocomplete({
				delay: 0,
				minLength: 0,
				source: $.proxy(this, "_source")
			})
			.tooltip({
				classes: {
					"ui-tooltip": "ui-state-highlight"
				}
			});
		this._on(this.input, {
			autocompleteselect: function(event, ui) {
				ui.item.option.selected = true;
				this._trigger("select", event, {
					item: ui.item.option
				});
				if ($(SYS.xml).find("InternetTimeServer").text() !== ui.item.option.value)
					SYS.enableSaveAndResetButtons({ id: 0 });
			}
		});
	},
	_createShowAllButton: function() {
		var input = this.input,
			wasOpen = false;
		$("<a>")
			.attr("tabIndex", -1)
			.attr("title", "") // "Show All Items"
			.tooltip()
			.appendTo(this.wrapper)
			.button({
				icons: {
					primary: "ui-icon-triangle-1-s"
				},
				text: false
			})
			.removeClass("ui-corner-all")
			.addClass("custom-combobox-toggle ui-corner-right")
			.on("mousedown", function() {
				wasOpen = input.autocomplete("widget").is(":visible");
			})
			.on("click", function() {
				input.trigger("focus");
				// Close if already visible
				if (wasOpen) {
					return;
				}
				// Pass empty string as value to search for, displaying all results
				input.autocomplete("search", "");
			});
	},
	_source: function(request, response) {
		var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
		response(this.element.children("option").map(function() {
			var text = $(this).text();
			if (this.value && (!request.term || matcher.test(text)))
				return {
					label: text,
					value: text,
					option: this
				};
			return {}; // RAS
		}));
	},
	_destroy: function() {
		this.wrapper.remove();
		this.element.show();
	}
});

$("#sys_selInternetTimeServer").combobox();
$("#sys_ui-widget > span.custom-combobox > input.ui-autocomplete-input").attr("id", "sys_cboInternetTimeServer");
$("#sys_cboInternetTimeServer").css("background", "white").css("font-weight", "600").attr("name", "sys_cboInternetTimeServer");

var spinner = $("#sys_txtRefreshInterval").spinner();
$("#sys_txtRefreshInterval").spinner("option", "min", 1);
$("#sys_txtRefreshInterval").spinner("option", "max", 9999);

//# sourceURL=systemsettings.js