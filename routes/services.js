// -----------------------------------------------------------------------------------------------------
// services.js
// -----------------------------------------------------------------------------------------------------

// @ts-check
// See https://code.visualstudio.com/docs/languages/javascript for explanation of above.

// -----------------------------------------------------------------------------------------------------
// services.js
// -----------------------------------------------------------------------------------------------------

var path = require("path");
var util = require("util");
var express = require("express");
var bodyParser = require("body-parser");
var url = require("url");
var common = require("./common");

//var multer = require("multer");
//var upload = multer(); // for parsing multipart/form-data

var app = express();
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json({
	type: "application/*+json"
}));

//var errorhandler = require('errorhandler')
//app.use(errorHandler({ dumpExceptions: true, showStack: true }));

var router = express.Router();

var emptyPasswordIndicator = "@@@@@@@@";

var _machinename;

var _dts = {
	machinedatetime: common.dateToMillisecondsUtc(),
	machinetimezone: 89,
	isautodst: true
};

var _user = {
	"username": "",
	"password": "",
	"userlevel": 1,
	"enabled": 1,
	"deleted": 0,
	"datecreated": 0.0,
	"datemodified": 0.0
};

var _session = {
	"username": null,
	"enabled": 1,
	"userlevel": 0,
	"deleted": 0,
	"datecreated": 0.0,
	"datemodified": 0.0,
	"lastaccessed": 0.0,
	"ipaddress": "",
	"id": "id_1"
};

// ----------------------------- PUT HANDLERS -----------------------------------

router.put("/network/*", function (req, res, next) {
	const lastseg = common.getLastSegment(req.url);
	switch (lastseg) {
		case "login":
			doPutLogin(req, res);
			break;
		case "logout":
			doPutLogout(req, res);
			break;
		case "networkdata":
			doPutNetworkData(req, res);
			break;
		case "systemdata":
			doPutSystemData(req, res);
			break;
		case "datetimedata":
			doPutDateTimeData(req, res);
			break;
		case "securitydata":
			doPutSecurityData(req, res);
			break;
		case "synchnow":
			doPutSyncTime(req, res);
			break;
		case "xpressdata":
			doPutXpressData(req, res);
			break;
		default:
			next();
			return;
	}
	res.status(200).end();
});

//The 404 Route (ALWAYS keep this as the last route should the put request not be handled)
router.put("*", function (req, res) {
	const fullUrl = url.parse(req.url, true);
	res.status(404).send(util.format("Could not resolve \"%s\"!", fullUrl.pathname));
});

// ----------------------------------- GET HANDLERS ----------------------------------------

router.get("/xpressshell", function (req, res) {
	const filename = "xpressshell.htm";
	res.status(200).sendFile(path.join(common.demodata, filename));
});

router.get("/network/iscurrentipaddress/:adapterid/:hostoraddress", function (req, res) {
	console.log("\r\nWeb Service checking whether adapter id '%s' is connected to ip address '%s'...",
		req.params.adapterid, req.params.hostoraddress);
	const json = {
		adapterid: req.params.adapterid,
		hostoraddress: req.params.hostOrAddress,
		iscurrentipaddress: (req.params.adapterid === "3") // TODO:
	};
	res.status(200).json(json).end();
});

router.get([
	"/network/isExisting/:hostOrAddress",
	"/network/isExisting/:hostOrAddress/:attempts",
	"/network/isExisting/:hostOrAddress/:attempts/:timeout",
	"/network/isExistingmachinename/:hostOrAddress"
], function (req, res) {
	doGetIsExisting(req, res);
});

router.get("/network/networkdata/:adapterid", function (req, res) {
	const filename = `networkinfo${req.params.adapterid}.json`;
	const filepath = path.join(common.demodata, filename);
	const data = common.readFileCache(filepath);
	updateMachineName(data);
	res.set("Content-Type", "application/json");
	res.status(200).send(data).end();
});

