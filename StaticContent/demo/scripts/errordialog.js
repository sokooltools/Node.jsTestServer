// ====================================================================================================
// errordialog.js
// ====================================================================================================

window.DEMO.loadCommon();

$("#run").on("click", function () {
	const fName = `${window.DEMO.getPathRoot()}/demo/data/ErrorDialog.txt`;
	ShowInDialog(fName, "Padarn Server Error");
	return;
});

function ShowInDialog(filename, title) {
	$("<div>").dialog({
		modal: true,
		dialogClass: "alert",
		open: function () {
			$(this).load(filename);
		},
		close: function () {
			$(this).dialog("close");
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
			},
		},
		hide: true,
		width: 600,
		height: 400,
		title: title,
	});
}
