// -----------------------------------------------------------------------------------------------------
// test.js  ( e.g. http://localhost:3000/test/about )
// -----------------------------------------------------------------------------------------------------

var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var gifResize = require("@gumlet/gif-resize");
//var common = require("./common");

const gifMetaString = "data:image/gif;base64,";

// ----- Experimental ------------------------
//var app = express();
//app.use(express.json({ limit: "25mb" }));
//app.use(express.urlencoded({ limit: "25mb", extended: true, parameterLimit: 5000 }));
// -------------------------------------------

// Middleware that is specific to this route.
router.use(function (req, res, next) {

	// Write a line (containing the date and time), preceding all subsequent methods.
	//console.log(common.getFormattedDateTime());

	// --------------------------------------------
	// Add CORS headers to all responses
	res.setHeader("Access-Control-Allow-Origin", "*"); // Allowing all origins (Not recommended for production)
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	//res.setHeader("Access-Control-Allow-Credentials", "true"); // If cookies are needed
	// --------------------------------------------
	next();
});

// Returns info pertaining to the root route
router.get("/", function (req, res) {
	res.send("<h1>Test home page</h1>");
});

// Returns About info.
router.get("/about", function (req, res) {
	res.send("<h2>Test About</h2>");
});

// Clears the Nodejs console window.
router.get("/clear", function () {
	console.log("\x1Bc");
});

// Returns a simple Json object
router.get("/json", function (req, res) {
	const json = JSON.stringify({
		key1: "value1",
		key2: "value2",
		key3: "value3"
	}, null, 4);
	res.send(json);
});

// Returns a simple Json Array.
router.get("/array", function (req, res) {
	res.send([1, 2, 3]);
});

// Returns a list of module versions.
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
					const dir = path.join(key, "package.json");
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

// Uploads a GIF (rec'd as a Base64String) to this server's Downloads folder.
router.put("/upload-gif", function (req, res) {
	try {
		const downloadsFolder = getDownloadsFolder();
		const fileName = req.body.filename ? req.body.filename : "test-server.gif";
		const bufferIn = getBufferFromBase64String(req.body.base64String);
		const fullpath = path.join(downloadsFolder, fileName);
		const msg = `'${fullpath}' was successfully uploaded to the server.`;
		fs.writeFileSync(fullpath, bufferIn);
		console.log(msg);
		res.send(msg);
	} catch (err) {
		console.error(err.message);
		res.send(err.message);
	}
});

// Resize a GIF'.
router.put("/resize-gif", function (req, res) {
	try {
		const bufferIn = getBufferFromBase64String(req.body.base64String);
		gifResize({
			width: Math.trunc(req.body.width) // Make sure it's an int and not a float!
		})(bufferIn).then(bufferOut => {
			const base64String = `${gifMetaString}${getBase64StringFromBuffer(bufferOut)}`;
			res.status(200).send(base64String);
		});
	} catch (err) {
		console.error(err.message);
		res.send(err.message);
	}
});

//The 404 Route (ALWAYS keep this as the last route should the put request not be handled)
router.put("*", function (req, res) {
	const fullUrl = url.parse(req.url, true);
	res.status(404).send(util.format("Could not resolve \"%s\"!", fullUrl.pathname));
});

//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function (req, res) {
	res.status(404).send("<h3>Sorry... that route could not be found!</h3>");
});

// ReSharper disable UnusedLocals


// Gets the Base64 string (read synchronously) from the specified file.
function getBase64StringFromFile(file) {
	try {
		const binary = readFileSync(file, { encoding: "base64" });
	} catch (err) {
		console.error("Error reading file:", err);
	}
	return null;
};

// Gets the Base64 string (read asynchronously) from the specified file.
async function getBase64StringFromFileAsync(filePath) {
	try {
		return await fs.readFile(filePath, { encoding: "base64" });
	} catch (err) {
		console.error("Error reading file:", err);
		return null;
	}
};

// ReSharper restore UnusedLocals

/**
 * Gets a Base64 string converted from the specified buffer.
 *
 * @param {Buffer} buffer The Buffer.
 * @return {String} a Base64 string.
 */
function getBase64StringFromBuffer(buffer) {
	return Buffer.from(buffer).toString("base64");
}

/**
 * Gets a buffer converted from the specified Base64 string.
 *
 * @param {String} base64string The Base64 string.
 * @return {Buffer} The Buffer.
 */
function getBufferFromBase64String(base64string) {
	return Buffer.from(getBase64StringMinusMeta(base64string), "base64");
}

/**
 * Gets the specified Base64 string minus its meta data.
 *
 * @param {String} base64string
 * @return {String}
 */
function getBase64StringMinusMeta(base64String) {
	return base64String.startsWith("data:") ? base64String.split(";base64,").pop() : base64String;
}

function getDownloadsFolder() {
	const registry = require("registry-js");
	const folder = `${process.env.USERPROFILE}\\Downloads`;
	const folders =
		registry.enumerateValues(
			registry.HKEY.HKEY_CURRENT_USER,
			"Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders");
	for (const value of folders) {
		if (value.name === "{374DE290-123F-4565-9164-39C4925E467B}") {
			//folder = value.data.replace("%USERPROFILE%", process.env.USERPROFILE);
			return value.data;
		}
	}
	return folder;
}

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
