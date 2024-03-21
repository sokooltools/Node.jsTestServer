window.DEMO.loadCommon();

// Hook the click event on document ready.
$("#run").on("click", function () {
	ShowErrorDialog();
	return false;
});

// Make sure the dialog div is hidden:
$("#testdlg").hide();

function ShowErrorDialog() {
	// Select the dialog div and show it as a jQuery dialog
	$("#testdlg").dialog({
		autoOpen: true,
		resizable: false,
		modal: true,
		width: 400,
		open: function () {
			const ipAddress = "192.168.10.50";
			const urlRoot = `http://${ipAddress}`;
			const msg = `Could not reconnect to IP Address: <b>${ipAddress}</b></br></br>After closing this dialog, 
                        try typing the following directly into</br>this browser's address bar: <b>${urlRoot}</b> ...`;
			jQuery(this).html(msg);
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
				window.alert(`Hello from '${window.location.href}'!`);
			},
			Cancel: function () {
				$(this).dialog("close");
			},
		},
	});
}
