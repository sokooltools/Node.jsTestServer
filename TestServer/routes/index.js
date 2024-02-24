// -----------------------------------------------------------------------------------------------------
// index.js
// -----------------------------------------------------------------------------------------------------

var path = require("path");
var express = require("express");
var router = express.Router();

// This is used to open the home page when running in debug. (The file contains a redirect to "demo.htm" on the load event).
router.get("/", function (req, res) {
  // "D:\Users\Ronn\Documents\Visual Studio 2019\DevTools\ParkerConfigTool\TestServer\views\index.htm"
	const file = path.join(__dirname, "../views/index.htm"); 
	res.sendFile(file);
});

module.exports = router;