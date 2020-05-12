// imports
var EventEmitter = require('events'); 
const webserver = require("./webserver.js"); // to serve the webserver
const authhandler = require("./auth-handler.js"); // to serve the webserver
const endpoints = require("./endpoints.js"); // to serve the webserver
const opn = require("opn"); //to open a browser window
const config = require("./config.json"); // read the config
const listener = new EventEmitter();
const backlistener = new EventEmitter();

// create the webserver
authhandler.password = config.password;
webserver.port = config.ports.web;
webserver.Create();

if (config.openBrowserOnStart) {
	opn("http://localhost:" + config.ports.web); //open a browser window
}