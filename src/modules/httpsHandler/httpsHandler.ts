import {getFilePath, readFileFromStorage_Safe} from "../../fileStorage";
import {listeningServer, overrideCreate, port, server} from "../../webserver";
import https from "https";
import * as net from "net";
import * as http from "http";
import * as express from "express";
import session from "cookie-session";
import {getConfig, registerConfigProp} from "../../configHandler";
import * as fs from "fs";

export let cert = readFileFromStorage_Safe("cert.pem");
export let key = readFileFromStorage_Safe("key.pem");

registerConfigProp("modules.httpsHandler.enabled",false);
if(getConfig("modules.httpsHandler.enabled")){

if (cert == "" || key == "") {
    console.log("HTTPS module:")
    console.log("Place cert.pem, key.pem in /files directory")
} else {
    overrideCreate(async function () {
        return await createServer();
    })
}}

async function createServer() {
    cert = readFileFromStorage_Safe("cert.pem");
    key = readFileFromStorage_Safe("key.pem");
    let httpsOptions = {
        key: key,
        cert: cert
    };
    server.use(express.static('public'));
    server.use(function (req, res, next) {
        if (req.secure) {
            // request was via https, so do no special handling
            next();
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + req.headers.host + req.url);
        }
    });
    server.use(
        session({
            secret: "3YVX&%4sy*9M6w-d",
            httpOnly: true,  // Don't let browser javascript access cookies.
            secure: true, // Only use cookies over https.
        })
    );
    let sv = httpx.createServer(httpsOptions, server);
    let _listeningServer;
    await (new Promise(function (r, j) {
        _listeningServer = sv.listen(port, () => {
            r();
        });
    }))
    console.log("https server starting on port : " + port)
    return _listeningServer;
}

module httpx {
    export function createServer(opts, handler) {

        let server = net.createServer(socket => {
            socket.once('data', buffer => {
                // Pause the socket
                socket.pause();

                // Determine if this is an HTTP(s) request
                let byte = buffer[0];

                let protocol;
                if (byte === 22) {
                    protocol = 'https';
                } else if (32 < byte && byte < 127) {
                    protocol = 'http';
                }

                let proxy = server[protocol];
                if (proxy) {
                    // Push the buffer back onto the front of the data stream
                    socket.unshift(buffer);

                    // Emit the socket to the HTTP(s) server
                    proxy.emit('connection', socket);
                }

                // As of NodeJS 10.x the socket must be
                // resumed asynchronously or the socket
                // connection hangs, potentially crashing
                // the process. Prior to NodeJS 10.x
                // the socket may be resumed synchronously.
                process.nextTick(() => socket.resume());
            });
        });

        // @ts-ignore
        server.http = http.createServer(handler);

        try{
            // @ts-ignore
            server.https = https.createServer(opts, handler);
        }catch{
            console.log("Error when creating https server!");
        }

        return server;
    }
}
