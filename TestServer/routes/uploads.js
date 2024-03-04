// -----------------------------------------------------------------------------------------------------
// uploads.js
// -----------------------------------------------------------------------------------------------------

/**
 * NodeJs Server-Side  Uploader (traditional endpoints).
 * 
 *  - handles non-CORS environments
 *  - handles delete file requests assuming the method is DELETE
 *  - Ensures the file size does not exceed the max
 *  - Handles chunked upload requests
 *
 * Requirements:
 *  - express (for handling requests)
 *  - multiparty (for parsing request payloads)
 *  - mkdirp (for "mkdir -p" support)
 */

// Dependencies
var express = require("express");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var formidable = require("formidable");

// Paths/constants
var fileInputName = process.env.FILE_INPUT_NAME || "qqfile";

var uploadedFilesPath = process.env.UPLOADED_FILES_DIR || path.join(__dirname, "../../Uploaded/");
var maxFileSize = process.env.MAX_FILE_SIZE || 0; // in bytes, 0 for unlimited
var chunkDirName = "chunks";

var router = express.Router();

router.post("/", onUpload);

router.delete("//:uuid", onDeleteFile);

// -----------------------------------------------------------------------------------------------------
// onUpload
// -----------------------------------------------------------------------------------------------------
function onUpload(req, res) {
	const form = new formidable.IncomingForm();
	form.parse(req, function (err, fields, files) {
		const partIndex = fields.qqpartindex;

		// Requires "text/plain" to ensure support for IE9 and older.
		res.set("Content-Type", "text/plain");

		if (partIndex == null) {
			onSimpleUpload(fields, files[fileInputName], res);
		} else {
			onChunkedUpload(fields, files[fileInputName], res);
		}
	});
}

// -----------------------------------------------------------------------------------------------------
// onSimpleUpload
// -----------------------------------------------------------------------------------------------------
function onSimpleUpload(fields, file, res) {
	const uuid = fields.qquuid;
	var responseData = {
		success: false,
		filePath: file.path
	};
	file.name = fields.qqfilename;
	if (isValid(file.size)) {
		moveUploadedFile(file, uuid, function () {
			responseData.success = true;
			res.send(responseData);
		},
			function () {
				responseData.error = "Problem copying the file!";
				res.send(responseData);
			});
	} else {
		failWithTooBigFile(responseData, res);
	}
}

// -----------------------------------------------------------------------------------------------------
// onChunkedUpload
// -----------------------------------------------------------------------------------------------------
function onChunkedUpload(fields, file, res) {
	const size = parseInt(fields.qqtotalfilesize);
	var uuid = fields.qquuid,
		index = fields.qqpartindex,
		totalParts = parseInt(fields.qqtotalparts),
		responseData = {
			success: false
		};
	file.name = fields.qqfilename;
	if (isValid(size)) {
		storeChunk(file, uuid, index, totalParts, function () {
			if (index < totalParts - 1) {
				responseData.success = true;
				res.send(responseData);
			} else {
				combineChunks(file, uuid, function () {
					responseData.success = true;
					res.send(responseData);
				},
					function () {
						responseData.error = "Problem combining the chunks!";
						res.send(responseData);
					});
			}
		},
			function () {
				responseData.error = "Problem storing the chunk!";
				res.send(responseData);
			});
	} else {
		failWithTooBigFile(responseData, res);
	}
}

// -----------------------------------------------------------------------------------------------------
// failWithTooBigFile
// -----------------------------------------------------------------------------------------------------
function failWithTooBigFile(responseData, res) {
	responseData.error = "Too big!";
	responseData.preventRetry = true;
	res.send(responseData);
}

// -----------------------------------------------------------------------------------------------------
// onDeleteFile
// -----------------------------------------------------------------------------------------------------
function onDeleteFile(req, res) {
	const uuid = req.params.uuid;
	const fpth = uploadedFilesPath + uuid;
	//rimraf(fpth, function(error) { // RAS
	fs.unlink(fpth, function (error) {
		if (error) {
			console.error(`Problem deleting file! ${error}`);
			res.status(500);
		}
		res.send();
	});
}

/* -------------------------------------------------------------------------------------------*/ /**
 * Moves the specified uploaded file to its destination.
 * @param {object} the the uploaded file
 * @param {string} uuid the uuid
 * @param {any} success the success callback
 * @param {any} failure the failure callback
 */
