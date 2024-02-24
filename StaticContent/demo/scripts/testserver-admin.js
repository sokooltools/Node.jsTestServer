function doGet(url) {
	$("textarea#response").val("");
	$.ajax({
		type: "GET",
		url: url,
		dataType: null,
		async: true,
		cache: false,
		success: function(data) {
			foo(data);
		},
		error: function(jqXHR) {
			foo(jqXHR.status);
		}
	});
}
;
function foo(data) {
	$("textarea#response").val(data);
}
;

// -------------------------------------------------------------------------------------------
// Resizes the gif via an AJAX call.
// url: "http://localhost:3000/test/resize-gif",
// -------------------------------------------------------------------------------------------
function resizeGif(isAsync, base64String, width) {
	const json = {
		"base64String": base64String,
		"width": width
	}
	$.ajax({
		type: "PUT",
		url: "/test/resize-gif",
		dataType: "json",
		headers: {
			"Content-Type": "application/json"
		},
		global: false,
		async: isAsync || false,
		data: JSON.stringify(json),
		complete: function (jqXHR) {
			if (jqXHR.status === 200) {
				$("textarea#response").val(jqXHR.responseText);
			}
		},
		fail: function (err) {
			console.log(err);
		}
	});
};
