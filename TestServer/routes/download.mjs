// -----------------------------------------------------------------------------------------------------
// downloadd.mjs
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
const staticContent = path.join(path.dirname(__dirname), "..\\StaticContent");

//import { createRequire } from 'module';
//const require = createRequire(import.meta.url);

//import mime from "mime";

// This gets invoked for all requests passed to this router.
// router.use(function (req, res, next) {
//   console.log("    Download requested: %s", new Date(Date.now()).toLocaleString());
//   next();
// });

router.get("/", function (req, res) {
  const fullUrl = url.parse(req.url, true);
  const parspath = path.parse(fullUrl.query.fn);
  const filename = parspath.base;
  const filepath = getFullPathForFilename(filename);

  // The HTTP 200 : Server is sending the requested resource in the response.

  // The HTTP 304 : Server found no changes in the requested page since your 
  // last visit. After that, your browser will retrieve the cached version of 
  // the web page in your local storage.

  // The HTTP 206 : Partial content success, i.e., The  request has succeeded 
  // and the body contains the requested ranges of data, as described in the 
  // Range header of the request.

  // if (!res.headersSent) {
  //   const mimetype = mime.getType(filepath) || "text/plain";
  //   res.setHeader("content-type", getContentType(mimetype));
  //   res.setHeader("content-length", fs.statSync(filepath).size);
  // }

  if (fs.existsSync(filepath)) {
    res.download(filepath, filename, function(ex) {
      if (ex) {
        if (res.headersSent)
          //res.send({ error: ex, msg: "Problem downloading the file!" });
        console.log("Problem downloading the file!");
      }
    }
    );
  }
  else {
    res.status(404).send("Specified file does not exist!");
  }
});

//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function (req, res) {
  res.status(404).send("<h2>Sorry... that address could not be found!</h2>");
});

/** Returns the full path of the specified filename. */
function getFullPathForFilename(filename) {
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

/** Returns the content-type + charset string based on the mime type. */
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
    outputContentType += charsetUtf8;
    // Return combined.
    return outputContentType;
  } else {
    // Return for any other types or undefined.
    return outputContentType;
  }
}

export default router;