function moveUploadedFile(file, uuid, success, failure) {
	//var destinationDir = uploadedFilesPath + uuid + "/"; // RAS
	const destinationDir = uploadedFilesPath; // + "/"; // RAS 02/13/2024
	const fileDestination = path.join(destinationDir, file.name);
	moveFile(destinationDir, file.path, fileDestination, success, failure);
}

/* -------------------------------------------------------------------------------------------*/ /**
 * Stores the specified file as chunks.
 * @param {object} file The file object
 * @param {string} uuid The uuid
 * @param {number} index The index
 * @param {number} numChunks The number of chunks
 * @param {any} success The success callback
 * @param {any} failure The failure callback
 */
function storeChunk(file, uuid, index, numChunks, success, failure) {
	const destinationDir = path.join(uploadedFilesPath + uuid, chunkDirName);
	const chunkFilename = getChunkFilename(index, numChunks);
	const fileDestination = path.join(destinationDir, chunkFilename);
	moveFile(destinationDir, file.path, fileDestination, success, failure);
}

/* -------------------------------------------------------------------------------------------*/ /**
 * Combines chunks.
 * @param {object} file 
 * @param {string} uuid The uuid
 * @param {any} success The success callback
 * @param {any} failure The failure callback
 */
function combineChunks(file, uuid, success, failure) {
	var chunksDir = path.join(uploadedFilesPath + uuid, chunkDirName);
	const destinationDir = uploadedFilesPath + uuid ;
	var fileDestination = path.join(destinationDir, file.name);
	fs.readdir(chunksDir, function (err, fileNames) {
		var destFileStream;
		if (err) {
			console.error(`Problem listing chunks! ${err}`);
			failure();
		} else {
			fileNames.sort();
			destFileStream = fs.createWriteStream(fileDestination, { flags: "a" });

			appendToStream(destFileStream, chunksDir, fileNames, 0, function () {
				//rimraf(chunksDir, function(rimrafError) { // RAS
				fs.unlink(chunksDir, function (rimrafError) {
					if (rimrafError) {
						console.log(`Problem deleting chunks dir! ${rimrafError}`);
					}
				});
				success();
			},
				failure);
		}
	});
}

/* -------------------------------------------------------------------------------------------*/ /**
 * Returns an indication whether the specified size does not exceed the maximum allowed.
 * @param {number} size The size to check.
 * @returns {boolean} true or false
 */
function isValid(size) {
	return maxFileSize === 0 || size < maxFileSize;
}

/* -------------------------------------------------------------------------------------------*/ /**
 * Moves a file from its source to its destination.
 * @param {string} destinationDir The directory to move the file to.
 * @param {string} sourceFile The source file.
 * @param {string} destinationFile The destination file.
 * @param {any} success The callback on success.
 * @param {any} failure The callback on failure.
 */
function moveFile(destinationDir, sourceFile, destinationFile, success, failure) {
	mkdirp(destinationDir, function (error) {
		var sourceStream, destStream;
		if (error) {
			console.error(`Problem creating directory ${destinationDir}: ${error}`);
			failure();
		} else {
			sourceStream = fs.createReadStream(sourceFile);
			destStream = fs.createWriteStream(destinationFile);

			sourceStream
				.on("error", function (err) {
					console.error(`Problem copying file: ${err.stack}`);
					destStream.end();
					failure();
				})
				.on("end", function () {
					destStream.end();
					// Delete source file from temp folder.
					fs.unlink(this.path, function (err) {
						if (err) {
							console.log(`Problem deleting source file! ${err}`);
						}
					});
					success();
				})
				.pipe(destStream);
		}
	});
}

function appendToStream(destStream, srcDir, srcFilesnames, index, success, failure) {
	if (index < srcFilesnames.length) {
		fs.createReadStream(srcDir + srcFilesnames[index])
			.on("end", function () {
				appendToStream(destStream, srcDir, srcFilesnames, index + 1, success, failure);
			})
			.on("error", function (error) {
				console.error(`Issue appending chunk: ${error}`);
				destStream.end();
				failure();
			})
			.pipe(destStream, { end: false });
	} else {
		destStream.end();
		success();
	}
}

function getChunkFilename(index, count) {
	const digits = new String(count).length;
	const zeros = new Array(digits + 1).join("0");
	return (zeros + index).slice(-digits);
}

module.exports = router;