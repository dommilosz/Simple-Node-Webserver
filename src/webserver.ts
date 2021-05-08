import {getAndRegisterConfig} from "./configHandler";
import {json, Request, Response} from "express";
import {atob, sendCompletion, sendFile, sendMissingPermissionPage} from "./wsutils";
import {loadModules, loadModulesCustom} from "./modules/modulesHandler";

const cookieParser = require('cookie-parser');

export let server = require('express')();
export let port = getAndRegisterConfig("ports.web", 8080)

export let overrideCreateCB;

export function overrideCreate(cb) {
    overrideCreateCB = cb;
}

export let listeningServer;
server.disable('x-powered-by')

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
    loadModulesCustom("after");
    return _listeningServer;
}

async function createServer() {
    await stopServer();
    listeningServer = await Create();
}

async function stopServer() {
    if (!listeningServer) return;
    try {
        console.log("Stopping server");
        listeningServer.close();
    } catch {

    }
}

async function restartServer() {
    await createServer();
}

createServer();

server.use(cookieParser());
server.use(json({limit: '50mb'}));

export let allPermissions: any[] = [];
export let allPermissionsTree = {};

export module Endpoint {
    export function createEndPoint(url: string, type: "get" | "post", cb: (req: Request, res: Response) => void, perms?: string) {
        if (!perms) perms = "default"
        server[type](url, function (req: Request, res: Response) {
            let authHandler = require("./auth-handler")
            if (authHandler.checkPermission(req, perms)) {
                cb(req, res);
            } else {
                if (!authHandler.checkLogin(req)) {
                    authHandler.sendLoginPage(req, res, perms);
                    return;
                }
                sendMissingPermissionPage(perms, res);
            }

        });
        registerPermission(perms);
    }

    export function get(url: string, cb: (req: Request, res: Response) => void, perms?: string) {
        createEndPoint(url, "get", cb, perms);
    }

    export function post(url: string, cb: (req: Request, res: Response) => void, perms?: string) {
        createEndPoint(url, "post", cb, perms);
    }

    export function file(file: string, perms?: string, code?: number, args?: {}) {
        get(file, function (req: Request, res: Response) {
            sendFile(req, res, file, code | 200, args);
        }, perms)
    }
}

Endpoint.get("/jsu.js", function (req: Request, res: Response) {
    sendFile(req, res, "src/jsutils.js", 200);
});
Endpoint.get("/forage.js", function (req: Request, res: Response) {
    sendFile(req, res, "src/localForage.js", 200);
});
Endpoint.post("/serverAction", function (req: Request, res: Response) {
    let body = req.body;
    if (!body) sendCompletion(res, "Body not found", true, 400);
    if (!body.actionType) sendCompletion(res, "Action not found", true, 400);
    let actionType = body.actionType;

    switch (actionType) {
        case "restart": {
            restartServer();
            break;
        }
        case "stop": {
            stopServer();
            break;
        }
    }

}, "admin.manage");


export function registerPermission(perms) {
    if (perms != "default" && !allPermissions.includes(perms))
        allPermissions.push(perms);
    allPermissionsTree = permsToTree(allPermissions);
}

export function removePermissions(perms: string) {
    allPermissions.forEach((el: string, i) => {
        if (el.startsWith(perms))
            allPermissions.splice(i, 1);
    })
    allPermissionsTree = permsToTree(allPermissions);
}

export let expandPermissionsCallback;

export function OverrideExpandPermissions(cb: (username, perm) => void) {
    expandPermissionsCallback = cb;
}

export function expandPermissions(username, perm): boolean {
    return expandPermissionsCallback(username, perm);
}

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

    if (!params.password) {
        params.password = req.cookies.password;
    }

    if (!params.hash || !authh.getHash(params.hash)) {
        params.hash = authh.Login(atob(params.username), atob(params.password), req, req.res, false);
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