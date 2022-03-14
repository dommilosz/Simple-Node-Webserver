import {getAndRegisterConfig} from "./configHandler";
import {json, Request, Response} from "express";
import {atob, sendCompletion, sendFile, sendMissingPermissionPage, sendText} from "./wsutils";
import {loadModules, loadModulesCustom} from "./modules/modulesHandler";
import rateLimit from "express-rate-limit";

const cookieParser = require('cookie-parser');

export let server = require('express')();
export let port = getAndRegisterConfig("ports.web", 80)
export let debugRequests = getAndRegisterConfig("debugRequests", false)

export let overrideCreateCB;

export function overrideCreate(cb) {
    overrideCreateCB = cb;
}

export let events: { before: any[], default: any[], after: any[], creation: any[] } = {
    before: [],
    default: [],
    after: [],
    creation: []
}

export function addServerEventListener(type: "before" | "default" | "after" | "creation", cb) {
    events[type].push(cb);
}

loadModulesCustom("before");
events.creation.forEach(cb => cb());


server.disable('x-powered-by')

export async function Create() {
    console.log(`Starting server on port ${port}`)
    if (overrideCreateCB) {
        await overrideCreateCB();
    }

    if (!overrideCreateCB)
        await server.listen(port);

    console.log("server starting on port : " + port)
    events.default.forEach(cb => cb());
    loadModules();
    events.after.forEach(cb => cb());
    loadModulesCustom("after");
}

async function createServer() {
    await stopServer();
    await Create();
}

async function stopServer() {

}

async function restartServer() {
    await createServer();
}

createServer();

server.use(cookieParser());
server.use(json({limit: '50mb'}));
events.before.forEach(cb => cb());

export let allPermissions: any[] = [];
export let allPermissionsTree = {};

export module Endpoint {
    export function createEndPoint(url: string, type: "get" | "post", cb: (req: Request, res: Response) => void, perms = "default", _rateLimit = 60 * 5) {
        if (!perms) perms = "default";
        const apiLimiter = rateLimit({
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: _rateLimit
        });
        server.use(url, apiLimiter);
        server[type](url, async function (req: Request, res: Response) {
            if (debugRequests) {
                console.log(`[${type}]: ${url}, body:${JSON.stringify(req.body)}`)
            }
            let authHandler = require("./auth-handler")
            if (authHandler.checkPermission(req, perms)) {
                try {
                    await cb(req, res);
                    if(!res.headersSent){
                        console.error("Function returned without sending headers: ");
                        console.error(`[${type}]: ${url}, body:${JSON.stringify(req.body)}`)
                        sendText(res,"",500);
                    }
                } catch (e) {
                    sendText(res, e.message, 500);
                }
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

    export function get(url: string, cb: (req: Request, res: Response) => void, perms = "default", rateLimit = 60*5) {
        createEndPoint(url, "get", cb, perms, rateLimit);
    }

    export function post(url: string, cb: (req: Request, res: Response) => void, perms = "default", rateLimit = 60*5) {
        createEndPoint(url, "post", cb, perms, rateLimit);
    }

    export function file(file: string, perms = "default", code = 200, args?: {}) {
        get(file, function (req: Request, res: Response) {
            sendFile(req, res, file, code, args);
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

    params = req.query;

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