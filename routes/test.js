// -----------------------------------------------------------------------------------------------------
// test.js
// -----------------------------------------------------------------------------------------------------

var express = require("express");
var router = express.Router();

// Middleware that is specific to this router.
router.use(function (req, res, next) {
	console.log("Time: ", Date.now());
	next();
});

// Define the home page route
router.get("/", function(req, res) {
	res.send("<h1>Test home page</h1>");
});

// Define the about route
router.get("/about", function(req, res) {
	res.send("Test About");
});

// Clears the Nodejs console window.
router.get("/clear", function() {
	console.log('\x1Bc');
});

// Define a json route
router.get("/json", function(req, res) {
	res.send({ test: "json" });
});

// Define an array route
router.get("/array", function(req, res) {
	res.send([1, 2, 3]);
});

//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function(req, res) {
	res.status(404).send("<h3>Sorry... that address could not be found!</h3>");
});

module.exports = router;