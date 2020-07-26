// -----------------------------------------------------------------------------------------------------
// upload.js
// -----------------------------------------------------------------------------------------------------

// Dependencies.
var express = require("express");
var formidable = require("formidable");
var fs = require("fs");
var path = require("path");

var router = express.Router();

// Define upload route.
router.post("/", function(req, res) {
	const form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		const uploadsDir = path.join(__dirname, "../../Uploaded/");

		// Ensure new directory exists.
		fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir);

		const newPath = path.join(uploadsDir, files.demo_txtFile.name);

		// Move the file from the temp path to its final resting spot.
		const oldPath = files.demo_txtFile.path;
		fs.renameSync(oldPath, newPath);

		//res.status(200);
		//res.json({ 'success': true });

		//res.cookie("upload", path.basename(newPath), { maxAge: 600000 });

		//var responseData = { success: false };
		//responseData.success = true;
		//res.send(responseData);

		const r = req.get("referer"); // + "?upload=true"; //+ path.basename(newPath);

		res.redirect(r);

		//res.writeHead(200, { 'content-type': "text/plain" });
		//res.write("Received upload:\n\n");
		//res.end(util.inspect({ fields: fields, files: files }));

	});

	req.on("error", function(err) {
		// Print the error message and stack trace to 'stderr'.
		console.error(err.stack);
		res.status(500);
		res.json({ 'success': false });
	});
});

module.exports = router;