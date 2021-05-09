// =======================================================================================================
// DateTimeSettings.js
// =======================================================================================================
var CFG = window.CFG;
var CMN = window.CMN;
var SYS = window.SYS;

var DTS = DTS || {};
DTS.xml = null;
DTS.json = null;

DTS.autoRefreshId = null;
DTS.isLoading = false;
DTS.skipBlur = false;
DTS.skipFocus = false;
DTS.isAdminLevel = CMN.isAdminLevel();
DTS.cnt = 0;

DTS.dtpicker = $("#datetimepicker");

// -------------------------------------------------------------------------------------------
// Provides an enumeration for units of time. (index is 1 based!)
// -------------------------------------------------------------------------------------------
DTS.RefreshUnits = {
	Seconds: 1,
	Minutes: 2,
	Hours: 3,
	Days: 4,
	Weeks: 5
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether 'Synch With My Clock' checkbox contains a checkmark.
// -------------------------------------------------------------------------------------------
DTS.isSyncWithMyClock = function () {
	return $("#sys_chkIsSyncWithMyClock").is(":checked");
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether 'Synch With Internet' checkbox contains a checkmark.
// -------------------------------------------------------------------------------------------
DTS.isSyncWithInternet = function () {
	return $("#sys_chkIsSyncWithInternet").is(":checked");
};

// -------------------------------------------------------------------------------------------
// Class used for constructing the object returned from the MillisecondsToTime function.
// -------------------------------------------------------------------------------------------
DTS.TimeObject = function (t, u) {
	this.timeValue = t;
	this.units = u;
};

DTS.init = function () {
	// -------------------------------------------------------------------------------------------
	// Initialize the datetimepicker control.
	// http://trentrichardson.com/examples/timepicker/
	// -------------------------------------------------------------------------------------------
	DTS.dtpicker.datetimepicker({
		dateFormat: SYS.getDateFormat(),
		timeFormat: SYS.getTimeFormat(),
		//pickerTimeFormat: SYS.getTimeFormat(),
		buttonImage: "grid/images/calendar.gif",
		buttonImageOnly: true,
		currentText: "Now",
		closeText: "Done",
		//controlType: "select",
		//minDate: 0,
		parse: "loose",
		showButtonPanel: true,
		showTimezone: false,
		showMillisec: false,
		showMicrosec: false,
		showOn: "button",
		timezone: null,
		onSelect: function () {
			SYS.enableSaveAndResetButtons(this);
		},
		beforeShow: function () {
			DTS.skipFocus = true;
			DTS.stopAutoRefresh();
		},
		onClose: function () {
			DTS.skipBlur = true;
			DTS.startAutoRefresh();
		}
	});
};

// -------------------------------------------------------------------------------------------
// Handles the tab changed event raised whenever this tab is reselected.
// -------------------------------------------------------------------------------------------
$("ul.css-tabs").on("tabChanged", function (e, idx) {
	//CMN.debugLog("DTS.tabChanged");
	if (idx === 2) {
		DTS.startAutoRefresh();
	} else {
		DTS.stopAutoRefresh();
	}
});

// -------------------------------------------------------------------------------------------
// Handles the event raised whenever the "Machine Time Zone" combobox value is changed by the
// user manually selecting a new value.
// -------------------------------------------------------------------------------------------
$("select#sys_cboMachineTimeZone").change(function () {
	DTS.showOrHideIsAutoDst();
	DTS.enableDatetimePicker(true);
	SYS.enableSaveAndResetButtons(this);
});

// -------------------------------------------------------------------------------------------
// Make the date/time picker textbox is read-only.
// -------------------------------------------------------------------------------------------
DTS.dtpicker.prop("readOnly", true);

// -------------------------------------------------------------------------------------------
// Bind the keypress and keydown events for all but the TAB and ENTER keys.
// -------------------------------------------------------------------------------------------
DTS.dtpicker.bind("keypress keydown", function (e) {
	if (e.keyCode !== 9 && e.keyCode !== 13) {
		e.preventDefault();
		e.stopImmediatePropagation();
		return false;
	}
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the onFocus event to start or stop auto refresh depending on certain criteria.
// -------------------------------------------------------------------------------------------
DTS.onFocus = function () {
	if (DTS.skipFocus) {
		DTS.skipFocus = false;
		return;
	}
	CMN.debugLog("DTS.onFocus");
	if (!DTS.dtpicker.datepicker("widget").is(":visible"))
		DTS.startAutoRefresh();
};

// -------------------------------------------------------------------------------------------
// Handles the onBlur event to stop auto refresh.
// -------------------------------------------------------------------------------------------
DTS.onBlur = function () {
	if (DTS.skipBlur) {
		DTS.skipBlur = false;
		return;
	}
	CMN.debugLog("DTS.onBlur");
	DTS.stopAutoRefresh();
};

// -------------------------------------------------------------------------------------------
// Starts auto refreshing the datepicker control using the latest datetime from either the
// local clock or server clock.
// -------------------------------------------------------------------------------------------
DTS.startAutoRefresh = function () {
	if (CFG.getCurrentTabId() !== "SYS")
		return;
	DTS.cnt = 0;
	CMN.debugLog("DTS.startAutoRefresh");
	window.clearTimeout(DTS.autoRefreshId);
	DTS.autoRefreshId = window.setInterval(function () {
		if (DTS.isSyncWithMyClock()) {
			DTS.dtpicker.datetimepicker("setDate", new Date());
		} else if (!(SYS.isSaveEnabled || DTS.isLoading)) {
			// Sync time with the server only once every 30 seconds.
			if (--DTS.cnt > 0) {
				var dt = CMN.millisecondsToDate(Date.parse(DTS.dtpicker.datetimepicker("getDate")) + 1000);
				DTS.dtpicker.datetimepicker("setDate", dt);
			} else {
				DTS.loadData(true);
				DTS.cnt = 30;
			}
		}
	}, 1000);
};

// -------------------------------------------------------------------------------------------
// Stops auto refreshing the datepicker control.
// -------------------------------------------------------------------------------------------
DTS.stopAutoRefresh = function () {
	CMN.debugLog("DTS.stopAutoRefresh");
	window.clearTimeout(DTS.autoRefreshId);
	DTS.autoRefreshId = null;
};

// -------------------------------------------------------------------------------------------
// Loads the "Date Time" json object via an AJAX call.
// -------------------------------------------------------------------------------------------
DTS.loadData = function (isDateTimeOnly) {
	DTS.isLoading = true;
	$.ajax({
		type: "GET",
		url: "/services/network/datetimesettings",
		dataType: "json",
		async: false,
		cache: false,
		success: function (json) {
			DTS.loadFromJson(json, isDateTimeOnly);
		},
		error: function (jqXHR) {
			if (jqXHR.status === 12029) {
				// A connection to server could not be established
				DTS.stopAutoRefresh();
			} else {
				CFG.handleError(jqXHR);
			}
		}
	});
	DTS.isLoading = false;
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified "Date Time" json object.
// -------------------------------------------------------------------------------------------
DTS.loadFromJson = function (json, isDateTimeOnly) {
	// The MachineDateTime (in milliseconds UTC) needs to be converted to a localized date.
	var dt = CMN.millisecondsUtcToDate(json.machinedatetime);
	// Put it into the control.
	DTS.dtpicker.datetimepicker("setDate", dt);
	// Hold onto the json.
	DTS.json = json;
	if (!isDateTimeOnly) {
		$("#sys_cboMachineTimeZone").prop("selectedIndex", parseInt(json.machinetimezone, 10));
		$("#sys_chkIsAutoDst").prop("checked", json.isautodst !== "0");
		DTS.showOrHideIsAutoDst();
		DTS.startAutoRefresh();
		SYS.setInitialFocus();
	}
};

// -------------------------------------------------------------------------------------------
// Saves the "Date Time" json object.
// -------------------------------------------------------------------------------------------
DTS.saveData = function () {
	var json = DTS.getJsonFromPage();
	if (CMN.compare(json, DTS.json))
		return;
	$.ajax({
		type: "PUT",
		url: "/services/network/datetimedata",
		dataType: "json",
		headers: {
			'x-auth-token': window.localStorage.accessToken,
			"Content-Type": "application/json"
		},
		global: false,
		async: false,
		data: JSON.stringify(json),
		complete: function (jqXHR) {
			if (jqXHR.status === 200) {
				if (DTS.isSyncWithInternet()) {
					DTS.doSynchNow();
				} else {
					DTS.loadData();
					DTS.startAutoRefresh();
				}
			}
		},
		error: function (jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Gets the current "Date Time" json string by extracting the values from the page.
// -------------------------------------------------------------------------------------------
DTS.getJsonFromPage = function () {
	// Get the milliseconds UTC since Jan 1, 1970.
	var mdt;
	if (DTS.isSyncWithMyClock()) {
		mdt = DTS.getSyncDateTime();
	} else {
		var dt = DTS.dtpicker.datetimepicker("getDate");
		mdt = CMN.dateToMillisecondsUtc(dt);
	}
	var mtz = document.getElementById("sys_cboMachineTimeZone").selectedIndex;
	var dst = $("#sys_chkIsAutoDst").is(":checked") ? 1 : 0;
	var json = {
		machinedatetime: mdt,
		machinetimezone: mtz,
		isautodst: dst
	};
	return json;
};

// -------------------------------------------------------------------------------------------
// Gets the datetime in milliseconds adjusted for a change in the "Machine Time Zone".
// -------------------------------------------------------------------------------------------
DTS.getSyncDateTime = function () {
	var idx1 = DTS.json.machinetimezone;
	if (idx1 == -1) // Handle situation where the timezone returned from the server was unknown.
		return CMN.dateToMillisecondsUtc(); 
	var sOrg = document.getElementById("sys_cboMachineTimeZone")[idx1].value; // e.g. Eastern Time = "-300,1"
	var iOrg = parseInt(sOrg.split(",")[0], 10); // e.g. Eastern Time = -300
	var sNew = document.getElementById("sys_cboMachineTimeZone").value;
	var iNew = parseInt(sNew.split(",")[0], 10);
	var offset = (Math.max(iOrg, iNew) - Math.min(iOrg, iNew)) * 60 * 1000 * (iOrg < iNew ? -1 : 1);
	var newDt = CMN.dateToMillisecondsUtc() + offset;
	return newDt;
};

// -------------------------------------------------------------------------------------------
// Loads the "TimeZone list" josn object via an AJAX call.
// -------------------------------------------------------------------------------------------
DTS.loadTimeZoneListCombobox = function () {
	$.ajax({
		type: "GET",
		url: "/services/network/timezonelist?lang=" + CFG.getLanguage(),
		dataType: "json",
		async: false,
		success: function (json) {
			DTS.loadTimeZoneListComboboxFromData(json);
		},
		error: function (jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads the values into the "Time Zone List" combobox using the specified json data object.
// -------------------------------------------------------------------------------------------
DTS.loadTimeZoneListComboboxFromData = function (json) {
	var sel = $("#sys_cboMachineTimeZone");
	for (var i in json) {
		sel.append("<option value=\"" + json[i].offset + "," + json[i].dst + "\">" + json[i].displayname + "</option>");
	}
};

// -------------------------------------------------------------------------------------------
// Loads the "Internet Time Server" using a json data object obtained via an AJAX call.
// -------------------------------------------------------------------------------------------
DTS.loadInternetTimeServerCombobox = function () {
	$.ajax({
		type: "GET",
		url: "/services/network/internettimeservers",
		dataType: "json",
		async: false,
		success: function (json) {
			DTS.loadInternetTimeServerComboboxFromData(json);
		},
		error: function (jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads the values into the "Time Zone List" combobox using the specified json object.
// -------------------------------------------------------------------------------------------
DTS.loadInternetTimeServerComboboxFromData = function (json) {
	var sel = $("#sys_selInternetTimeServer");
	for (var i in json) {
		sel.append("<option value=\"" + json[i].displayname + "\">" + json[i].displayname + "</option>");
	}
};

// -------------------------------------------------------------------------------------------
// Loads the "Refresh Units" xml object via an AJAX call.
// -------------------------------------------------------------------------------------------
DTS.loadRefreshUnitsCombobox = function () {
	$.ajax({
		type: "GET",
		url: "/services/network/refreshunits?lang=" + CFG.getLanguage(),
		dataType: "xml",
		async: false,
		success: function (xml) {
			DTS.loadRefreshUnitsComboboxFromData(xml);
		},
		error: function (jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into the "Refresh Units" combo box using the specified xml object.
// -------------------------------------------------------------------------------------------
DTS.loadRefreshUnitsComboboxFromData = function (xml) {
	var sel = $("#sys_cboRefreshUnits");
	$(xml).find("RefreshUnits").find("RefreshUnit").each(function () {
		sel.append("<option value=\"" + $(this).attr("Index") + "\">" + $(this).attr("DisplayName") + "</option>");
	});
};

// -------------------------------------------------------------------------------------------
// Synchronize the "Machine Date Time" with the clock on this PC.
// -------------------------------------------------------------------------------------------
DTS.syncWithMyClock = function (sender) {
	if (sender.checked) {
		$("#sys_chkIsSyncWithInternet").prop("checked", false);
		$("#sys_cboMachineTimeZone").prop("selectedIndex", DTS.getBrowserTimeZoneIndex());
		DTS.showOrHideIsAutoDst();
		$("#sys_grpSyncWithInternet").css("display", "none");
	}
	DTS.enableMachineTimeZone(!sender.checked || DTS.isSyncWithInternet());
	DTS.enableDatetimePicker();
	SYS.enableSaveAndResetButtons(sender);
	DTS.startAutoRefresh();
	$("#sys_btnSave").focus();
	return true;
};

// -------------------------------------------------------------------------------------------
// Sets controls on the page to indicate synchronization of the "Date Time" on the PAC with an 
// 'Internet Time Server'.
// -------------------------------------------------------------------------------------------
DTS.syncWithInternet = function (sender) {
	DTS.enableMachineTimeZone(true);
	DTS.enableDatetimePicker();
	SYS.enableSaveAndResetButtons(sender);
	DTS.startAutoRefresh();
	$("#sys_btnSave").focus();
	return true;
};

// -------------------------------------------------------------------------------------------
// Synchronize the "Date Time" on the PAC with an 'Internet Time Server' via an Ajax call.
// -------------------------------------------------------------------------------------------
DTS.doSynchNow = function () {
	var retval = false;
	$("#sys_btnSyncNow").blur();
	CMN.showBusy("Synchronizing <b>'Machine Date Time'</b>... Please wait.");
	$.ajax({
		type: "PUT",
		url: "/services/network/synchnow",
		dataType: "json",
		headers: {
			'x-auth-token': window.localStorage.accessToken,
			"Content-Type": "application/json"
		},
		global: false,
		async: false,
		cache: false,
		data: null,
		complete: function (jqXHR) {
			if (jqXHR.status === 200) {
				DTS.loadData(true);
				DTS.startAutoRefresh();
				retval = true;
			}
		},
		error: function () {}
	});
	CMN.hideBusy();
	return retval;
};

// -------------------------------------------------------------------------------------------
// Enables or disables the "Machine Time Zone".
// -------------------------------------------------------------------------------------------
DTS.enableMachineTimeZone = function (isEnabled) {
	var isAdminLevel = CMN.isAdminLevel();
	var isDisabled = !isAdminLevel || !isEnabled;
	$("#sys_cboMachineTimeZone").prop("disabled", isDisabled);
	if (isDisabled)
		$("#sys_cboMachineTimeZone").css("background-color", "white").css("border", "#707070 thin solid");
	if (!isAdminLevel)
		$("#sys_chkIsAutoDst").prop("disabled", true);
};

// -------------------------------------------------------------------------------------------
// Enables or disables the date time picker control based on whether the specified argument
// is true or false.
// -------------------------------------------------------------------------------------------
DTS.enableDatetimePicker = function (isEnabled) {
	var isAdminLevel = CMN.isAdminLevel();
	if (!isEnabled)
		isEnabled = !$("#sys_chkIsSyncWithMyClock").prop("checked") &&
		!$("#sys_chkIsSyncWithInternet").prop("checked");
	$(".ui-datepicker-trigger").prop("disabled", !isAdminLevel || !isEnabled);
	$("#datetimepicker").datepicker("option", "disabled", !isAdminLevel || !isEnabled);
	DTS.dtpicker.prop("disabled", true).css("background-color", "white").css("border", "#707070 thin solid");
};

// -------------------------------------------------------------------------------------------
// Shows or hides the "Auto adjust clock for Daylight Saving Time" checkbox depending on what
// the current Time Zone is set to.
// -------------------------------------------------------------------------------------------
DTS.showOrHideIsAutoDst = function () {
	var isDstPossible = (parseInt(document.getElementById("sys_cboMachineTimeZone").value.slice(-1), 10) === 1);
	if (isDstPossible) {
		$("#sys_chkIsAutoDst, #sys_lblIsAutoDst").show();
	} else {
		$("#sys_chkIsAutoDst, #sys_lblIsAutoDst").hide();
	}
};

// -------------------------------------------------------------------------------------------
// Gets the time in milliseconds from the ui elment containing a value with a unit of time.
// -------------------------------------------------------------------------------------------
DTS.timeToMilliseconds = function (time, units) {
	if (units === DTS.RefreshUnits.Seconds)
		return time * 1000;
	if (units === DTS.RefreshUnits.Minutes)
		return time * 1000 * 60;
	if (units === DTS.RefreshUnits.Hours)
		return time * 1000 * 60 * 60;
	if (units === DTS.RefreshUnits.Days)
		return time * 1000 * 60 * 60 * 24;
	if (units === DTS.RefreshUnits.Weeks)
		return time * 1000 * 60 * 60 * 24 * 7;
	return time;
};

// -------------------------------------------------------------------------------------------
// Returns a TimeObject converted from the specified milliseconds.
// -------------------------------------------------------------------------------------------
DTS.millisecondsToTime = function (milliseconds) {
	if (milliseconds % (1000 * 60 * 60 * 24 * 7) === 0) {
		milliseconds = milliseconds / (1000 * 60 * 60 * 24 * 7);
		return new DTS.TimeObject(milliseconds, DTS.RefreshUnits.Weeks);
	}
	if (milliseconds % (1000 * 60 * 60 * 24) === 0) {
		milliseconds = milliseconds / (1000 * 60 * 60 * 24);
		return new DTS.TimeObject(milliseconds, DTS.RefreshUnits.Days);
	}
	if (milliseconds % (1000 * 60 * 60) === 0) {
		milliseconds = milliseconds / (1000 * 60 * 60);
		return new DTS.TimeObject(milliseconds, DTS.RefreshUnits.Hours);
	}
	if (milliseconds % (1000 * 60) === 0) {
		milliseconds = milliseconds / (1000 * 60);
		return new DTS.TimeObject(milliseconds, DTS.RefreshUnits.Minutes);
	}
	if (milliseconds % 1000 === 0) {
		milliseconds = milliseconds / 1000;
		return new DTS.TimeObject(milliseconds, DTS.RefreshUnits.Seconds);
	}
	return new DTS.TimeObject(milliseconds, DTS.RefreshUnits.Milliseconds);
};

// -------------------------------------------------------------------------------------------
// Gets the index in the combobox corresponding to the browser"s own timezone.
// -------------------------------------------------------------------------------------------
DTS.getBrowserTimeZoneIndex = function () {
	var rightNow = new Date();
	// Jan 1st
	var jan1 = new Date(rightNow.getFullYear(), 0, 1, 0, 0, 0, 0);
	// June 1st
	var june1 = new Date(rightNow.getFullYear(), 6, 1, 0, 0, 0, 0);
	var temp = jan1.toGMTString();
	var jan2 = new Date(temp.substring(0, temp.lastIndexOf(" ") - 1));
	temp = june1.toGMTString();
	var june2 = new Date(temp.substring(0, temp.lastIndexOf(" ") - 1));
	var stdTimeOffset = (jan1 - jan2) / (1000 * 60);
	var daylightTimeOffset = (june1 - june2) / (1000 * 60);
	var dst;
	if (stdTimeOffset === daylightTimeOffset) {
		// Daylight savings time is NOT observed.
		dst = "0";
	} else {
		// Daylight savings time is observed.
		dst = "1";
		// Positive is southern, negative is northern hemisphere.
		var hemisphere = stdTimeOffset - daylightTimeOffset;
		if (hemisphere >= 0)
			stdTimeOffset = daylightTimeOffset;
	}
	var sel = document.getElementById("sys_cboMachineTimeZone");
	if (sel) {
		var i;
		var key = stdTimeOffset + "," + dst;
		for (i = 0; i < sel.options.length; i++) {
			if (sel.options[i].value === key) {
				return i;
			}
		}
	}
	return -1;
};

// -------------------------------------------------------------------------------------------
// Add the focus and blur events to the document or window object.
// -------------------------------------------------------------------------------------------
// Internet Explorer uses the 'document' object.
if (CMN.isIE()) {
	document.onfocusin = DTS.onFocus;
	document.onfocusout = DTS.onBlur;
} else {
	window.onfocus = DTS.onFocus;
	window.onblur = DTS.onBlur;
}

// Load the comboboxes with data.
DTS.loadTimeZoneListCombobox();
DTS.loadInternetTimeServerCombobox();
DTS.loadRefreshUnitsCombobox();

//	,timezoneList: [
//			{ value: -300, label: "Eastern" },
//			{ value: -360, label: "Central" },
//			{ value: -420, label: "Mountain" },
//			{ value: -480, label: "Pacific" }
//		],
//	onClose: function(dateText, instance) {
//		CMN.debugLog(dateText + instance);
//	},
//	beforeShow: function(input) {
//		window.setTimeout(function() {
//			var buttonPane = $(input).datepicker("widget").find(".ui-datepicker-buttonpane");
//			$("<button>", {
//				text: "Apply",
//				click: function() {
//					// Code to clear your date field (text box, read only field etc.)
//					// Had to remove the line below and add custom code here
//					//$.datepicker._clearDate(input);
//					//$.datepicker._setDateDatepicker(input, new Date());
//				}
//			}).appendTo(buttonPane).addClass("ui-datepicker-clear ui-state-default ui-priority-primary ui-corner-all");
//		}, 1);
//	},
//	onChangeMonthYear: function(year, month, instance) {
//		window.setTimeout(function() {
//			var buttonPane = $(instance).datepicker("widget").find(".ui-datepicker-buttonpane");
//			$("<button>", {
//				text: "Apply",
//				click: function() {
//					// Code to clear the date field (text box, read only field etc.)
//					// Had to remove the line below and add custom code here
//					$.datepicker._clearDate(instance.input);
//				}
//			}).appendTo(buttonPane).addClass("ui-datepicker-clear ui-state-default ui-priority-primary ui-corner-all");
//		}, 1);
//	},

//# sourceURL=datetimesettings.js