console.clear();

console.log(`You are running 'scrapbook.mjs'...\n`);

import * as cmn from "./routes/common.mjs";
import { join } from "path";
import { readFileSync } from "fs";

let dt = new Date();
console.log("let dt = new Date();\n");

console.log("getFormattedDateTime(dt) --> ", cmn.getFormattedDateTime(dt), "\n");

let dtms = cmn.dateToMilliseconds(dt);

console.log("dateToMilliseconds(dt) --> ", dtms, "\n");

console.log(`millisecondsToDate(${dtms}) --> `, cmn.millisecondsToDate(dtms), "\n");

console.log("dateToMillisecondsUtc(dt) --> ", cmn.dateToMillisecondsUtc(dt), "\n");

console.log("getFormattedDateTime() --> ", cmn.getFormattedDateTime(), "\n");

console.log("randomIntFromInterval() --> ", cmn.randomIntFromInterval(), "\n");

console.log("isValidIpAddress('127.0.1.256') --> ", cmn.isValidIpAddress('127.0.1.256'), "\n");

console.log("isLocalIpAddress('127.0.0.1') --> ", cmn.isLocalIpAddress('127.0.0.1'), "\n");

console.log("createGuid() --> ", cmn.createGuid(), "\n");

console.log("createGuid() --> ", cmn.createGuid(), "\n");

console.log("createGuid() --> ", cmn.createGuid(), "\n");

console.log("getTimeZone(96) --> \n", cmn.getTimeZone(96), "\n");

console.log("getTimeZone('Pacific Standard Time') --> \n", cmn.getTimeZone('Pacific Standard Time'), "\n");

console.log("getTimeZone(95) --> \n", cmn.getTimeZone(95), "\n");

const array = [1, 2, 3, 4, 5];
console.log("const array =", array, ";");
const newArray = array.slice(0, -2);
console.log("const newArray = array.slice(0, -2);")
console.log("newArray -->", newArray, "\n");

//                  0         1        2         3        4
const fruits = ['Banana', 'Orange', 'Apple', 'Mango', 'Grape'];
console.log("const fruits =", fruits, "\n");

fruits.splice(2, 2, 'Lemon', 'Kiwi');
console.log("fruits.splice(2, 2, 'Lemon', 'Kiwi');")
console.log("fruits -->", fruits, "\n");

//debugger;