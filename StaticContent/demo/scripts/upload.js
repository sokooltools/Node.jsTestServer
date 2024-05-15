
window.DEMO.loadCommon();

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'File to Upload' input box value changes.
// (Used for enabling the 'Upload' button).
// -------------------------------------------------------------------------------------------
$("#demo_inputFile").on("change", function () {
	window.setTimeout(function () {
		$("#demo_btnUpload").prop("disabled", ($("#demo_inputFile").val() === ""));
	}, 10);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the form is submitted by clicking the 'Send' button.
// (NOTE: The nodeJs file 'upload.js' is called upon to actually perform the upload since
// AJAX methods to upload files do not work with browsers prior to IE 10!)
// -------------------------------------------------------------------------------------------
$("#demo_frmUpload").submit(function (e) {
	const theFile = $("#demo_inputFile").val();
	if (theFile.length > 0) {
		//window.DEMO.setCookie(document, "upload", "", 1);
		e.target.submit();
	}
	return false;
});

//window.setTimeout(function() {
//	//var theFile = window.DEMO.getCookie(document, "upload", "");
//	if(theFile) {
//		if(DEMO.getQueryStringByName("uploaded") === "true") {
//			alert("Uploaded: '" + theFile + "'.");
//			//window.DEMO.setCookie(document, "upload", "", 1);
//		}
//		theFile = null;
//	}
//}, 10);
