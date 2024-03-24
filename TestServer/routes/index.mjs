// -----------------------------------------------------------------------------------------------------
// index.js
// -----------------------------------------------------------------------------------------------------

import { join } from "path";
import { Router } from "express";
var router = Router();

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// This is used to open the home page when running in debug.
// (The file contains a redirect to "demo.htm" on the load event).
router.get("/", function (req, res) {
  // "D:\Users\Ronn\Documents\Visual Studio 2019\DevTools\ParkerConfigTool\TestServer\views\index.htm"
  const file = join(__dirname, "../views/index.htm");
  res.sendFile(file);
});

export default router;
