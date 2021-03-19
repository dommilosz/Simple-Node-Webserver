import {allPermissions, allPermissionsTree, Endpoint, GetParams} from "./webserver";
import {Request, Response} from "express";
import {config} from "./configHandler";
import {atob, btoa, consoleLog, sendCompletion, sendFile, sendJSON, sendText} from "./wsutils";

const auth = require("./auth-handler");
export let hashes_arr = {}

export let password = config.password;
export let admin_password = config.admin_password

export let checkUsernameOverride;
export function checkUsername (username){
    if(checkUsernameOverride){
        return checkUsernameOverride(username);
    }
    return true;
}

export function overrideCheckUsername(cb){
    checkUsernameOverride = cb;
}

export let checkUserPermsOverride;
export function checkUserPerms (username,password){
    if(checkUserPermsOverride){
        return checkUserPermsOverride(username,password);
    }
    if(password==admin_password){
        return "*.*";
    }
    if(password==password){
        return "user.*";
    }
}

export function overrideCheckUserPerms(cb){
    checkUserPermsOverride = cb;
}

export function returnPassword(req, admin) {
    if (returnPassCallback) return returnPassCallback(req, admin);

    if (admin) return admin_password;
    return password;
}

export function getHashFromReq(req){
    let params: any = GetParams(req)
    return params.hash;
}

export function checkPermission(req,perm){
    if(perm.split('.')[0]=="default")return true;
    let hash = getHash(getHashFromReq(req));
    if(!hash)return false;
    let canAccess = false;
    let params = GetParams(req);
    let perms = checkUserPerms(atob(params.username),params.password);
    perms.split(';').forEach(el=>{
        if(checkPerm(el,perm))canAccess = true;
    })
    return canAccess;
}

export function checkPerm(uperm, perm) {
    let perma = perm.split('.')
    let uperma = uperm.split('.')
    let boolperms = true;
    let forceperms = false;

    if(perma[0]=="default")return true;

    perma.forEach((el, i) => {
        if (boolperms && uperma[i] == "*") {
            boolperms = true;
            forceperms = true;
        }
        if (el != uperma[i]) {
            boolperms = false;
        }

    })
    return (boolperms || forceperms)
}

Endpoint.get("/checkLogin", function (req: Request, res: Response) {
    let perms = "user.*";
    try{
        let params = GetParams(req);
        perms = checkUserPerms(atob(params.username),params.password);
    }catch {}


    sendJSON(res, ({permissions:perms, login: checkLogin(req)}), 200)
    return;
});

Endpoint.get("/logout", function (req: Request, res: Response) {
    if (checkLogin(req)) {
        res.cookie('hash', '', {maxAge: 360000});
        res.cookie('username', '', {maxAge: 360000});
        sendText(res, "Logged out", 200)

        let params: any = GetParams(req)
        let hash = params.hash;
        setProp(hash, "expired", true)
        setProp(hash, "lastUpdated", Math.round(+new Date() / 1000) - (config.auth.token_lifetime + 60))
        checkHashes()

        return;
    }
});

Endpoint.post("/auth", function (req: Request, res: Response) {
    let params: any = req.body
    if (params.username && params.username.trim() != "") {
        params.username = atob(params.username)
        params.password = atob(params.password)
        Login(params.username, params.password, req, res)
        return;
    }
    sendCompletion(res, `INVALID PASSWORD`, true, 403)
    auth.setConnTimeout(req, config.auth.invalidTimeout)
});

export function Login(username, password, req, res) {
    let admin = req.url.includes('?admin=1');
    let loggedAsAdmin = false;

    if (!password||password.length < 1) {
        sendCompletion(res, `INVALID PASSWORD`, true, 403)
        return;
    }
    if (auth.checkTimeout(req)) {
        sendCompletion(res, `SLOW DOWN! - Wait ${auth.checkTimeout(req)}ms`, true, 403)
        return;
    }
    if (!username || username.length < 1 || (!username && username.trim() == "")||!checkUsername(username)) {

        sendCompletion(res, `INVALID USERNAME`, true, 403)
        return;
    }
    let requiredPassword = returnPassword(req, false)
    let requiredPasswordAdmin = returnPassword(req, true)
    if ((requiredPasswordAdmin != password) && (requiredPassword != password)) {
        sendCompletion(res, `INVALID PASSWORD`, true, 403)
        consoleLog(`[INVALID_PASS] - "${password}" - USER: "${username}"`)
        auth.setConnTimeout(req, config.auth.invalidTimeout)
        return;
    }
    let r = AddHash(username, password);
    sendJSON(res, {text: "Success", error: false, hash: r}, 200)
}

