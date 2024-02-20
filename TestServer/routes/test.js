// -----------------------------------------------------------------------------------------------------
// test.js  ( e.g. http://localhost:3000/test/about or http://localhost:3000/test/clear )
// -----------------------------------------------------------------------------------------------------

var express = require("express");
var router = express.Router();
var fs = require("fs");

var common = require("./common");
const { dirname, join } = require("path");

// Middleware that is specific to this route.
router.use(function (req, res, next) {
    // This writes a line containing the date and time preceding all the methods below. 
    console.log(common.getFormattedDateTime());
    next();
});

// Define the home page route
router.get("/", function (req, res) {
    res.send("<h1>Test home page</h1>");
});

// Define the about route.
router.get("/about", function (req, res) {
    res.send("<h2>Test About</h2>");
});

// Clears the Nodejs console window.
router.get("/clear", function () {
    console.log("\x1Bc");
});

// Define a json route
router.get("/json", function (req, res) {
    const json = JSON.stringify({
        key1: "value1",
        key2: "value2",
        key3: "value3"
    }, null, 4);
    res.send(json);
});

// Define an array route
router.get("/array", function (req, res) {
    res.send([1, 2, 3]);
});

router.get("/version", function (req, res) {
    //const ver = require(join(dirname(require.resolve(req.query.module)), "package.json")).version;
    //res.send(`Version of '${req.query.module}' module is ${ver}`);

    fs.readFile("package.json", (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        const obj = {};
        const packageJson = JSON.parse(data);
        if (!packageJson) {
            console.error("Could not load the dependencies data from 'package.json' file.");
        } else {
            const keys = Object.keys(packageJson.dependencies);
            for (const key of keys) {
                try {
                    const dir = join(key, "package.json");
                    const resolved = require.resolve(dir);
                    obj[key] = require(resolved).version;
                } catch (err) {
                    console.error(`Could not resolve: '${key}'`);
                    continue;
                }
            }
        }
        var json = JSON.stringify(obj, null, 4);
        res.send(`versions: ${json}`);
        //res.json({ versions: obj });
    });

});

//The 404 Route (ALWAYS keep this as the last route in the event no other processes the request)
router.get("*", function (req, res) {
    res.status(404).send("<h3>Sorry... that address could not be found!</h3>");
});

module.exports = router;
