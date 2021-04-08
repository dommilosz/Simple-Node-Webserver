import {config} from "./configHandler";
import {json, Request, Response} from "express";
import {atob, sendFile, sendText} from "./wsutils";
const cookieParser = require('cookie-parser');
import {loadModules, loadModulesCustom} from "./modules/modulesHandler";

export let server = require('express')();
export let port = config.ports.web;

export let overrideCreateCB;

export function overrideCreate(cb) {
    overrideCreateCB = cb;
}

export let listeningServer;

export async function Create() {
    loadModulesCustom("before");
    console.log(`Starting server on port ${port}`)
    let _listeningServer;
    if (overrideCreateCB) {
        _listeningServer = await overrideCreateCB();
        loadModules();
        return _listeningServer;
    }

    await (new Promise<void>(function (r, j) {
        _listeningServer = server.listen(port, () => {
            r();
        });
    }))
    console.log("server starting on port : " + port)
    loadModules();
    return _listeningServer;
}

async function createServer(){
    listeningServer = await Create();
};
createServer();

server.use(cookieParser());
server.use(json({limit: '50mb'}));

export let allPermissions: any[] = [];
export let allPermissionsTree = {};
export module Endpoint {
    export function createEndPoint(url, type: "get" | "post", cb, perms?) {
        if (!perms) perms = "default"
        server[type](url, function (req: Request, res: Response) {
            let authHandler = require("./auth-handler")
            if (authHandler.checkPermission(req, perms)) {
                cb(req, res);
            } else {
                if (!authHandler.checkLogin(req)) {
                    authHandler.sendLoginPage(req, res);
                    return;
                }
                sendText(res, `<script src="jsu.js"></script><h1>403 - Forbidden</h1>You don't have access to this resource<br>Permission: <code>${perms}</code>`, 403)
            }

        });
        if (perms != "default" && !allPermissions.includes(perms))
            allPermissions.push(perms);
        allPermissionsTree = permsToTree(allPermissions);
    }

    export function get(url, cb, perms?) {
        createEndPoint(url, "get", cb, perms);
    }

    export function post(url, cb, perms?) {
        createEndPoint(url, "post", cb, perms);
    }
}

Endpoint.get("/jsu.js", function (req: Request, res: Response) {
    sendFile(req, res, "src/jsutils.js", 200);
});


export function GetParams(req) {
    let url = req.originalUrl
    let params: any = {};

    let regex = /\?[a-z0-9]*=[^?]*/gm;
    let m;
    while ((m = regex.exec(url)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match, groupIndex) => {
            match = match.replace('?', '')
            let matcharr = match.split('=')
            matcharr.shift()
            params[match.split('=')[0]] = matcharr.join('=')
        });
    }

    if (!params.hash || params.hash == "undefined") params.hash = req.cookies.hash;
    if (!params.username || params.username == "undefined") params.username = req.cookies.username;

    let authh = require("./auth-handler");
    if (!params.password && (!params.hash || !authh.getHash(params.hash))) {
        params.password = req.cookies.password;
        authh.LoginRaw(atob(params.username), params.password, req, req.res)
    }


    return params
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, {[key]: {}});
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {[key]: source[key]});
            }
        }
    }

    return mergeDeep(target, ...sources);
}

function permsToTree(perms: any[]) {
    let permsObj = {};
    perms.forEach(el => {
        permsObj = combineJSON(permsObj, permToTree(el))
    })
    return permsObj;
}

function combineJSON(json1, json2) {
    return mergeDeep(json1, json2)
}

function permToTree(perm) {
    const array = perm.split('.');
    const object = {};
    array.reduce(function (o, s) {
        return o[s] = {};
    }, object);
    return object;
}