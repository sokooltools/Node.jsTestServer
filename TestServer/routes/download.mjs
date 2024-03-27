// -----------------------------------------------------------------------------------------------------
// download.mjs
// -----------------------------------------------------------------------------------------------------

// Example URL: http://localhost:3000/download?fn=litesw.log

// Dependencies.

// This is the web framework. see https://expressjs.com/
import express from "express";
var router = express.Router();

import fs from "fs";
import path from "path";

import url from "url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
var staticContent = path.join(path.dirname(__dirname), "..\\StaticContent");

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// https://www.iana.org/assignments/media-types/media-types.xhtml
//var mime = require("mime");
import mime from "mime";

// This gets invoked for all requests passed to this router.
router.use(function (req, res, next) {
  console.log("    Download requested: %s", new Date(Date.now()).toLocaleString());
  next();
});

router.get("/", function (req, res) {
  const fullUrl = url.parse(req.url, true);
  const parspath = path.parse(fullUrl.query.fn);
  var filename = parspath.base;
  var filepath = getFullPathOfFileName(filename);

  // Get the stats, (the 'size') related to the specified file.
  fs.stat(filepath, function (err, stat) {
    // An error is returned if the file does not exist.
    if (err) {
      let errorfile = path.join(staticContent, "docs", "error.htm");
      res.status(err.status || 404).sendFile(errorfile);
    } else {
      if (!res.headersSent) {
        const mimetype = mime.lookup(filepath);
        res.setHeader("content-type", getContentType(mimetype));
        res.setHeader("content-length", stat.size)
      }
      res.download(filepath, filename, function (ex) {
        if (ex) {
          // Keep in mind the response may be 'partially' sent so check res.headersSent
          if (res.headersSent)
            res.status(406).end();
        } else {
          if (res.headersSent)
            res.status(200).end();
        }
      });
    }
  });

  req.on("error", function (err) {
    // This prints the error message and stack trace to 'stderr'.
    console.error(err.stack);
  });
});

//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function (req, res) {
  res.status(404).send("<h2>Sorry... that address could not be found!</h2>");
});

/** Returns the full path of the specified filename. */
function getFullPathOfFileName(filename) {
  switch (filename.toLowerCase()) {
    case "pacremotedesktop.exe":
      return path.join(staticContent, "..\\", "utilities", filename);
    case "globalization.zip":
      return path.join(staticContent, "globalization", filename);
    case "pac_user_guide.pdf":
    case "webserver.exe.ini.docx":
    case "webserver.exe.log.docx":
      return path.join(staticContent, "docs", filename);
    case "codesyscontrol.cfg":
    case "litesw.log":
    case "retmem.log":
    case "sessions.json":
    case "webserver.exe.ini":
    case "webserver.exe.log":
      return path.join(staticContent, "demo", "docs", filename);
    default:
      return path.join(staticContent, "files", filename);
  }
}

/** Returns the content-type string based on the mime type. */
function getContentType(mimeType) {
  const charsetUtf8 = "; charset=UTF-8";
  // Content types that do not start with text/.. but usually contain charset=utf-8
  const specialCase = [
    "application/json",
    "application/xml",
    "application/rss+xml",
  ];
  let outputContentType = mimeType;
  // Return undefined.
  if (!outputContentType)
    return;
  if (outputContentType.startsWith("text/") || specialCase.includes(outputContentType)) {
    // Combine Content-Type with charset=utf-8
    outputContentType = outputContentType + charsetUtf8;
    // Return combined.
    return outputContentType;
  } else {
    // Return for any other types or undefined.
    return outputContentType;
  }
}

export default router;
