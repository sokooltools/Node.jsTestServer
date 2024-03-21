// ====================================================================================================
// datetimepicker.js
// ====================================================================================================
window.DEMO.loadCommon();

var dtp = $("#utility_example_1");

dtp.datetimepicker({
	//controlType: "select",
	dateFormat: "mm/dd/yy",
	timeFormat: "hh:mm:ss TT",
	separator: " @ ",
	showTimezone: false,
	timezone: null,
});

$("#utility_example_1_setdt").on("click", function () {
	const dt = millisecondsToDate(dateToMilliseconds());
	dtp.datetimepicker("setDate", dt);
});

$("#utility_example_1_getdt").on("click", function () {
	const dt = dtp.datetimepicker("getDate");
	const msg = `</br><span style='font-size:14pt;'>DateTime: <b>${dt}</b></span>`;
	window.CMN.showDialog(msg, document.title);
});

// -------------------------------------------------------------------------------------------
// Returns a date converted from the specified number of milliseconds since midnight 01-01-1970.
// -------------------------------------------------------------------------------------------
millisecondsToDate = function (milliseconds) {
	return new Date(parseFloat(milliseconds));
};

// -------------------------------------------------------------------------------------------
// Returns the number of milliseconds between the specified date and midnight 01-01-1970.
// The current date and time is used when no date is specified.
// -------------------------------------------------------------------------------------------
dateToMilliseconds = function (dt) {
	return Date.parse(!dt ? new Date() : dt);
};
