// -----------------------------------------------------------------------------------------------------
// upload.mjs
// -----------------------------------------------------------------------------------------------------

// Dependencies.
import express, { Router } from "express";
import { IncomingForm } from "formidable";
import { existsSync, mkdirSync, renameSync } from "fs";
import { join } from "path";

var router = Router();

//var app = express();
//const bodyParser = require("body-parser");
//app.use(bodyParser.urlencoded({
//    extended: true
//}));
//app.use(express.urlencoded({ extended: true }));

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Define upload route.
router.post("/", function (req, res) {

	// console.log(req.body);

	const form = new IncomingForm();
	var uploadsDir = join(__dirname, "../../Uploaded/");
	form.uploadDir = uploadsDir;
	form.parse(req, function (err, fields, files) {

		if (err) {
			next(err);
			return;
		}

		//const xx = fields.base64StringTextArea.value;

		// Ensure new directory exists.
		existsSync(uploadsDir) || mkdirSync(uploadsDir);

		const newFilePath = join(uploadsDir, files.demo_inputFile[0].originalFilename);

		// Move the temporary file from the temp path to its final resting spot.
		const oldFilePath = files.demo_inputFile[0].filepath;
		renameSync(oldFilePath, newFilePath);

		//res.json({ 'success': true });
		//res.cookie("upload", path.basename(newPath), { maxAge: 600000 });
		//const responseData = { success: true };
		//res.status(200).send(responseData);

		const referer = req.get("referer"); // + "?upload=true"; //+ path.basename(newPath);

		res.redirect(referer);

		//res.writeHead(200, { 'content-type': "text/plain" });
		//res.write("Received upload:\n\n");
		//res.end(util.inspect({ fields: fields, files: files }));

	});

	req.on("error", function (err) {
		// Print the error message and stack trace to 'stderr'.
		console.error(err.stack);
		res.status(500);
		res.json({ 'success': false });
	});
});

export default router;