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

console.log(`millisecondsToDate(${dtms}) --> `, cmn.millisecondsToDate(dtms), "\n");

console.log("dateToMillisecondsUtc(dt) --> ", cmn.dateToMillisecondsUtc(dt), "\n");

console.log("getFormattedDateTime() --> ", cmn.getFormattedDateTime(), "\n");

for (let index = 0; index < 10; index++) {
	console.log("randomIntFromInterval() --> ", cmn.randomIntFromInterval(), "\n");
}

for (let index = 0; index < 10; index++) {
	console.log("randomIntFromInterval(10, 20) --> ", cmn.randomIntFromInterval(10, 20), "\n");
}

const tokens = [0, 1, 100, 255, 256, 257, 'A'];
tokens.forEach(token => {
	let ipAddress = `127.0.0.${token}`;
	console.log(`isValidIpAddress('${ipAddress}') --> `, cmn.isValidIpAddress(`${ipAddress}`), "\n");
});

console.log("isLocalIpAddress('192.68.1.100') --> ", cmn.isLocalIpAddress('192.68.1.100'), "\n");

for (let index = 0; index < 10; index++) {
	console.log("createGuid() --> ", cmn.createGuid(), "\n");
}

for (let index = 91; index < 100; index++) {
	console.log(`getTimeZone(${index}) -->`, cmn.getTimeZone(index), "\n");
}

const timezoneNames = ['Pacific Standard Time', 'US Mountain Standard Time', 'Mountain Standard Time',
	'Alaskan Standard Time', 'Bogus Standard Time'];
timezoneNames.forEach(tzn => {
	console.log(`getTimeZone('${tzn}') -->`, cmn.getTimeZone(tzn), "\n");
});

const array = [1, 2, 3, 4, 5];
console.log("const array =", array, ";");
const newArray = array.slice(0, -2);
console.log("const newArray = array.slice(0, -2);")
console.log("newArray -->", newArray, "\n");

//                  0         1        2         3        4
const fruits = ['Banana', 'Orange', 'Apple', 'Mango', 'Grape'];
console.log("const fruits =", fruits);
fruits.splice(2, 2, 'Lemon', 'Kiwi');
console.log("fruits.splice(2, 2, 'Lemon', 'Kiwi');")
console.log("fruits -->", fruits, "\n");

//debugger;