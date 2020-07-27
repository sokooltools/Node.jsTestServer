// =======================================================================================================
// memoryinfo.js
// =======================================================================================================
var CFG = window.CFG;
var CMN = window.CMN;

var MEM = MEM || {};
MEM.json = null;
MEM.autoRefreshId = null;
MEM.refreshRate = 0;

// -------------------------------------------------------------------------------------------
// Handles the tab changed event raised whenever this tab is reselected.
// -------------------------------------------------------------------------------------------
$("ul.css-tabs").on("tabChanged", function(e, idx) {
	if (idx === 6)
		MEM.startAutoRefresh();
});

// -------------------------------------------------------------------------------------------
// Handles the onFocus event to start or stop auto-refreshing the memory fields
// -------------------------------------------------------------------------------------------
MEM.onFocus = function() {
	MEM.startAutoRefresh();
};

// -------------------------------------------------------------------------------------------
// Handles the onBlur event to stop auto-refreshing the memory fields.
// -------------------------------------------------------------------------------------------
MEM.onBlur = function() {
	MEM.stopAutoRefresh();
};

// -------------------------------------------------------------------------------------------
// Starts auto-refreshing the memory fields.
// -------------------------------------------------------------------------------------------
MEM.startAutoRefresh = function() {
	if (MEM.autoRefreshId === null && CFG.getCurrentTabId() === "ABT" &&
		$("#abt_lnkMemory").hasClass("abt_lnkExpanded")) {
		CMN.debugLog("MEM.startAutoRefresh");
		window.clearTimeout(MEM.autoRefreshId);
		MEM.loadData();
		var refreshRate = MEM.json.refreshrate;
		if (refreshRate > 1000) {
			MEM.autoRefreshId = window.setInterval(function() {
				if (CFG.getCurrentTabId() === "ABT" && $("#abt_lnkMemory").hasClass("abt_lnkExpanded")) {
					MEM.loadData();
				} else {
					MEM.stopAutoRefresh();
				}
			}, refreshRate);
		} else {
			MEM.stopAutoRefresh();
		}
	}
};

// -------------------------------------------------------------------------------------------
// Stops auto-refreshing the memory fields.
// -------------------------------------------------------------------------------------------
MEM.stopAutoRefresh = function() {
	CMN.debugLog("MEM.stopAutoRefresh");
	window.clearTimeout(MEM.autoRefreshId);
	MEM.autoRefreshId = null;
};

// -------------------------------------------------------------------------------------------
// Loads the 'memoryinfo' object via an AJAX call.
// -------------------------------------------------------------------------------------------
MEM.loadData = function() {
	$.ajax({
		type: "GET",
		url: "/services/network/memoryinfo",
		dataType: "json",
		async: false,
		cache: false,
		success: function(json) {
			MEM.loadFromData(json);
		},
		error: function(jqXHR) {
			if (jqXHR.status === 12029) {
				// A connection to server could not be established.
				MEM.stopAutoRefresh();
			} else {
				CFG.handleError(jqXHR);
			}
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified 'MemoryInfo' json object.
// -------------------------------------------------------------------------------------------
MEM.loadFromData = function(json) {
	CMN.debugLog("Loading memory info into the document...");
	$("#abt_lblMemALLOCATED").text(CMN.numberWithCommas(json.allocated) + " Kb");
	$("#abt_lblMemIN_USE").text(CMN.numberWithCommas(json.inuse) + " Kb");
	$("#abt_lblMemFREE").text(CMN.numberWithCommas(json.free) + " Kb");
	MEM.json = json;
};

// -------------------------------------------------------------------------------------------
// Add the focus and blur events to the document or window object.
// -------------------------------------------------------------------------------------------
// Internet Explorer uses document object.
if (CMN.isIE()) {
	document.onfocusin = MEM.onFocus;
	document.onfocusout = MEM.onBlur;
} else {
	window.onfocus = MEM.onFocus;
	window.onblur = MEM.onBlur;
}

//# sourceURL=memoryinfo.js