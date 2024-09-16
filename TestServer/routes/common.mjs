// -----------------------------------------------------------------------------------------------------
// common.js
// -----------------------------------------------------------------------------------------------------

import { readFileSync } from "fs";
import { networkInterfaces, hostname } from "os";
import { join, parse } from "path";
import { parse as urlParse } from "url";
import { lookup } from "dns";
import { ping } from "tcp-ping";
import moment from "moment";

//var fileroot = join(dirname(__dirname), "..\\StaticContent");
//var demodata = join(fileroot, "demo/data");
//var globalization = join(fileroot, "globalization");

var filecache = [];

/* -------------------------------------------------------------------------------------------*/
/**
 * Path to the demo data files (i.e. "./StaticContent/demo/data")
 */
export var demodata = "./StaticContent/demo/data";

/* -------------------------------------------------------------------------------------------*/
/**
 * Path to the language data files (i.e. "StaticContent/globalization")
 */
export var globalization = "StaticContent/globalization";

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the data associated with the specified file path from the filecache if it exists;
 * otherwise reads the data from disk, adds it to the cache, then returns it.
 * @param {string | number | Buffer | import("url").URL} filepath
 */
export function readFileCache (filepath) {
	var retval = "";
	for (let index = 0; index < filecache.length; index++) {
		const element = filecache[index];
		if (element.filepath === filepath) {
			retval = element.data;
			console.log('\rREAD (from cache): "%s"...', filepath);
			break;
		}
	}
	if (!retval) {
		retval = readFileSync(filepath, "utf8");
		filecache.push({
			filepath: filepath,
			data: retval,
		});
		console.log('\rREAD (from disk): "%s"...', filepath);
	}
	return retval;
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the element in the specified array corresponding to the object having the specified
 * property name and value. The 'undefined' primitive value is returned when there is no
 * matching object.
 * @param {any[]} arr the array containing property names and values
 * @param {string} propName the property name to look for
 * @param {string} propValue the property value to look for
 */
var findElement = function (arr, propName, propValue) {
	for (let i = 0; i < arr.length; i++)
		if (arr[i][propName] === propValue) return arr[i];
	return undefined;
};

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the last segment of the specified request url.
 * @param {string} requestUrl the request URL.
 * @returns {string} A filename including its extension (if any) all in lowercase.
 */
export function getLastSegment (requestUrl) {
	const fullUrl = urlParse(requestUrl, true);
	return parse(fullUrl.pathname).base.toLowerCase();
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Updates the file cache with the specified json object corresponding to the specified filepath.
 * @param {string} filepath
 * @param {object} json
 * @param {boolean} [islogged=false]
 */
export function writeFileCache (filepath, json, islogged) {
	const element = findElement(filecache, "filepath", filepath);
	if (element) {
		element.data = JSON.stringify(json);
		if (islogged) console.log("WRITE TO CACHE: %s", element.data);
	}
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns a 'timezone' object obtained from the master 'timezonelist.json' file.
 * @param {number | string } value The index of the time zone object in the time zone list or 
 * the time zone object having the 'standardname' property value in the time zone list.
 */
export function getTimeZone(value) {
	const filepath = join(demodata, "timezonelist.json");
	const data = readFileSync(filepath, "utf8");
	const json = JSON.parse(data);
	if (!Number.isInteger(value)) {
		const found = json.find(obj => obj['standardname'] === value);
		if (found)
			return found;
	}
	return json[value];
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the date that represents the specified number of milliseconds since 01-01-1970.
 * @param {string | number} The number of milliseconds to resolve.
 */
export function millisecondsToDate (milliseconds) {
	if (typeof milliseconds === "string") {
		return new Date(parseFloat(milliseconds));
	}
	return new Date(milliseconds);
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the number of milliseconds since midnight 01-01-1970 that the specified date represents.
 *  @param {string | Date} [dt] The Date [default = current Date and Time].
 */
export function dateToMilliseconds (dt) {
	return Date.parse(!dt ? new Date().toString() : dt.toString());
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the number of milliseconds UTC since midinight 01-01-1970 that the specified date 
 * represents.
 *  @param {Date} [dt] The Date and Time UTC [default = current Date and Time UTC].
 */
export function dateToMillisecondsUtc (dt) {
	if (!dt) dt = new Date();
	return Date.UTC(
		dt.getFullYear(),
		dt.getMonth(),
		dt.getDate(),
		dt.getHours(),
		dt.getMinutes(),
		dt.getSeconds()
	);
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the date that represents the specified number of milliseconds UTC since
 * midnight 01-01-1970.
 * @param {string} milliseconds
 */
export function millisecondsUtcToDate (milliseconds) {
	const millisecOffset = new Date().getTimezoneOffset() * 60000;
	return new Date(parseFloat(milliseconds) + millisecOffset);
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns a string formatted as "MM/DD/YYYY hh:mm:ss A" that the specified date represents.
 * (The current date is used when no date is specified).
 */
export function getFormattedDateTime (dt) {
	return moment(dt || new Date()).format("MM/DD/YYYY hh:mm:ss A");
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns a random integer value between the specified min [default=0] and max [default=10] 
 * values (inclusive).
 * @param {number} min
 * @param {number} max
 */
export function randomIntFromInterval (min, max) {
	min = min ? min : 0;
	max = max ? max : 10;
	return Math.floor(Math.random() * (max - min + 1) + min);
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns a randomly generated GUID (e.g. "b9eabcc0-91bc-47c3-bf34-21867891d96a").
 */
export function createGuid () {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns the specified text converted to title case (e.g. "john smith" becomes "John Smith").
 * @param {{ replace: (arg0: RegExp, arg1: (txt: any) => any) => void; }} text
 */
export function toTitleCase (text) {
	return text.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns an indication as to whether the specified IPv4 Address begins with a number.
 * @param {string} ipAddress
 */
export function startsWithNumber (ipAddress) {
	return ipAddress && /^[0-9]/.test(ipAddress);
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns an indication as to whether the specified IPv4 address represents a structurally
 * valid ip address.
 * @param {string} ipAddress
 */
export function isValidIpAddress (ipAddress) {
	const pattern =
		"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\." +
		"(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
	return new RegExp(pattern).test(ipAddress);
}

/* -------------------------------------------------------------------------------------------*/
/*
 * Returns an indication as to whether the specified IPv4 address is bound to any of the network
 * adapters on this computer.
 * @param {string} ipAddress
 */
export function isLocalIpAddress (ipAddress) {
	const interfaces = networkInterfaces();
	for (let k in interfaces) {
		if (interfaces.hasOwnProperty(k)) {
			const intrface = interfaces[k];
			for (let k2 in intrface) {
				if (intrface.hasOwnProperty(k2)) {
					const address = intrface[k2];
					if (
						address.family === "IPv4" &&
						!address.internal &&
						address.address === ipAddress
					) {
						return true;
					}
				}
			}
		}
	}
	return false;
}

/* -------------------------------------------------------------------------------------------*/
/**
 * Returns an indication as to whether the specified IP address or Host Name exists on the network.
 * @param {string} hostOrAddress
 * @param {any} port
 * @param {any} attempts
 * @param {any} timeout
 */
export function isExisting (hostOrAddress, port, attempts, timeout) {
	return new Promise(function (resolve, reject) {
		// Is it an ip address or a host name?
		if (isValidIpAddress(hostOrAddress)) {
			// Is it a local ip address?
			if (isLocalIpAddress(hostOrAddress)) {
				return resolve(
					newResponse(
						200,
						true,
						"Specified ip address is same as issuing ip address"
					)
				);
			}
		} else {
			// Does it start with a number?
			if (startsWithNumber(hostOrAddress)) {
				return resolve(newResponse(400, false, "Bad IP Address"));
			}
			// Is it the name of this host?
			if (hostOrAddress === hostname()) {
				return resolve(
					newResponse(
						200,
						true,
						"Specified host name is same as issuing host name"
					)
				);
			}
			if (!attempts) {
				// First try to look it up using DNS.
				const result = lookup(hostOrAddress);
				if (result) {
					return resolve(newResponse(200, true, ""));
				} else {
					return resolve(
						newResponse(
							200,
							false,
							"An ip address could not be obtained using specified host name"
						)
					);
				}
			}
		}
		// If all else fails, try pinging it.
		(function () {
			ping(
				{
					address: hostOrAddress,
					port: parseInt(port || 80),
					attempts: parseInt(attempts || 3),
					timeout: parseInt(timeout || 4000),
				},
				function (err, data) {
					if (!err) {
						return resolve(newResponse(200, !isNaN(data.avg), ""));
					} else {
						return resolve(newResponse(400, false, err.message));
					}
				}
			);
		})();

		/* -------------------------------------------------------------------------------------------*/
		/**
		 * Returns an anonymous JSON object used as part of the response.
		 *
		 * @param {any} status - A numerical status code.
		 * @param {any} isExisting - A boolean value that indicates whether it exists or not.
		 * @param {any} message - A string value describing the response.
		 * @returns
		 */
		function newResponse(status, isExisting, message) {
			return {
				hostoraddress: hostOrAddress,
				status: status,
				isexisting: isExisting,
				message: message,
			};
		}
	});
}

// /* -------------------------------------------------------------------------------------------*/
// /**
//  * Returns the specified date and time formatted as "mm-dd-yyyy hh:mi:ss am". If a date is not
//    specified the current date is used.
// */
// export getFormattedDateTime = function(date) {
//    const formatter = new Intl.DateTimeFormat('en-US',{
// 		month: '2-digit',day: '2-digit',year: 'numeric',
// 		hour: '2-digit',minute: '2-digit',second: '2-digit'
//   });
//   return formatter.format((date) ? date : new Date());
// };

