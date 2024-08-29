// -----------------------------------------------------------------------------------------------------
// app.js
// -----------------------------------------------------------------------------------------------------

// https://nodejs.org/en/

//"use strict";

//import { createRequire } from "module";
//const reqr = createRequire(import.meta.url);

import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
//const __filename = url.fileURLToPath(import.meta.url);

import http from "http";
import https from "https";

// This is the web framework.
// see https://expressjs.com/
import express from "express";

// This is the logger.
// see https://github.com/expressjs/morgan
import morgan from "morgan";

var fs = await import("fs");
var path = await import("path");

import debug from "debug";
import favicon from "serve-favicon";
import cookieParser from "cookie-parser";
import bodyParser from 'body-parser';

import fineupload from "./routes/fineupload.mjs";
import services from "./routes/services.mjs";
import index from "./routes/index.mjs";
import upload from "./routes/upload.mjs";
import users from "./routes/users.mjs";
import download from "./routes/download.mjs";
import test from "./routes/test.mjs";

var app = express();

app.set("port", process.env.PORT || 3000);
app.set("port_https", process.env.PORT_HTTPS || 443);

// Uncomment the next line to set the environment from 'development' to 'production'.
//app.set("env", "production");

// Setup morgan to log according to the environment.
// https://github.com/expressjs/morgan/blob/master/README.md
if (app.get("env") === "development") {
	app.use(morgan("dev"));
	// Log everything to std console immediately.
	//app.use(morgan(":method :url :status :res[content-length] - :response-time ms", { immediate: function(){} }));
} else {
	// "D:\Users\Ronn\Documents\Visual Studio 2019\DevTools\Node.jsTestServer\TestServer\Logs"
	var logsDir = path.join(__dirname, "Logs");
	// Ensure the "Logs" directory exists.
	if (!fs.existsSync(logsDir))
		fs.mkdirSync(logsDir);
	// Specify the log file.
	var logFile = path.join(logsDir, "morgan.log");
	// Create a write stream (in append mode).
	var accessLogStream = fs.createWriteStream(logFile, { flags: "a" });
	// Setup the logger to skip all but errors.
	app.use(morgan("common", { skip: function (req, res) { return res.statusCode < 400; }, stream: accessLogStream }));
}

// Configure app to use bodyParser().
// This will let us get the data from a POST.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "10mb" }));

app.use(cookieParser());

// "D:\Users\Ronn\Documents\Visual Studio 2019\DevTools\Node.jsTestServer"
var rootFolder = path.dirname(__dirname);

// "D:\Users\Ronn\Documents\Visual Studio 2019\DevTools\Node.jsTestServer\StaticContent"
var contentFldr = path.join(rootFolder, "StaticContent");

app.use(favicon(path.join(contentFldr, "favicon.ico")));

// Tell express where to look for files. (In our case, the 'Static Contents' rootFolder folder)
// https://expressjs.com/en/starter/static-files.html
// The path that you provide to the express.static function is relative to the directory from where you launch your node process. 
// If you run the express app from another directory, it’s safer to use the absolute path of the directory that you want to serve:
//app.use("/static", express.static(path.join(__dirname, "StaticContent")));
app.use(express.static(contentFldr));

// app.use((req, res, next) => {
//     res.setHeader('Content-Security-Policy', "script-src 'unsafe-eval' https://ajax.googleapis.com");
//     next();
// });

// Only requests to the following (e.g. /download/*) paths will be sent to our "router"
app.use("/", index);
app.use("/users", users);
app.use("/download", download);
app.use("/upload", upload);
app.use("/fineupload", fineupload);
app.use("/services", services);
app.use("/test", test);

// // Configure app to use bodyParser().
// // This will let us get the data from a POST.
// app.use(bodyParser.json({ limit: "1000000" }));
// app.use(bodyParser.raw({ limit: "1000000" }));
// app.use(bodyParser.urlencoded({ limit: "1000000", extended: true, parameterLimit: 50 }));


// Anything else causes 404 and forwards to error handler.
app.use(function (req, res, next) {
	const err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// Error Handler - Development (prints a stacktrace);  Production just the message.
app.use(function (err, req, res) {
	res.status(err.status || 500);
	res.render("error", {
		message: err.message,
		error: app.get("env") === "development" ? err : {}
	});
	//next(); // RAS
});

// -----------------------------------------------

const httpServer = http.createServer(app);
// const httpServer = http.createServer((req, res) => {
// 	res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
// 	res.end();
// });

httpServer.listen(app.get("port"), function () {
	debug.log(`Express (Test Server) listening on port ${app.get("port")}`);
});

const options = {
	key: fs.readFileSync(path.join(__dirname, "./Security/localhost.key")),
	cert: fs.readFileSync(path.join(__dirname, "./Security/localhost.crt"))
};

const httpsServer = https.createServer(options, app);

httpsServer.listen(app.get("port_https"), () => {
	debug.log(`Express (Test Server) listening on port ${app.get("port_https")} (secure)`);
});

//app.all('*', (req, res) => res.redirect(300, 'https://localhost'));

export default app;