router.get("/network/demo/*", function (req, res) {
	var filepath;
	try {
		const lastseg = common.getLastSegment(req.url);
		switch (lastseg) {
			case "aboutinfo":
			case "supportedlanguages":
			case "xpresssettings":
				res.set("Content-Type", "text/xml");
				filepath = path.join(common.demodata, lastseg + ".xml");
				break;
			default:
				throw Error(util.format("Could not resolve '%s'!", req.url));
		}
		const data = common.readFileCache(filepath);
		res.status(200).send(data).end();
	} catch (err) {
		console.log(err.message);
		res.status(404).send(err.message).end();
	}
});

router.get("/network/*", function (req, res, next) {
	var filepath;
	try {
		const lastseg = common.getLastSegment(req.url);
		switch (lastseg) {
			case "datetimesettings":
				doGetDatetimeSettings(req, res);
				return;
			case "memoryinfo":
				doGetMemoryInfo(req, res);
				return;
			case "languagedata":
				doGetLanguageData(req, res);
				return;
			case "aboutinfo":
			case "configtool":
			case "internetsettings":
			case "login":
			case "networksettings":
			case "refreshunits":
			case "securitysettings":
			case "systemsettings":
			case "xpresssettings":
				filepath = path.join(common.globalization, "languages", req.query.lang.toString(), lastseg + ".xml");
				res.set("Content-Type", "text/xml");
				break;
			case "internettimeservers":
				filepath = path.join(common.globalization, lastseg + ".json");
				res.set("Content-Type", "application/json");
				break;
			case "aboutdata":
			case "adapterinfo":
			case "systemdata":
			case "timezonelist":
			case "userssessions":
			case "xpressdata":
				filepath = path.join(common.demodata, lastseg + ".json");
				res.set("Content-Type", "application/json");
				break;
			default:
				next();
				return;
		}
		const data = common.readFileCache(filepath);
		res.status(200).send(data).end();
	} catch (err) {
		console.log(err.message);
		res.status(404).send(err.message).end();
	}
});

//The 404 Route (This is always the last route when the get request is not otherwise handled)
router.get("*", function (req, res) {
	const fullUrl = url.parse(req.url, true);
	res.status(404).send(util.format("Could not resolve \"%s\"!", fullUrl.pathname));
});

// ----------------------------------- PRIVATE FUNCTIONS ----------------------------------------

/* -------------------------------------------------------------------------------------------*/
/**
 * Using data in the request object, processes, then responds using a JSON object: 
 * the lanuage data corresponding to the specified language code.
 */
