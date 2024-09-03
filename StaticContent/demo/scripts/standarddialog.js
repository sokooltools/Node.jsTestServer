window.DEMO.loadCommon();

// Hook the click event on document ready.
$("#run").on("click", function () {
	ShowErrorDialog();
	return false;
});

// Make sure the dialog div is hidden:
$("#testdlg1").hide();
$("#testdlg2").hide();

function ShowErrorDialog() {
	$("#testdlg1").dialog({
		autoOpen: true,
		resizable: false,
		modal: true,
		width: 400,
		open: function () {
			const ipAddress = "192.168.10.50";
			const urlRoot = `http://${ipAddress}`;
			const msg = `Could not reconnect to IP Address: <b>${ipAddress}</b></br></br>After closing this dialog, 
                        try typing the following directly into</br>this browser's address bar: <b>${urlRoot}</b> ...`;
			$(this).html(msg);
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
				ShowDialog2(`Hello from '${window.location.href}'!`);
			},
			Cancel: function () {
				$(this).dialog("close");
			}
		}
	});
}
function ShowDialog2(msg){
	$("#testdlg2").dialog({
		autoOpen: true,
		resizable: false,
		modal: true,
		width: 400,
		open: function () {
			$(this).html(msg);
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");			
			}
		}
	});
}