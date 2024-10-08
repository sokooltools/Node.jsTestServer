// -----------------------------------------------------------------------------------------------------
// test.mjs  ( e.g. http://localhost:3000/test/xxx )
// -----------------------------------------------------------------------------------------------------

import express, { Router } from "express";

var path = await import("path");
var fs = await import("fs");
import * as cmn from "./common.mjs";

import { createRequire } from "module";
const reqr = createRequire(import.meta.url);
var gifResize = reqr("@gumlet/gif-resize");

import bodyParser from "body-parser";

import helmet from "helmet";

import { exec } from "child_process";

import registry from "registry-js";

var app = express();
var router = Router();

// app.use(express.json({
// 	//limit: "10mb", verify: (req, res, buf) => { req.rawBody = buf.toString() }
// 	limit: "1000000"
// }));

// app.use(express.raw({
// 	//limit: "10mb", verify: (req, res, buf) => { req.rawBody = buf.toString() }
// 	limit: "1000000"
// }));

// app.use(express.urlencoded({
// 	limit: "10mb", extended: true, parameterLimit: 50
// }));

app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			connectSrc: ["'self'", "http://127.0.0.1:8000", "ws://localhost:3000/", "https://localhost:443/"]
		}
	}
}));

app.use(bodyParser.json({ limit: "10mb" }));
// app.use(bodyParser.raw({ limit: "10mb" }));
// app.use(bodyParser.urlencoded({ limit: "10mb", extended: true, parameterLimit: 50 }));

// ------------------------------------------------

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

// Clears the Nodejs console window.
router.get("/clear", function (req, res) {
	//console.log("\x1Bc");
	console.clear();
	res.json("Test Server console was cleared!");
});

// Returns info pertaining to the root route
router.get("/", function (req, res) {
	res.json("You've reached the home page of the 'Test' routes.");
});

// Returns info pertaining to the root route
router.get("/ping", function (req, res) {
	res.status(200).json("{success}");
});

// Returns About info.
router.get("/about", function (req, res) {
	res.json("Test Route About Html");
});

// Returns a simple Json object.
router.get("/json", function (req, res) {
	let jsonL1 = {
		"testdata": {}
	}
	let jsonL2 =
	{
		"key1": "value1",
		"key2": "value2",
		"key3": "value3"
	};
	jsonL1.testdata = jsonL2;
	res.json(jsonL1);
});

// Returns the Snippets in Edge DevTools by reading the Preferences (json-based) file.
router.get("/snippets", function (req, res) {
	// Read the file asynchronously.
	//let prefFile = String.raw`C:/Users/Ronn/AppData/Local/Microsoft/Edge/User Data/Default/Preferences`;
	let prefFile = path.join(process.env.APPDATA.replace("Roaming", "Local"), String.raw`Microsoft\Edge\User Data\Default\Preferences`);
	fs.readFile(prefFile, "utf8", (err, buf) => {
		if (err) {
			console.error(err);
			res.status(401).send("Error reading snippets.json");
			return;
		}
		const token1 = '"script-snippets":';
		let data = buf.toString();
		let n = data.indexOf(token1);
		if (n > -1) {
			data = data.substring(n + token1.length);
			const token2 = '"script-snippets-last-identifier":';
			n = data.indexOf(token2);
			if (n > -1) {
				data = data.substring(0, n);
				if (data.charAt(data.length - 1) === ",") {
					data = data.substring(0, data.length - 1);
				}
				data = data.trim();
			}
		}
		let jsonL1 = JSON.parse(data);
		jsonL1 = JSON.parse(jsonL1).sort(sortByProperty("name"));
		res.status(200).json(jsonL1);
	});
	function sortByProperty(property) {
		return function (a, b) {
			if (a[property] > b[property])
				return 1;
			else if (a[property] < b[property])
				return -1;
			return 0;
		}
	}
});

// Returns a simple Json Array.
router.get("/array", function (req, res) {
	res.json([1, 2, 3]);
});

// Returns the version of all node modules listed in the project's package.json.
router.get("/npmdepends", function (req, res) {
	// Read the file asynchronously.
	fs.readFile("package.json", (err, data) => {
		if (err) {
			console.error(err);
			res.status(401).send("Error reading package.json");
			return;
		}
		const obj = {};
		const packageJson = JSON.parse(data);
		if (!packageJson) {
			console.error("Could not process the 'package.json' file.");
		} else {
			const keys = Object.keys(packageJson.dependencies);
			for (const key of keys) {
				try {
					const dir = path.join(key, "package.json");
					const resolved = reqr.resolve(dir);
					obj[key] = reqr(resolved).version;
				} catch (err) {
					console.error(`Could not resolve: '${key}'`);
					continue;
				}
			}
		}
		let jsonL1 = {
			"dependencies": {}
		}
		jsonL1.dependencies = obj;
		res.status(200).json(jsonL1);
	});
});


