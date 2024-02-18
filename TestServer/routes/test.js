// -----------------------------------------------------------------------------------------------------
// test.js  ( e.g. http://localhost:3000/test/about or http://localhost:3000/test/clear )
// -----------------------------------------------------------------------------------------------------

var express = require("express");
var router = express.Router();
var common = require("./common");

// Middleware that is specific to this router.
router.use(function(req, res, next) {
	console.log(common.getFormattedDateTime());
	next();
});

// Define the home page route
router.get("/", function(req, res) {
	res.send("<h1>Test home page</h1>");
});

// Define the about route.
router.get("/about", function(req, res) {
	res.send("<h2>Test About</h2>");
});

// Clears the Nodejs console window.
router.get("/clear", function() {
	console.log("\x1Bc");
});

// Define a json route
router.get("/json", function(req, res) {
	res.send({
		test: "json"
	});
});

// Define an array route
router.get("/array", function(req, res) {
	res.send([1, 2, 3]);
});

router.get("/version", function(req, res) {
	const {dirname, join} = require("path");
	const ver = require(join(dirname(require.resolve("express")), "package.json")).version;
	res.send(ver);
});

//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function(req, res) {
	res.status(404).send("<h3>Sorry... that address could not be found!</h3>");
});

module.exports = router;
