// =======================================================================================================
// NetworkSettings.js
// =======================================================================================================
var CFG = window.CFG;
var CMN = window.CMN;
var IPA = window.IPA;

var NET = NET || {};
NET.xml = null;
NET.json = {};
NET.isReconnected = false;

NET.info = {
	oldIpAddress: "",
	newIpAddress: "",
	isNewIpForLogin: false,
	isChangedToDynamic: false,
	isChangedToStatic: false,
	showConfirmTime: CMN.dateToMilliseconds()
};

NET.msgs = {
	ADAPTER_CHANGE: 1,
	ATTEMPTING_RECONNECT: 2,
	CHANGES_TO_TAKE_EFFECT: 3,
	CONN_CHANGING_FROM: 4,
	COULD_NOT_RECONNECT: 5,
	IPADDRESS_MUST_CONTAIN_IPADDRESS: 8,
	IPADDRESS_MUST_CONTAIN_SUBNETMASK: 9,
	IPADDRESS_EMPTY_OR_CONTAIN_DEFAULTGATEWAY: 10,
	IPADDRESS_EMPTY_OR_CONTAIN_PRIMARYDNS: 11,
	IPADDRESS_EMPTY_OR_CONTAIN_SECONDARYDNS: 12,
	IPADDRESS_EMPTY_OR_CONTAIN_PRIMARYWINS: 13,
	IPADDRESS_EMPTY_OR_CONTAIN_SECONDARYWINS: 14,
	IPADDRESS_CHANGE_REBOOT_CONFIRMATION: 15
};

// -------------------------------------------------------------------------------------------
// Execute these methods after the document has been loaded.
// -------------------------------------------------------------------------------------------
$(document).ready(function() {
	// -------------------------------------------------------------------------------------------
	// Load values into the 'Network Adapter' combobox.
	// -------------------------------------------------------------------------------------------
	NET.loadNetworkAdapterCombo();

	// -------------------------------------------------------------------------------------------
	// Load 'Network Settings' values into the page.
	// -------------------------------------------------------------------------------------------
	window.setTimeout(function() {
		// IP Address input box functionality must be added before loading data!
		$(".ipv4mask").ipInitialize();
		NET.loadPage(0);
	}, 100);
});

// -------------------------------------------------------------------------------------------
// Subscribe to the Validate IP Address event of the IP Address control.
// -------------------------------------------------------------------------------------------
$(".ipv4mask").bind("validateIpAddress", function() {
	NET.validateIpAddress($(this));
});

