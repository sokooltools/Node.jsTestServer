console.clear();

console.log(`You are running 'scrapbook.mjs'...\n`);

import * as cmn from "./routes/common.mjs";

//import { join } from "path";
//import { readFileSync } from "fs";

let dt = new Date();
console.log("let dt = new Date();\n");

console.log("dt =", dt, "\n");

console.log("getFormattedDateTime(dt) --> ", cmn.getFormattedDateTime(dt), "\n");

let dtms = cmn.dateToMilliseconds(dt);

console.log("dateToMilliseconds(dt) --> ", dtms, "\n");