// -----------------------------------------------------------------------------------------------------
// upload.js
// -----------------------------------------------------------------------------------------------------

// Dependencies.
var express = require("express");

var formidable = require("formidable");
var fs = require("fs");
var path = require("path");

var router = express.Router();

//const bodyParser = require("body-parser");

var app = express();

//app.use(bodyParser.urlencoded({
//    extended: true
//}));

//app.use(express.urlencoded({ extended: true }));

// Define upload route.
router.post("/", function (req, res) {

    // const postData = req.body;
    // console.log(postData );

    const form = new formidable.IncomingForm();
    const uploadsDir = path.join(__dirname, "../../Uploaded/");
    form.uploadDir = uploadsDir;
    form.parse(req, function (err, fields, files) {

        if (err) {
            next(err);
            return;
        }

        //const xx = fields.base64StringTextArea.value;

        // Ensure new directory exists.
        fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir);

        const newPath = path.join(uploadsDir, files.demo_inputFile.name);

        // Move the file from the temp path to its final resting spot.
        const oldPath = files.demo_inputFile.path;
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

    req.on("error", function (err) {
        // Print the error message and stack trace to 'stderr'.
        console.error(err.stack);
        res.status(500);
        res.json({ 'success': false });
    });
});

module.exports = router;