export function AddHash(username, password) {
    let hash = genHash()
    let ts = Math.round(new Date().getTime() / 1000);
    hashes_arr[hash] = {
        lastUpdated: ts,
        username: username,
        hash: hash,
        expired: false,
        type: "hash"
    }
    return hash;
}

export function genHash() {
    let r1 = Math.random().toString(36).substring(7);
    let r2 = Math.random().toString(36).substring(7);
    let r3 = Math.random().toString(36).substring(7);
    let r4 = Math.random().toString(36).substring(7);
    let r = btoa(r1 + r2 + r3 + r4);
    if (getHash(r)) {
        return genHash()
    } else {
        return r;
    }
}

function CheckHash(hash, username) {
    let ts = Math.round(new Date().getTime() / 1000);
    if (hashes_arr[hash]) {
        if (hashes_arr[hash].username != username) {
            consoleLog(`[HASH - WRONG_USERNAME] - "${hash}" USER: "${username}" SHOULD BE: "${hashes_arr[hash].username}"`)
            return false;
        }
        let updated = ts - hashes_arr[hash].lastUpdated;
        if (updated < config.auth.token_lifetime) {
            consoleLog(`[HASH - VALID    ] - [${hashes_arr[hash].isAdmin ? "ADMIN" : "USER "}] - "${hash}" USER: "${username}"`)

            return true;
        } else {
            consoleLog(`[HASH - EXPIRED  ] - [${hashes_arr[hash].isAdmin ? "ADMIN" : "USER "}] - "${hash}" USER: "${username}"`)

            return false;
        }
    } else {
        consoleLog(`[HASH - NOT_FOUND] - [     ] - "${hash}" USER: "${username}"`)

        return false;
    }
}

function UpdateHash(hash, username) {
    let ts = Math.round(new Date().getTime() / 1000);
    if (CheckHash(hash, username)) {
        hashes_arr[hash].lastUpdated = ts;
        return true;
    }
    return false;
}

export function Check_UHash(hash, username) {
    return UpdateHash(hash, username);
}

let timeouts = {};

export function setConnTimeout(req, number) {
    timeouts[req.ip] = (+new Date()) + number;
}

export function checkLogin(req) {
    let params: any = GetParams(req)
    params.username = atob(params.username)
    return (params.hash && params.username && params.username.trim() !== "" && Check_UHash(params.hash, params.username)) || returnPassword(req, false) === "";
}

export function getUsername(req) {
    let params: any = GetParams(req)
    params.username = atob(params.username)
    return params.username;
}

let returnPassCallback = undefined;

export function overrideReturnPassword(callback) {
    returnPassCallback = callback;
}

export function checkTimeout(req) {
    let now = +new Date();
    if (timeouts[req.ip] < now) return false;
    return timeouts[req.ip] - now
}

export let loginPageLoc = './src/login.html';

export function mixinSetLoginPage(page: string) {
    if (!page) {
        loginPageLoc = './src/login.html';
    } else {
        loginPageLoc = page;
    }
}

export function sendLoginPage(req, res) {
    sendFile(req, res, loginPageLoc, 200, {admin: false})
}

export function checkHashes() {
    Object.keys(hashes_arr).forEach(hash => {
        hashes_arr[hash]['fromLastUpdate'] = Math.round((+new Date() / 1000) - hashes_arr[hash].lastUpdated)
        let ts = Math.round(new Date().getTime() / 1000);
        let updated = ts - hashes_arr[hash].lastUpdated;
        if (updated < config.auth.token_lifetime) {

        } else {
            hashes_arr[hash].expired = true;
        }
    })
}

export function getHash(hash) {
    return hashes_arr[hash]
}

export function setProp(hash, prop, value) {
    hashes_arr[hash][prop] = value;
}

Endpoint.get("/permsRaw",(req,res)=>{
    sendJSON(res,(allPermissionsTree),200)
},"auth.perms.see")