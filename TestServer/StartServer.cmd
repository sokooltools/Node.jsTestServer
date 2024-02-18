@echo off

call :perform

REM start node --inspect=localhost:5555 
REM start nodemon --debug=5555 app.js
REM start http://localhost:3300

REM var inspect = require("debug")("TestServer");
REM var app = require("./app");
REM app.set("port", 1337);

REM var server = app.listen(app.get("port"), function() {
REM 	inspect("Test Server (Express) listening on port " + server.address().port);
REM });

:perform
:: Make sure we're running in the same directory as this script.
cd /d %~dp0
:: Display the 'Windows' version.
ver
:: Display the 'NodeJs' version.
for /f "tokens=*" %%a in ('NODE -v') do set _nodeVer=%%a
echo NodeJs            [%_nodeVer%]
:: Display the 'NPM' version.
for /f "tokens=*" %%a in ('NPM -v')  do set _npmVer=%%a
echo NPM               [v%_npmVer%]
:: Start the server
set DEBUG=testserver:* & set PORT=3000 & npm start 