// -------------------------------------------------------------------------------------------
// Subscribe to  the value changed event of the IP Address control.
// -------------------------------------------------------------------------------------------
$(".ipv4mask").bind("valuechanged", function() {
	NET.enableSaveAndResetButtons();
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Network Adapters' combobox value is changed.
// -------------------------------------------------------------------------------------------
$("select#net_cboNetworkAdapters").change(function() {
	var self = $(this);
	if ($("#net_btnSave").is(":enabled")) {
		var msg = CMN.lookup(NET.xml, NET.msgs.ADAPTER_CHANGE);
		var title = $("#net_lblNetworkSettings").text();
		var btn1 = CMN.lookup(CFG.xml, CMN.msgs.DIALOG_OK);
		var btn2 = CMN.lookup(CFG.xml, CMN.msgs.DIALOG_CANCEL);
		CMN.showConfirm(msg, title, CMN.icons.EXCLAMATION, btn1, btn2).then(function(answer) {
			if (answer.toString() === btn1) {
				NET.loadData();
				self.data("current", self.val());
			} else {  // === btn2 or ''
				self.val(self.data("current"));
			}
		});
	} else {
		self.data("current", self.val());
		NET.loadData();
	}
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when either the 'Dynamic' or 'Static' radio button is clicked.
// -------------------------------------------------------------------------------------------
$("#net_rdoDynamic, #net_rdoStatic").on("click", function() {
	$(this).prop("checked", true);
	NET.enableDisableIpInputs();
	NET.enableSaveAndResetButtons();
	IPA.resetValidation(NET.isStaticChecked());
	return true;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Help' button is clicked.
// -------------------------------------------------------------------------------------------
$("#net_btnHelp").on("click", function() {
	window.open("help/networksettings.htm");
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Save' button is clicked.
// -------------------------------------------------------------------------------------------
$("#net_btnSave, #net_btnSaveD").on("click", function() {
	NET.doSave();
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Refresh' or 'Reset' button is clicked.
// -------------------------------------------------------------------------------------------
$("#net_btnRefresh, #net_btnReset").on("click", function() {
	$("#net_cboNetworkAdapters").focus();
	var msg = $("#net_btnSave").is(":disabled") ? CMN.msgs.REFRESHING : CMN.msgs.RESETTING;
	CFG.performFunction(NET.loadPage, CFG.getCaption(msg));
	return false;
});

// ======================================= Private Functions ===============================================

// -------------------------------------------------------------------------------------------
// Save the Network Settings.
// -------------------------------------------------------------------------------------------
NET.doSave = function() {
	if ($("#net_btnSave").is(":disabled"))
		return;

	if (!$("#frmNetworkSettings").valid()) {
		CFG.showInvalid();
		return;
	}

	CMN.showBusy(CFG.getCaption(CMN.msgs.SAVING));

	CFG.timeoutId = window.setTimeout(function() {
		try {
			// Important!!! The NET.Info values must be set prior to performing the save.
			NET.info.oldIpAddress = NET.json.ipaddress;
			NET.info.newIpAddress = $("#net_txtIPAddress").val();

			// The following test also gets performed server-side before the save actually occurs.
			if (NET.info.oldIpAddress !== NET.info.newIpAddress && NET.isExistingIpAddress()) {
				NET.showExistingIpAddressDialog(NET.info.newIpAddress);
				return;
			}
			// Determine whether the user is attempting to change the IP they used to login or the alternate IP Address.
			NET.info.isNewIpForLogin = (NET.isLoginDhcp() || (NET.isLoginIp() && NET.info.oldIpAddress !== NET.info.newIpAddress));

			// Get an indication as to whether the current 'Mode' was changed by the user.
			NET.info.isChangedToStatic = (NET.json.isdhcp && !$("#net_rdoDynamic").is(":checked"));
			NET.info.isChangedToDynamic = (!NET.json.isdhcp && $("#net_rdoDynamic").is(":checked"));

			// Perform this save asynchronously so as not to tie up the UI thread.
			NET.savePage(true);

			// Wait a bit for the NIC to begin updating itself.
			CFG.timeoutId = window.setTimeout(function() {
				CMN.hideBusy();
				// Confirm the need to reboot when a new IP Address was entered or the 'Mode' was changed.
				if (NET.info.oldIpAddress !== NET.info.newIpAddress || NET.info.isChangedToDynamic || NET.info.isChangedToStatic) {
					NET.confirmReboot();
				}
			}, 2000);
		} catch (err) {
			CFG.handleError(err);
			return;
		}
	}, 500);
};

// -------------------------------------------------------------------------------------------
// Confirms a recommended reboot of the PAC following a change to the Network Settings.
// -------------------------------------------------------------------------------------------
NET.confirmReboot = function() {
	var title = $("#net_lblNetworkSettings").text();
	var msg = CMN.lookup(NET.xml, NET.msgs.IPADDRESS_CHANGE_REBOOT_CONFIRMATION);
	var btn1 = CMN.lookup(CFG.xml, CMN.msgs.DIALOG_YES);
	var btn2 = CMN.lookup(CFG.xml, CMN.msgs.DIALOG_NO);
	NET.info.showConfirmTime = CMN.dateToMilliseconds(); // Capture the time the confirm dialog is first shown.
	CMN.showConfirm(msg, title, CMN.icons.ASTERISK, btn1, btn2).then(function(answer) {
		if (answer.toString() === btn1) {
			CMN.showBusy(CMN.lookup(CFG.xml, CMN.msgs.REBOOTING));
			// Make sure to wait at least 11 seconds before rebooting.
			if (NET.info.isChangedToDynamic) {
				window.setTimeout(function() {
					CFG.doReboot();
				}, NET.getWaitTime(11000));
			} else {
				CFG.doReboot();
			}
		} else {
			NET.reconnect();
		}
	});
};

// -------------------------------------------------------------------------------------------
// Reconnects to the PAC when the user chooses not to reboot following a change to the 
// Network Settings.
// -------------------------------------------------------------------------------------------
NET.reconnect = function() {
	if (NET.info.isNewIpForLogin) {
		CMN.showBusy(String.format(CMN.lookup(NET.xml, NET.msgs.ATTEMPTING_RECONNECT), NET.info.newIpAddress));
		// Wait a few seconds then begin attempting to reconnect to the new local IP Address.
		CFG.timeoutId = window.setTimeout(function() {
			if (CMN.isMockMode()) {
				CMN.hideBusy();
			} else {
				// Delete some cookies.
				CMN.setCookie(document, "key", null, -1);
				CMN.setCookie(document, "selectedtab", null, -1);
				// Try reconnecting.
				NET.isReconnected = false;
				NET.attemptReconnect(1);
			}
		}, NET.getWaitTime(12000));
	} else {
		var sta = $("#net_lblStatic").text();
		var dyn = $("#net_lblDynamic").text();
		if (NET.info.isChangedToDynamic) {
			CMN.showBusy(String.format(CMN.lookup(NET.xml, NET.msgs.CONN_CHANGING_FROM), sta, dyn));
			CFG.timeoutId = window.setTimeout(function() {
				NET.loadPage(10);
			}, NET.getWaitTime(21000));
		} else if (NET.info.isChangedToStatic && NET.info.oldIpAddress === NET.info.newIpAddress) {
			CMN.showBusy(String.format(CMN.lookup(NET.xml, NET.msgs.CONN_CHANGING_FROM), dyn, sta));
			CFG.timeoutId = window.setTimeout(function() {
				NET.isExistingIpAddress(5);
				NET.loadPage(10);
			}, NET.getWaitTime(2000));
		} else {
			CMN.showBusy(CMN.lookup(NET.xml, NET.msgs.CHANGES_TO_TAKE_EFFECT));
			CFG.timeoutId = window.setTimeout(function() {
				NET.isExistingIpAddress(5);
				NET.loadPage(10);
			}, NET.getWaitTime(13000));
		}
	}
};

// -------------------------------------------------------------------------------------------
// Gets the number of milliseconds to wait after adjusting the specified waitTime by the
// time elapsed since the 'Reboot' confirmation dialog was first displayed.
// -------------------------------------------------------------------------------------------
NET.getWaitTime = function(waitTime) {
	var retval = waitTime - (CMN.dateToMilliseconds() - NET.info.showConfirmTime);
	// Return a minimum of 500 milliseconds.
	return (retval < 500) ? 500 : retval;
};

// -------------------------------------------------------------------------------------------
// Attempt to reconnect to the Web Server using the specified IP Address.
// -------------------------------------------------------------------------------------------
NET.attemptReconnect = function(numAttempt) {
	if (!numAttempt) { numAttempt = 1; }
	var portNum = document.location.port === "" ? "" : ":" + document.location.port;
	var urlRoot = document.location.protocol + "//" + NET.info.newIpAddress + portNum;
	var gifPath = urlRoot + "/themes/base/images/ping.png" + CMN.uniqueQueryString();
	var img = new window.Image(); // document.createElement('img');
	img.onload = function() {
		CFG.clearTimeout();
		NET.isReconnected = true;
		jQuery.unblockUI();
		window.location.href = urlRoot + "/loading.htm";
		return false;
	};
	img.onabort = function() {
		CFG.clearTimeout();
		jQuery.unblockUI();
		return false;
	};
	img.onerror = function() {
		CFG.clearTimeout();
		if (!NET.isReconnected) {
			if (numAttempt < 3) {
				// Try it a couple times. (The timeout period for each interval is ~20 seconds.)
				NET.attemptReconnect(++numAttempt);
			} else {
				var msg = String.format(CMN.lookup(NET.xml, NET.msgs.COULD_NOT_RECONNECT), NET.info.newIpAddress, urlRoot);
				jQuery.unblockUI({ onUnblock: function() { CMN.showDialog(msg); } });
			}
		}
		return false;
	};
	img.src = gifPath; // Remember this runs asynchronously!
};

// -------------------------------------------------------------------------------------------
// Enables the 'Save' and 'Reset' buttons and changes the 'Reset' button text to 'Reset'.
// -------------------------------------------------------------------------------------------
NET.enableSaveAndResetButtons = function() {
	$("#net_btnSave").prop("disabled", false);
	$("#net_btnRefresh").addClass("hidden");
	$("#net_btnReset").removeClass("hidden");
};

// -------------------------------------------------------------------------------------------
// Disables the 'Save' button and changes the text of the 'Reset' button to 'Refresh'.
// -------------------------------------------------------------------------------------------
NET.disableSaveAndResetButtons = function() {
	$("#net_btnSave").prop("disabled", true);
	$("#net_btnReset").addClass("hidden");
	$("#net_btnRefresh").removeClass("hidden");
};

// -------------------------------------------------------------------------------------------
// Returns a value indicating whether the address for logging in uses the ip address the user 
// wants to change.
// -------------------------------------------------------------------------------------------
NET.isLoginIp = function() {
	return NET.json.ipaddress === location.hostname;
};

// -------------------------------------------------------------------------------------------
// Returns a value indicating whether the address for logging in uses the machinename and the 
// ip address the user wants to change was generated by DHCP.
// -------------------------------------------------------------------------------------------
NET.isLoginDhcp = function() {
	return NET.json.isdhcp && NET.json.machinename.toUpperCase() === location.hostname.toUpperCase();
};

// -------------------------------------------------------------------------------------------
// Returns a value indicating whether the 'Static' Network Connection checkbox contains a checkmark.
// -------------------------------------------------------------------------------------------
NET.isStaticChecked = function() { return ($("#net_rdoStatic").is(":checked")); };

// -------------------------------------------------------------------------------------------
// Loads the 'Adapter Info' xml object via an AJAX call.
// -------------------------------------------------------------------------------------------
NET.loadNetworkAdapterCombo = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/adapterinfo",
		dataType: "json",
		async: false,
		success: function(data) { // function(data, textStatus, jqXHR)
			NET.loadNetworkAdapterComboFromData(data);
		},
		error: function(jqXHR) { // function(jqXHR, textStatus, thrownError)
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads the data into the 'Adapter Info' combo box using the specified data object.
// -------------------------------------------------------------------------------------------
NET.loadNetworkAdapterComboFromData = function(data) {
	var sel = $("#net_cboNetworkAdapters");
	for (var i in data) {
		sel.append("<option value=\"" + data[i].id + "\">" + data[i].alias + "</option>");
	}
	sel.data("current", sel.val());
};

// ======================================== Network Settings ================================================

// -------------------------------------------------------------------------------------------
// Loads the 'Network Settings' page from an xml object returned via an AJAX call. Optionally 
// reloads the page displaying a banner after waiting the specified number of milliseconds.
// -------------------------------------------------------------------------------------------
NET.loadPage = function(millisecs) {
	if (typeof millisecs === "number") {
		if (millisecs > 0) {
			CFG.timeoutId = window.setTimeout(function() {
				CFG.performFunction(NET.loadPage, CFG.getCaption(CMN.msgs.LOADING));
			}, millisecs);
		} else {
			CFG.performFunction(NET.loadPage, CFG.getCaption(CMN.msgs.LOADING));
		}
		return;
	}
	$.ajax({
		type: "GET",
		url: "/services/network/networksettings?lang=" + CFG.getLanguage(),
		dataType: "xml",
		cache: false,
		async: false,
		success: function(data) { // function(data, textStatus, jqXHR)
			NET.loadPageFromXml(data);
			NET.loadData();
			NET.addValidatorRules();
		},
		error: function(jqXHR) { // function(jqXHR, textStatus, thrownError)
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified 'Network Settings' xml object.
// -------------------------------------------------------------------------------------------
NET.loadPageFromXml = function(xml) {
	NET.xml = xml;
	CFG.setLabelsAndTitles(xml);
};

// -------------------------------------------------------------------------------------------
// Loads the 'Network Data' from a JSON object returned via an AJAX call.
// -------------------------------------------------------------------------------------------
NET.loadData = function() {
	var adapterId = $("select#net_cboNetworkAdapters option:selected").val();
	$.ajax({
		type: "GET",
		url: "/services/network/networkdata/" + adapterId,
		dataType: "json",
		cache: false,
		async: false,
		success: function(json) {
			NET.loadPageData(json);
			NET.enableDisableIpInputs();
			NET.disableSaveAndResetButtons();
			if (NET.$validator) {
				NET.$validator.resetForm();
				IPA.resetValidation(NET.isStaticChecked());
			}
			NET.makeSecure();
			NET.setInitialFocus();
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified json object.
// -------------------------------------------------------------------------------------------
NET.loadPageData = function(json) {
	NET.json = json;
	$("#net_txtMachineName").html(json.machinename); // Counter-intuitively we set the html, not the text.
	$("#net_txtMACAddress").html(json.macaddress);
	if (json.isdhcp === true) {
		$("#net_rdoDynamic").prop("checked", true);
		$("#net_rdoDynamic").prop("disabled", false);
		$("#net_rdoStatic").prop("checked", false);
	} else {
		$("#net_rdoDynamic").prop("checked", false);
		$("#net_rdoStatic").prop("checked", true);
		// Prevent changing from static to dynamic when this is the IP used for logging into the PAC.
		$("#net_rdoDynamic").prop("disabled", (NET.isLoginIp() || NET.isLoginDhcp()));
	}
	$("#net_txt" + "IPAddress").ipAddress(json.ipaddress);
	$("#net_txt" + "SubnetMask").ipAddress(json.subnetmask);
	$("#net_txt" + "DefaultGateway").ipAddress(json.defaultgateway);
};

// -------------------------------------------------------------------------------------------
// Saves the 'Network Data' json object via AJAX call.
// -------------------------------------------------------------------------------------------
NET.savePage = function(isAsync) {
	var json = NET.getJsonFromPage();
	$.ajax({
		type: "PUT",
		url: "/services/network/networkdata",
		dataType: "json",
		headers: {
			'x-auth-token': window.localStorage.accessToken,
			"Content-Type": "application/json"
		},
		global: false,
		async: isAsync || false,
		data: JSON.stringify(json),
		complete: function(jqXHR) {
			if (jqXHR.status === 200) {
				NET.json = json;
				NET.loadData();
			}
		},
		error: function(jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Gets the 'Network Settings' by extracting the respective values from the page and updating the xml file.
// -------------------------------------------------------------------------------------------
NET.getJsonFromPage = function() {
	// Get a clone of the original json object, update its properties, then return it.
	var json = JSON.parse(JSON.stringify(NET.json));
	json.adapterid = parseInt($("select#net_cboNetworkAdapters option:selected").val(), 10);
	json.macaddress = $("#net_txtMACAddress").html();
	json.isdhcp = $("#net_rdoDynamic").is(":checked");
	json.ipaddress = $("#net_txtIPAddress").val();
	json.subnetmask = $("#net_txtSubnetMask").val();
	json.defaultgateway = $("#net_txtDefaultGateway").val();
	return json;
};

// -------------------------------------------------------------------------------------------
// Sets the initial focus.
// -------------------------------------------------------------------------------------------
NET.setInitialFocus = function() {
	$("#net_cboNetworkAdapters").focus();
};

// -------------------------------------------------------------------------------------------
// Shows a dialog indicating the specified IP address already exists on the network.
// -------------------------------------------------------------------------------------------
NET.showExistingIpAddressDialog = function(ipAddress) {
	var msg = "<div class='img_exclamation'></div>";
	msg += "<div id='invalid_text'>The <i>" + CFG.getCurrentTabName();
	msg += "</i> cannot be saved because the specified <b>IP Address</b>: <i>'";
	msg += ((ipAddress) || $("#net_txtIPAddress").ipAddress()) + "'</i> already exists on this network.</div>";
	CMN.showDialog(msg);
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the specified IP address already exists on the network.
// It will make the specified number of attempts waiting approx 1 second in between attempts
// to receive a reply back from the ping request.
// -------------------------------------------------------------------------------------------
NET.isExistingIpAddress = function(attempts) {
	var urlString = "/services/network/isexisting/" + NET.info.newIpAddress;
	if (attempts)
		urlString += "/" + attempts;
	var json = CMN.getJson(urlString);
	return json.isexisting;
};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether the currently selected network adapter is bound to the
// specified ip address.
// -------------------------------------------------------------------------------------------
NET.isCurrentIpAddress = function(ipAddress) {
	var adapterId = $("select#net_cboNetworkAdapters option:selected").val();
	var urlString = "/services/network/iscurrentipaddress/" + adapterId + "/" + ipAddress;
	var json = CMN.getJson(urlString);
	return json.iscurrentipaddress;
};

// -------------------------------------------------------------------------------------------
// Enables or disables the various 'IP Address' input boxes depending on whether the 'Dynamic'
// radio button contains a checkmark.
// -------------------------------------------------------------------------------------------
NET.enableDisableIpInputs = function() {
	if (NET.isStaticChecked()) {
		$("input.ip_octet").prop("disabled", false);
	} else {
		$("input.ip_octet").prop("disabled", true);
	}
};

// -------------------------------------------------------------------------------------------
// Enable or disable controls based on Security Level.
// -------------------------------------------------------------------------------------------
NET.makeSecure = function() {
	var isDisabled = !CMN.isAdminLevel();
	$("#net_rdoDynamic, #net_rdoStatic").prop("disabled", isDisabled || (NET.isStaticChecked() && (NET.isLoginIp() || NET.isLoginDhcp())));
	$("input.ip_octet").prop("disabled", isDisabled || $("#net_rdoDynamic").is(":checked"));
};

// ============================================== VALIDATION CODE ===================================================

// -------------------------------------------------------------------------------------------
// Add default validation to this form.
// -------------------------------------------------------------------------------------------
NET.$container = $("#frmNetworkSettings div.errcontainer");
NET.$validator = $("#frmNetworkSettings").validate(
	{
		// Enables debug mode. If true, the form is not submitted and certain errors are displayed on the console
		// (will check if a window.console property exists).
		// Try to enable when a form is just submitted instead of validation stopping the submit.
		debug: true,
		// Validate the form on submit. Set to false to use only other events for validation.
		onsubmit: false,
		// Class used to create error labels, to look for existing error labels and to add it to invalid elements.
		errorClass: "invalid",
		// Class added to an element after it was validated and considered valid.
		validClass: "valid",
		// Hide and show this container when validating.
		errorContainer: NET.$container,
		// Hide and show this container when validating.
		errorLabelContainer: $("ol", NET.$container),
		// Wrap error labels with the specified element. Useful in combination with errorLabelContainer to create
		// a list of error messages.
		wrapper: "li",
		// Elements to ignore when validating, simply filtering them out. jQuery's not-method is used, therefore
		// everything that is accepted by not() can be passed as this option. Inputs of type submit and reset are
		// always ignored, so are disabled elements.
		ignore: ".ip_octet"
		//,focusCleanup: true
		//,rules: {
		//		txtEmail:  {required: true, email: true},
		//		txtDomain: {domain: true},
		//		txtPhone:  {required: true, number: true,	rangelength: [2, 8]},
		//		filMyfile: {required: true, accept: true},
		//		chkAgree:  {required: true},
		//		txtTotal:  {total: [1, 2]}
		//}
	});

// -------------------------------------------------------------------------------------------
// Add or replace validation rules of items on this page.
// -------------------------------------------------------------------------------------------
NET.addValidatorRules = function() {
	var m1 = CMN.lookup(NET.xml, NET.msgs.IPADDRESS_EMPTY_OR_CONTAIN_DEFAULTGATEWAY);
	var m2 = CMN.lookup(NET.xml, NET.msgs.IPADDRESS_MUST_CONTAIN_SUBNETMASK);
	var m3 = CMN.lookup(NET.xml, NET.msgs.IPADDRESS_MUST_CONTAIN_IPADDRESS);
	var $sel = $("#net_txtIPAddress");
	$sel.rules("remove");
	$sel.rules("add", {
		required: {
			depends: function() { return NET.isStaticChecked(); }
		},
		validip3: true,
		messages: {
			required: m3,
			validip3: m3
		}
	});
	$sel = $("#net_txtSubnetMask");
	$sel.rules("remove");
	$sel.rules("add", {
		required: {
			depends: function() { return NET.isStaticChecked(); }
		},
		validip2: true,
		messages: {
			required: m2,
			validip2: m2
		}
	});
	$sel = $("#net_txtDefaultGateway");
	$sel.rules("remove");
	$sel.rules("add", {
		required: false,
		validip1: true,
		messages: {
			validip1: m1
		}
	});
	//	$sel = $('#net_txtPrimaryDNS');
	//	$sel.rules('remove');
	//	$sel.rules('add', {
	//		required: false,
	//		validip1: true,
	//		messages: {
	//			validip1: CMN.lookup(NET.xml, NET.msgs.IPADDRESS_EMPTY_OR_CONTAIN_PRIMARYDNS)
	//		}
	//	});
	//	$sel = $('#net_txtSecondaryDNS');
	//	$sel.rules('remove');
	//	$sel.rules('add', {
	//		required: false,
	//		validip1: true,
	//		messages: {
	//			validip1: CMN.lookup(NET.xml, NET.msgs.IPADDRESS_EMPTY_OR_CONTAIN_SECONDARYDNS)
	//		}
	//	});
	//	$sel = $('#net_txtPrimaryWINS');
	//	$sel.rules('remove');
	//	$sel.rules('add', {
	//		required: false,
	//		validip1: true,
	//		messages: {
	//			validip1: CMN.lookup(NET.xml, NET.msgs.IPADDRESS_EMPTY_OR_CONTAIN_PRIMARYWINS)
	//		}
	//	});
	//	$sel = $('#net_txtSecondaryWINS');
	//	$sel.rules('remove');
	//	$sel.rules('add', {
	//		required: false,
	//		validip1: true,
	//		messages: {
	//			validip1: CMN.lookup(NET.xml, NET.msgs.IPADDRESS_EMPTY_OR_CONTAIN_SECONDARYWINS)
	//		}
	//	});
};

// -------------------------------------------------------------------------------------------
//  Perform validation by outlining the associated 'div' according to validation rules.
// -------------------------------------------------------------------------------------------
NET.validateIpAddress = function(inputBox) {
	switch (inputBox[0].id) {
		case "net_txtIPAddress":
			inputBox.ipIsNotBlank();
			inputBox.ipIsValid(1);
			break;
		case "net_txtSubnetMask":
			inputBox.ipIsNotBlank();
			inputBox.ipIsValid(2);
			break;
		case "net_txtDefaultGateway":
			inputBox.ipIsValid(1);
			break;
		//		case 'net_txtPrimaryDNS':                                        
		//		case 'net_txtSecondaryDNS':                                        
		//		case 'net_txtPrimaryWINS':                                        
		//		case 'net_txtSecondaryWINS':                                        
		//			inputBox.ipIsValid(1);                                        
		//			break;                                        
	}
	// Show or hide error message when necessary.
	NET.$validator.element(inputBox);
};

//	jQuery.validator.addMethod('total', function(value, element, params) {
//		return this.optional(element) || value == params[0] + params[1];
//	}, jQuery.format('Please enter the correct value for {0} + {1}'));

//	jQuery.validator.addMethod('domain', function(value, element) {
//		return this.optional(element) || /^http:\/\/parker.com/.test(value);
//	}, 'Please specify the correct domain for your documents');

//// -------------------------------------------------------------------------------------------
//// For demo purposes
//// -------------------------------------------------------------------------------------------
//$.validator.setDefaults({
//	debug: true,
//	submitHandler: function() {
//		// _TODO: Handle 'save' versus 'reset'
//		if (this.successList.length == 0)
//			alert('Cancelled.');
//		else
//			alert('Submitted.');
//	}
//});

//# sourceURL=networksettings.js