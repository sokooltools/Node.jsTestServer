// -----------------------------------------------------------------------------------------------------
// app.js
// -----------------------------------------------------------------------------------------------------

// https://nodejs.org/en/

// MODULE   VERSION
// -------  -------------
// NodeJs   14.12.0
// NPM      7.6.0
// Express  4.15.3

/*jslint node: true */
"use strict";

// This is the web framework.
var express = require("express");

// This is the logger.
var morgan = require("morgan");

var fs = require("fs");
var path = require("path");
var favicon = require("serve-favicon");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var debug = require("debug");

var download = require("./routes/download");
var index = require("./routes/index");
var test = require("./routes/test");
var upload = require("./routes/upload");
var uploads = require("./routes/uploads");
var users = require("./routes/users");
var services = require("./routes/services");

//var inspect = debug("testserver");

var app = express();

app.set("port", process.env.PORT || 3000);

// Uncomment the next line to set the environment to 'Production'.
//app.set("env", "production");

// Set morgan to log according to environment.
// https://github.com/expressjs/morgan/blob/master/README.md
if (app.get("env") === "development") {
	// Log everything to std console.
	app.use(morgan("dev"));
} else {
	var logsDir = path.join(__dirname, "Logs"); // 
	// Ensure the "Logs" directory exists.
	if (!fs.existsSync(logsDir)) 
		fs.mkdirSync(logsDir);
	// Specify the log file.
	var logFile = path.join(logsDir, "morgan.log");
	// Create a write stream (in append mode).
	var accessLogStream = fs.createWriteStream(logFile, { flags: "a" });
	// Setup the logger to skip all but errors.
	app.use(morgan("common", { skip: function(req, res) { return res.statusCode < 400; }, stream: accessLogStream }));
}

// Configure app to use bodyParser().
// This will let us get the data from a POST.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());

var rootFolder = path.dirname(__dirname);                 // Y:\Tucson\trunk\ParkerWebCF

var contentFldr = path.join(rootFolder, "StaticContent"); // Y:\Tucson\trunk\ParkerWebCF\StaticContent

app.use(favicon(path.join(contentFldr, "favicon.ico")));

// Tell express where to look for files. (In our case, the 'Static Contents' rootFolder folder)
// https://expressjs.com/en/starter/static-files.html
// The path that you provide to the express.static function is relative to the directory from where you launch your node process. 
// If you run the express app from another directory, it’s safer to use the absolute path of the directory that you want to serve:
//app.use("/static", express.static(path.join(__dirname, "StaticContent")));
app.use(express.static(contentFldr));

// Only requests to the following (e.g. /download/*) paths will be sent to our "router"

app.use("/", index);
app.use("/users", users);
app.use("/download", download);
app.use("/test", test);
app.use("/upload", upload);
app.use("/uploads", uploads);
app.use("/services", services);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// -- Error Handlers ------------------------------

// Development error handler. (Prints stacktrace).
if (app.get("env") === "development") {
	app.use(function (err, req, res) {
		res.status(err.status || 500);
		res.render("error", {
			message: err.message,
			error: err
		});
		//next(); // RAS
	});
}

// Production error handler. (No stacktraces leaked to user).
app.use(function (err, req, res) {
	res.status(err.status || 500);
	res.render("error", {
		message: err.message,
		error: {}
	});
	//next(); // RAS
});

// -----------------------------------------------

var server = app.listen(app.get("port"), function() {
	debug.log("Express (Test Server) listening on port " + server.address().port);
});

module.exports = app;