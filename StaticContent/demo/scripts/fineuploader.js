var uploader;
createUploader = (function () {
	uploader = new window.qq.FineUploader({
		// Log messages are written to the window.console when true.
		debug: true,
		element: $("#fine-uploader-manual-trigger")[0],
		autoUpload: false,
		template: "qq-template-manual-trigger",
		request: {
			// The endpoint (route) to send upload requests to.
			endpoint: "/fineupload",
		},
		deleteFile: {
			enabled: false,
			endpoint: "/fineupload",
		},
		thumbnails: {
			placeholders: {
				waitingPath: "../themes/fine-uploader/waiting-generic.png",
				notAvailablePath: "../themes/fine-uploader/not_available-generic.png",
			},
		},
		retry: {
			// Enable or disable retrying uploads that receive any error response. (defaults to false)
			enableAuto: false,
		},
		callbacks: {
			onComplete: function (id, name, response) {
				//var serverPathToFile = response.filePath;
				//var fileItem = this.getItemByFileId(id);
				if (response.success) {
					//var viewBtn = window.qq(fileItem).getByClass("view-btn")[0];
					//viewBtn.setAttribute("href", "file://" + serverPathToFile);
					//window.qq(viewBtn).removeClass("qq-hide");
				}
			},
		},
		// Prevents user from simultaneously selecting or dropping more than one item when false.
		multiple: true,
		validation: {
			//allowedExtensions: ['pdf'],
			// The maximum allowable size, in bytes, for an item. (5 MB = 5 *1024 * 1024 bytes)
			sizeLimit: 5242880,
			// The maximum number of items that can be potentially uploaded in this session.
			// (Will reject all items that are added or retried after this limit is reached.)
			itemLimit: 15,
		},
	});
})();

// ======================================================================

window.DEMO.loadCommon();

$("#cancelAll").on("click", function () {
	// Cancels all queued or currently uploading items.
	uploader.cancelAll();
});

$("#reset").on("click", function () {
	uploader.reset();
});

$("#trigger-upload").on("click", function () {
	uploader.uploadStoredFiles();
});
