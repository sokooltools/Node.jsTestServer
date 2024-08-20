var Vanilla = {};
Vanilla.key = "Vanilla";

//const jquery_url = "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js";

/**
 * Downloads a test zip file to the "Downloads" folder.
 * 
 */
Vanilla.downloadZip = function () {
	const zip = new JSZip();
	zip.file("test1.js", "Test1\n");
	zip.file("test2.js", "Test2\n");
	zip.file("test3.js", "Test3\n");
	zip
		.generateAsync({
			type: "base64"
		})
		.then(
			function (base64) {
				window.location = `data:application/zip;base64,${base64}`;
			},
			function (err) {
				console.error(err);
			}
		);
};

Vanilla.MatchPortion = Object.freeze({
	EQUALS: 0,
	INCLUDES: 1,
	STARTSWITH: 2,
	ENDSWITH: 3
});

/**
 * Returns an indication as to whether the specifed part of the URL matches 
 * the 'src' attribute of any 'Script' tag in the current document.
 * 
 * @param {string} url The url to check.
 * @param {MatchPortion} matchPortion The portion of the URL to check for a match.
 * @returns true if the specified portion of the URL has a match; otherwise false.
 */
Vanilla.isExistingScript = function (url, matchPortion) {
	const scripts = document.getElementsByTagName("script");
	for (let i = 0; i < scripts.length; i++) {
		const src = scripts[i].src.toLocaleLowerCase();
		url = url.toLocaleLowerCase();
		if (matchPortion === Vanilla.MatchPortion.STARTSWITH && src.startsWith(url)) return true;
		else if (matchPortion === Vanilla.MatchPortion.ENDSWITH && src.endsWith(url)) return true;
		else if (matchPortion === Vanilla.MatchPortion.INCLUDES && src.includes(url)) return true;
		else if (matchPortion === Vanilla.MatchPortion.EQUALS && src === url) return true;
	}
	return false;
}

/**
 * Returns an indication as to whether the receiver contains a function with the specified name.
 * 
 * @param {any} receiver The receiver (such as this).
 * @param {string} functionName The name of the function (e.g. "jQuery", "JSZip", etc.).
 * @returns 
 */
function functionExists(receiver, functionName) {
	return typeof receiver[functionName] === "function";
}

/**
 * Loads jQuery into the current window.
 * 
 * @returns A Promise
 */
function loadjQuery(url, functionName) {
	return new Promise((resolve) => {
		console.log(`Loading '${functionName}'... ('${url}')`);
		if (!functionExists(this, "jQuery")) {
			const s = document.createElement("script");
			s.setAttribute("type", "text/javascript");
			s.setAttribute("src", url);
			s.integrity = "sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs";
			s.setAttribute("crossOrigin", "");
			s.addEventListener("load", function () {
				console.log("jQuery loaded successfully.");
				if (!window.$) {
					jQuery.noConflict();
					console.log("`$` already in use; use `jQuery`");
				}
				resolve();
			});
			document.getElementsByTagName("head")[0].appendChild(s);
		} else {
			console.log("jQuery already loaded.");
			resolve();
		}
	});
}

/**
 * Dynamically loads a script as long as the script doesn't already exist in the current
 * page.
 *
 * Example usage:
 * Vanilla.loadScript('../scripts/jquery.min.js', 'jQuery');
 *
 * @param {string} url The URL of the script to load.
 * @param {string} functionName The name of the function to check for existence.
 */
Vanilla.loadScript = function (url, functionName) {
	return new Promise((resolve, reject) => {
		const jqueryUrl = "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js";
		loadjQuery(jqueryUrl, "jQuery")
			.then(() => {
				console.log(`Loading '${functionName}'... ('${url}')`);
				if (!functionExists(window, functionName)) {
					fetch(url, {
						headers: {
							"Content-Type": "text/javascript"
						},
						cache: "default",
						mode: "cors"
						})
						.then((response) => response.text())
						.then((data) => {
							const dynamicFunction = new Function(data);
							dynamicFunction();
							console.log(`'${functionName}' loaded successfully.`);
							resolve();
						})
						.catch((err) => {
							console.error("Error:", err);
							reject();
						});
				} else {
					console.log(`'${functionName}' already loaded.`);
					resolve();
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				reject();
			});
	});
};