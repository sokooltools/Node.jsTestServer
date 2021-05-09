// -----------------------------------------------------------------------------------------------------
// download.js
// -----------------------------------------------------------------------------------------------------

// Dependencies.
var express = require("express");
var path = require("path");
var url = require("url");
var fs = require("fs");
var mime = require("mime");
var moment = require("moment");

moment.locale("en");

// https://www.iana.org/assignments/media-types/media-types.xhtml

// Example URL: http://localhost:3000/download?fn=litesw.log

var router = express.Router();

// This gets invoked for any requests passed to this router.
router.use(function(req, res, next) {
	console.log("    Download requested: %s", moment().format("YYYY-MM-DD HH:mm:ss"));
	next();
});

router.get("/", function(req, res) {

	const fullUrl = url.parse(req.url, true);
	const parspath = path.parse(fullUrl.query.fn);
	var filename = parspath.base;
	var fileroot = path.join(path.dirname(__dirname), "..\\"); // "Y:\Tucson\trunk\ParkerWebCF"

	var filepath;

	// Determine location of the file.
	switch (filename.toLowerCase()) {
	case "pacremotedesktop.exe":
		filepath = path.join(fileroot, "utilities", filename);
		break;
	case "globalization.zip":
		filepath = path.join(fileroot, "globalization", filename);
		break;
	case "webserver.exe.ini.docx":
	case "webserver.exe.log.docx":
	case "pac_user_guide.pdf":
		filepath = path.join(fileroot, "staticcontent", "docs", filename);
		break;
	case "webserver.exe.ini":
	case "webserver.exe.log":
	case "sessions.json":
		filepath = path.join(fileroot, "staticcontent", "demo", "docs", filename);
		break;
	default:
		filepath = path.join(fileroot, "staticcontent", "demo", "docs", filename);
		break;
	}

	// Get the stats, (the 'size') related to the specified file.  
	fs.stat(filepath, function(err, stat) {
		// An error is returned if the file does not exist.
		if (err) {
			res.status(err.status || 404);
			res.sendFile(path.join(fileroot, "staticcontent", "docs", "error.htm"));
		} else {
			res.setHeader("content-length", stat.size);
			const mimetype = mime.lookup(filepath);
			const charset = mime.charsets.lookup(mimetype);
			res.setHeader("content-type", mimetype + (charset ? `; charset=${charset}` : ""));
			res.download(filepath, filename, function(ex) {
				if (ex) {
					// Handle error, but keep in mind the response may be partially-sent so check res.headersSent
					if (res.headersSent) {
						console.log(res.headersSent);
					}
					res.status(406).send("Not Acceptable").end();
				}
			});
		}
	});

	req.on("error", function(err) {
		// This prints the error message and stack trace to 'stderr'.
		console.error(err.stack);
	});
});

//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function(req, res) {
	res.status(404).send("<h2>Sorry... that address could not be found!</h2>");
});

module.exports = router;