// Returns the extended list of dependencies based on the specified tree depth.
/*
	To debug function containing 'exec': 
	Enable the 'Auto Attach: With Flag' feature in VS Code. 
	This can be done by running the command 'Toggle Auto Attach' from the 
	Command Palette (Ctrl+Shift+P), and selecting the appropriate mode.
*/
router.get("/npmdependsext/*", function (req, res) {
	const tree_depth = cmn.getLastSegment(req.url);
	let toExec = (!(tree_depth) || isNaN(tree_depth) || tree_depth < 0)
		? `npm ls -a`
		: `npm ls --depth=${tree_depth - 1}`;
	exec(toExec, (error, stdout, stderr) => {
		if (error) {
			console.error(`Error: ${error.message}`);
			return res.status(500).send(`Error: ${error.message}`);
		}
		else if (stderr) {
			console.error(`Stderr: ${stderr}`);
			return res.status(500).send(`Stderr: ${stderr}`);
		} else {
			let jsonL1 = {
				"dependencies": {}
			}
			jsonL1.dependencies = getUnescapedString(stdout);
			res.status(200).json(jsonL1);
		}
	});
});

router.get("/npmexplain/*", function (req, res) {
	const toExplain = cmn.getLastSegment(req.url);
	if (toExplain==="npmexplain")
		return res.status(200).json(`Error: 'Module' to explain was not provided.`);
	const toExec = `npm explain ${toExplain}`;
	exec(toExec, (error, stdout, stderr) => {
		if (error) {
			console.error(`Error: ${error.message}`);
			res.status(200).json(`Error: ${error.message}`);
		}
		else if (stderr) {
			console.error(`Stderr: ${stderr}`);
			res.status(200).json(`Stderr: ${stderr}`);
		} else {
			let json = getUnescapedString(stdout);
			res.status(200).json(json);
		}
	});
});

/**
 * Returns an unescaped string
 * 
 * @param {any} escapedString The string containing the characters to be unescaped.
 * @returns An unescaped string.
 */
function getUnescapedString(escapedString) {
	return (!escapedString)
		? null
		: escapedString
			.replace(/\\"/g, '"')
			.replace(/\\'/g, "'")
			.replace(/\\n/g, "\n")
			.replace(/\\r/g, "\r")
			.replace(/\\t/g, "\t")
			.replace(/\\\\/g, "\\")
			.replace(/[\n]+$/g, "")
		;
}

// Uploads a GIF (rec'd as a Base64String) to this server's 'Downloads' folder.
router.put("/upload-gif", function (req, res) {
	try {
		const downloadsFolder = getDownloadsFolder();
		const fileName = req.body.filename ? req.body.filename : "testserver.gif";
		const bufferIn = getBufferFromBase64String(req.body.base64String);
		const fullpath = path.join(downloadsFolder, fileName);
		const msg1 = `Uploaded the GIF file "${fileName}" to this server's 'Downloads' folder (i.e., "${downloadsFolder}").`;
		const msg2 = "The GIF was successfully uploaded to the server.";
		fs.writeFileSync(fullpath, bufferIn);
		console.log(msg1);
		res.status(200).json(msg2);
	} catch (err) {
		console.error(err.message);
		res.status(404).json(err.message);
	}
});

// Resize a GIF'.
router.put("/resize-gif", function (req, res) {
	try {
		const bufferIn = getBufferFromBase64String(req.body.base64String);
		const gifMetaString = "data:image/gif;base64,";
		gifResize({
			width: Math.trunc(req.body.width) // Make sure it's an int and not a float!
		})(bufferIn).then(bufferOut => {
			const base64String = `${gifMetaString}${getBase64StringFromBuffer(bufferOut)}`;
			res.status(200).json(base64String);
		});
	} catch (err) {
		console.error(err.message);
		res.status(404).json(err.message);
	}
});

// The 404 Route (ALWAYS keep this as the last route should the put request not be handled)
router.put("*", function (req, res) {
	const fullUrl = new URL(req.url, `http://${req.headers.host}`).href;
	res.status(404).json(`Could not resolve ${fullUrl}!`);
});

// The 404 Route (ALWAYS keep this as the last route should the get request not be handled)
router.get("*", function (req, res) {
	const fullUrl = new URL(req.url, `http://${req.headers.host}`).href;
	res.status(404).json(`Could not resolve ${fullUrl}!`);
});

// --- HELPER FUNCTIONS ------------------------------------------------------------------------

// Gets the Base64 string (read synchronously) from the specified file.
//function getBase64StringFromFile(file) {
//	try {
//		const binary = readFileSync(file, { encoding: "base64" });
//	} catch (err) {
//		console.error("Error reading file:", err);
//	}
//	return null;
//};

// Gets the Base64 string (read asynchronously) from the specified file.
// ReSharper disable once UnusedLocals
async function getBase64StringFromFileAsync(filePath) {
	try {
		return fs.readFile(filePath, { encoding: "base64" });
	} catch (err) {
		console.error("Error reading file:", err);
		return null;
	}
};

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
 * Gets the specified Base64 string minus the meta data at the beginning of the string.
 *
 * @param {String} base64string
 * @return {String}
 */
function getBase64StringMinusMeta(base64String) {
	return base64String.startsWith("data:") ? base64String.split(";base64,").pop() : base64String;
}

/**
 * Gets the full path to the 'Downloads' folder located on this machine.
 *
 */
function getDownloadsFolder() {
	//const registry = reqr("registry-js");
	let folder = `${process.env.USERPROFILE}\\Downloads`;
	const folders =
		registry.enumerateValues(
			registry.HKEY.HKEY_CURRENT_USER,
			"Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders");
	for (const value of folders) {
		if (value.name === "{374DE290-123F-4565-9164-39C4925E467B}") {
			folder = value.data.replace("%USERPROFILE%", process.env.USERPROFILE);
			//return value.data;
			break;
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

export default router;