function doGetLanguageData(req, res) {
	res.set("Content-Type", "application/json");
	const filepath = path.join(common.globalization, "SupportedLanguages.json");
	const code = req.query.lang.toLowerCase();
	const json = common.readFileCache(filepath);
	const langs = JSON.parse(json);
	for (let key in langs) {
		if (langs.hasOwnProperty(key)) {
			if (langs[key].code.toLowerCase() === code) {
				res.status(200).json(langs[key].opts).end();
				return;
			}
		}
	}
	res.status(404).json("").end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Responds using a new JSON object: the current date and time on this computer.
 */
function doGetDatetimeSettings(req, res) {
	res.status(200).json(_dts).end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Responds using a new JSON object: the current memory on this computer.
 */
function doGetMemoryInfo(req, res) {
	const alloc = 839680;
	const inuse = common.randomIntFromInterval(4700, 4800) * 10;
	const obj = {
		allocated: alloc,
		inuse: inuse,
		free: alloc - inuse,
		refreshrate: 5000
	};
	res.status(200).json(obj).end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Using data in the request object, processes, then responds using a JSON object: 
 * an indication as to whether the specified host or ip address in the data exists on this network.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doGetIsExisting(req, res) {
	// Note: This method handles both isexisting and isexistingmachinename urls.
	const hostOrAddress = req.params.hostOrAddress;
	const attempts = req.params.attempts;
	const timeout = req.params.timeout;
	console.log("\r\nWeb Service checking for existence of '%s' on the network...", hostOrAddress);
	common.isExisting(hostOrAddress, 80, attempts, timeout)
		.then(function (data) {
			console.log("Web Service responded: status: [%s], isexisting: %s, message: \"%s\".\r\n", data.status, data.isexisting,
				data.message);
			res.status(data.status).json(data).end();
		}, function (err) {
			res.status(500).json(err.message).end();
		});
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Using data in the request object, processes, then responds using a JSON object:  
 * the success or failure of a the specified user's attempted login into ParkerWebCF.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutLogin(req, res) {
	const json = req.body;
	const username = common.toTitleCase(json.username);
	const remember = json.remember;
	_user = getUser(username);
	if (_user.enabled === 0) {
		console.log("'%s' login is not enabled.", username);
		// Respond with Forbidden
		res.status(403).end();
	} else if (_user.username && _user.password === json.password && _user.deleted === 0) {
		console.log("'%s' login succeeded.", username);
		// The username and remember cookies expire after 7 days.
		res.cookie("username", username, {
			maxAge: 604800000
		}); // 7 days
		res.cookie("remember", remember, {
			maxAge: 604800000
		});
		// These other cookies expire when the session ends.
		res.cookie("userlevel", _user.userlevel);
		const key = common.createGuid().replace(/\-/g, "").substring(0, 14);
		res.cookie("key", key);
		res.cookie("timeout", "300"); // 5 minutes
		res.status(200).json(json).end();
	} else {
		console.log("'%s' login failed.", username);
		// Respond with Unauthorized
		res.status(401).end();
	}
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Using data in the request object, processes, then responds using a JSON object:  
 * the success or failure of a the specified user's attempted logout of ParkerWebCF.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutLogout(req, res) {
	res.cookie("key", "");
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Using data in the request object: Updates 'networkinfo[n].json' in the file cache  
 * and responds using a new or modified json object.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutNetworkData(req, res) {
	const json = req.body;
	const filename = `networkinfo${json.adapterid}.json`;
	const filepath = path.join(common.demodata, filename);
	const data = JSON.parse(common.readFileCache(filepath));
	updateDataWithJson(data, json);
	common.writeFileCache(filepath, data, true);
	res.status(200).json(json).end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Using data in the request object: Updates 'systemdata.json' in the file cache and responds 
 * using a new or modified json object.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutSystemData(req, res) {
	const json = req.body;
	const filepath = path.join(common.demodata, "systemdata.json");
	const data = JSON.parse(common.readFileCache(filepath));
	_machinename = json.machinename;
	updateDataWithJson(data, json);
	common.writeFileCache(filepath, data, true);
	res.status(200).json(json).end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Using data in the request object: Updates 'xpressdata.json' in the file cache and responds
 * using a new or modified json object.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutXpressData(req, res) {
	const json = req.body;
	const filepath = path.join(common.demodata, "xpressdata.json");
	const data = JSON.parse(common.readFileCache(filepath));
	updateDataWithJson(data, json);
	if (data.project.name === "") {
		data.project.name = "BlankProject";
		data.project.projectversion1 = 1;
		data.project.projectversion2 = 0;
	}
	common.writeFileCache(filepath, data, true);
	res.status(200).json(json).end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Saves the security data.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutSecurityData(req, res) {
	const json = req.body;
	updateDataWithJson(_user, json);
	var dt = common.dateToMilliseconds(new Date());
	_user.datecreated = dt;
	_user.datemodified = dt;
	if (_user.password === emptyPasswordIndicator) {
		_user.password = "";
	}
	addOrUpdateUsers(_user);
	addOrUpdateSessions(_user);
	res.status(200).json(json).end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Saves the date and time data.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutDateTimeData(req, res) {
	const json = req.body;
	_dts.machinedatetime = json.machinedatetime;
	_dts.machinetimezone = json.machinetimezone;
	_dts.isautodst = json.isautodst;
	res.status(200).json(json).end();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Saves the sync time.
 * @param {any} req The request object.
 * @param {any} res The response object.
 */
function doPutSyncTime(req, res) {
	const json = req.body;
	res.status(200).json(json).end();
}

// ----------------------------------- PRIVATE HELPER FUNCTIONS ----------------------------------------

/**
 * Gets the user having the specified username from the file cache or a new user if a user with the 
 * specifed username does not exist in the cache.
 * 
 * @param {any} username The username
 * @returns A user object having the specified username or a new initialized user.
 */
function getUser(username) {
	const filepath = path.join(common.demodata, "users.json");
	const data = common.readFileCache(filepath);
	const users = JSON.parse(data);
	username = username.toLowerCase();
	for (let key in users) {
		if (users.hasOwnProperty(key)) {
			if (users[key].username.toLowerCase() === username) {
				return users[key];
			}
		}
	}
	return _user; // return a new initialized user
}

/**
 * Adds a new or updates an existing user in the file cache using the specified user data.
 * 
 * @param {any} user The user object.
 * @returns 
 */
function addOrUpdateUsers(user) {
	const filepath = path.join(common.demodata, "users.json");
	const data = common.readFileCache(filepath);
	const users = JSON.parse(data);
	const username = user.username.toLowerCase();
	for (let key in users) {
		if (users.hasOwnProperty(key)) {
			if (users[key].username.toLowerCase() === username) {
				users[key] = user;
				common.writeFileCache(filepath, users);
				return;
			}
		}
	}
	// If we got here then user did'nt exist so we need to add it.
	users.push(user);
	common.writeFileCache(filepath, users);
}

/**
 * Adds new or updates existing userssessions.json data stored in the file cache using the specified user data.
 * 
 * @param {any} user New or modified User object
 */
function addOrUpdateSessions(user) {
	const username = user.username.toLowerCase(); // Compare using lowercase.
	const filepath = path.join(common.demodata, "userssessions.json");
	const data = common.readFileCache(filepath);
	const sessions = JSON.parse(data);
	var isExist = false;
	var maxId = 0;
	// Check if session user already exists, if so modify it in the JSON sessions cache.
	for (let elm in sessions) {
		if (sessions.hasOwnProperty(elm)) {
			const sesn = sessions[elm];
			const id = parseInt(sesn.id.substr(3), 10);
			// We use this to look for a unique id since we can't rely on Object.keys(sessions).length to provide it.
			if (id > maxId)
				maxId = id;
			if (sesn.username.toLowerCase() === username) {
				sesn.userlevel = user.userlevel;
				sesn.enabled = user.enabled;
				sesn.deleted = user.deleted;
				sesn.datemodified = user.datemodified;
				isExist = true;
			}
		}
	}
	// When the session user does not exist, add it to the JSON sessions cache.
	if (!isExist) {
		_session = {
			username: common.toTitleCase(username),
			userlevel: user.userlevel,
			enabled: user.enabled,
			deleted: user.deleted,
			datecreated: user.datecreated,
			datemodified: user.datemodified,
			id: `id_${maxId + 1}`,
			ipaddress: "",
			lastaccessed: null
		};
		sessions.push(_session);
	}
	common.writeFileCache(filepath, sessions);
}

var updateMachineName = function (data) {
	if (_machinename) {
		const tmpData = JSON.parse(data);
		tmpData.machinename = _machinename;
		data = JSON.stringify(tmpData);
	}
};

/**
 * Updates each property value in the specified data with the corresponding property value in the specified json
 * 
 * @param {any} data Json data currently stored in the cache
 * @param {any} json Json data containing new values for updating the cache
 */
var updateDataWithJson = function (data, json) {
	for (let key in json) {
		if (json.hasOwnProperty(key)) {
			if ((key in data)) {
				data[key] = json[key];
			}
		}
	}
};

module.exports = router;