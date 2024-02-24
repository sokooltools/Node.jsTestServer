// -----------------------------------------------------------------------------------------------------
// test.js  ( e.g. http://localhost:3000/test/about or http://localhost:3000/test/clear )
// -----------------------------------------------------------------------------------------------------

var express = require("express");
var router = express.Router();
var fs = require("fs");
const gifResize = require("@gumlet/gif-resize");


var common = require("./common");
//const { dirname, join } = require("path");
const { join } = require("path");

// Experimental ------------------------------
var app = express();
app.use(express.json({ limit: "2mb" }));

//var bodyParser = require("body-parser");
//app.use(bodyParser.json({ limit: "10mb" }));
//app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
// -------------------------------------------

// Middleware that is specific to this route.
router.use(function (req, res, next) {

	// Experimental ------------------------------
	// Add CORS headers to all responses
	res.setHeader("Access-Control-Allow-Origin", "*"); // Allowing all origins (not recommended for production)
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Access-Control-Allow-Credentials", "true"); // If cookies are needed
	// -------------------------------------------

	// This writes a line containing the date and time preceding all the methods below.
	console.log(common.getFormattedDateTime());
	next();
});

// Define the home page route
router.get("/", function (req, res) {
	res.send("<h1>Test home page</h1>");
});

// Define the about route.
router.get("/about", function (req, res) {
	res.send("<h2>Test About</h2>");
});

// Clears the Nodejs console window.
router.get("/clear", function () {
	console.log("\x1Bc");
});

// Define a json route
router.get("/json", function (req, res) {
	const json = JSON.stringify({
		key1: "value1",
		key2: "value2",
		key3: "value3"
	}, null, 4);
	res.send(json);
});

// Define an array route
router.get("/array", function (req, res) {
	res.send([1, 2, 3]);
});

router.get("/version", function (req, res) {
	fs.readFile("package.json", (err, data) => {
		if (err) {
			console.error(err);
			return;
		}
		const obj = {};
		const packageJson = JSON.parse(data);
		if (!packageJson) {
			console.error("Could not load the dependencies data from 'package.json' file.");
		} else {
			const keys = Object.keys(packageJson.dependencies);
			for (const key of keys) {
				try {
					const dir = join(key, "package.json");
					const resolved = require.resolve(dir);
					obj[key] = require(resolved).version;
				} catch (err) {
					console.error(`Could not resolve: '${key}'`);
					continue;
				}
			}
		}
		const json = `versions: ${JSON.stringify(obj, null, 4)}`;
		res.send(json);
	});
});

router.put("/resize-gif", function (req, res) {
	try {
		const bufferIn = getBufferFromBase64String(req.body.base64String);
		gifResize({
			width: req.body.width
		})(bufferIn).then(bufferOut => {
			const base64String = `data:image/gif;base64,${getBase64StringFromBuffer(bufferOut)}`;
			res.status(200).send(base64String);
		});
	} catch (err) {
		console.error(err.message);
	}
});

// ReSharper disable UnusedLocals
// Gets the Base64 string converted from the content of the specified file (Synchronously).
function getBase64StringFromFileSync(file) {
	try {
		const binary = fs.readFileSync(file, { encoding: "base64" });
	} catch (err) {
		console.error("Error reading file:", err);
	}
	return null;
};

// Gets the Base64 string converted from the content of the specified file (Asynchronously).
async function getBase64StringFromFile(filePath) {
	try {
		return await fs.readFile(filePath, { encoding: "base64" });
	} catch (err) {
		console.error("Error reading file:", err);
		return null;
	}
};

// ReSharper restore UnusedLocals

// Gets a Base64 string converted from the specified buffer.
function getBase64StringFromBuffer(buffer) {
	return Buffer.from(buffer).toString("base64");
}

// Gets a buffer converted from the specified Base64 string.
function getBufferFromBase64String(base64string) {
	//return new Buffer(getBase64StringWithoutMeta(base64string), "base64");
	return new Buffer(getBase64StringWithoutMeta(base64string), "base64");
}

// Gets the specified Base64 string without its meta data.
function getBase64StringWithoutMeta(base64String) {
	// getBase64StringWithoutMeta("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA");
	return base64String.startsWith("data:") ? base64String.split(";base64,").pop() : base64String;
}


//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function (req, res) {
	res.status(404).send("<h3>Sorry... that address could not be found!</h3>");
});

//function doDownload(res){
//    //const filePath = `${__dirname}/uploaded/temp.gif`;    
//    const filePath = "uploaded/temp.gif";    
//    // Set the Headers.
//    res.setHeader("Content-Disposition", "attachment; filename=rubix2.gif");
//    res.setHeader("Content-type", "image/gif");   
//    // Create a read stream and pipe it to the response.
//    const fileStream = fs.createReadStream(filePath);
//    fileStream.pipe(res);
//};

module.exports = router;
