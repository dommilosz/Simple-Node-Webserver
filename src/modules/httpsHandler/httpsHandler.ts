import {readFileFromStorage_Safe} from "../../fileStorage";
import {addServerEventListener, Endpoint, overrideCreate, port, server} from "../../webserver";
import * as https from "https";
import * as net from "net";
import * as http from "http";
import * as express from "express";
import {getAndRegisterConfig, getConfig} from "../../configHandler";
import {currentModule} from "../modulesHandler";
import {sendFile, sendText} from "../../wsutils";
import httpolyglot from "httpolyglot";
import helmet from "helmet";

const session = require("cookie-session");

export let cert = readFileFromStorage_Safe("cert.pem");
export let key = readFileFromStorage_Safe("key.pem");

if (cert == "" || key == "") {
    console.log("HTTPS module:")
    console.log("Place cert.pem, key.pem in /files directory")
} else {
    overrideCreate(async function () {
        return await createServer();
    })
}

let hsts = getAndRegisterConfig(`modules.${currentModule}.hsts`, true);

async function createServer() {
    cert = readFileFromStorage_Safe("cert.pem");
    key = readFileFromStorage_Safe("key.pem");
    let httpsOptions = {
        key: key,
        cert: cert
    };
    let _server = httpolyglot.createServer(httpsOptions,function(req,res) {
        if (!req.socket.encrypted) {
            // Redirect to https
            res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
            res.end();
        } else {
            // The express app or any other compatible app
            server.apply(server,arguments);
        }
    });
    await _server.listen(port);

    console.log("https server starting on port : " + port);
}

addServerEventListener("default",()=>{
    Endpoint.get("/cert",(req,res)=>{
        sendText(res,cert,200)
    })
})
addServerEventListener("creation",()=>{
    server.use(helmet.hsts());
})
