import {allPermissionsTree, Endpoint, expandPermissions, GetParams} from "./webserver";
import {Request, Response} from "express";
import {getConfig, registerConfigProp} from "./configHandler";
import {atob, btoa, consoleLog, sendCompletion, sendFile, sendJSON, sendText} from "./wsutils";

const auth = require("./auth-handler");
export let hashes_arr = {}
export let checkUsernameOverride: (cb: any) => any;

registerConfigProp("auth.admin_password","admin123");
registerConfigProp("auth.password","user");
registerConfigProp("auth.token_lifetime",864000);
registerConfigProp("auth.invalidTimeout",3000);
registerConfigProp("auth.allowLoginPageMixins",true);

export let password = getConfig("auth.password");
export let admin_password = getConfig("auth.admin_password");
export let token_lifetime = getConfig("auth.token_lifetime");
export let invalidTimeout = getConfig("auth.invalidTimeout");
export let allowLoginPageMixins = getConfig("auth.allowLoginPageMixins");

export function checkUsername(username: string) {
    if (checkUsernameOverride) {
        return checkUsernameOverride(username);
    }
    return true;
}

export function overrideCheckUsername(cb) {
    checkUsernameOverride = cb;
}

export let checkUserPermsOverride;

export function checkUserPerms(username, password) {
    if (checkUserPermsOverride) {
        return checkUserPermsOverride(username, password);
    }
    if (password == admin_password) {
        return "*.*";
    }
    if (password == password) {
        return "user.*";
    }
    return "user.*";
}

export function overrideCheckUserPerms(cb) {
    checkUserPermsOverride = cb;
}

export function returnPassword(req, username, admin) {
    if (returnPassCallback) return returnPassCallback(req, username, admin);

    if (admin) return admin_password;
    return password;
}

export function getHashFromReq(req) {
    let params: any = GetParams(req)
    return params.hash;
}

export function checkPermission(req, perm) {
    if (perm.split('.')[0] == "default") return true;
    let hash = getHash(getHashFromReq(req));
    if (!hash) return false;
    let canAccess = false;
    let params = GetParams(req);
    let perms = checkUserPerms(atob(params.username), params.password);
    perms.split(';').forEach(el => {
        if (checkPerm(el, perm)) canAccess = true;
    })
    if(expandPermissions(atob(params.username),perm))canAccess=true;

    return canAccess;
}

export function checkPerm(uperm, perm) {
    let perma = perm.split('.')
    let uperma = uperm.split('.')
    let boolperms = true;
    let forceperms = false;

    if (perma[0] == "default") return true;

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
    let username = "";
    try {
        let params = GetParams(req);
        perms = checkUserPerms(atob(params.username), params.password);
        username = atob(params.username);
    } catch {
    }


    sendJSON(res, ({permissions: perms, login: checkLogin(req),username:(username)}), 200)
    return;
});

Endpoint.get("/logout", function (req: Request, res: Response) {
    if (checkLogin(req)) {
        res.cookie('username', '', {maxAge: token_lifetime});
        res.cookie('password', '', {maxAge: token_lifetime});
        res.cookie('hash', '', {maxAge: token_lifetime});
        sendText(res, "Logged out", 200)

        let params: any = GetParams(req)
        let hash = params.hash;
        setProp(hash, "expired", true)
        setProp(hash, "lastUpdated", Math.round(+new Date() / 1000) - (token_lifetime + 60))
        checkHashes()

        return;
    }
});

Endpoint.post("/auth", function (req: Request, res: Response) {
    let params: any = req.body
    if (params.username && params.username.trim() != "") {
        params.username = atob(params.username)
        params.password = atob(params.password)
        Login(params.username, params.password, req, res, true)
        return;
    }
    sendCompletion(res, `INVALID PASSWORD`, true, 403)
    auth.setConnTimeout(req, invalidTimeout)
});

export function Login(username, password, req, res, sendResponse: boolean) {
    try {
        let resp = Authenticate(username, password, req);
        res.cookie('username', btoa(username), {maxAge: token_lifetime});
        //res.cookie('password', password, {maxAge: token_lifetime});
        res.cookie('hash', resp, {maxAge: token_lifetime});
        if (sendResponse)
            sendCompletion(res, {hash: resp}, false, 200);
        return resp;
    } catch (ex) {
        if (sendResponse)
            sendCompletion(res, ex, true, 403);
    }
    return undefined;
}

export function Authenticate(username, password, req) {
    if (!password || password.length < 1) {
        throw `INVALID PASSWORD`
    }
    if (auth.checkTimeout(req)) {
        throw `SLOW DOWN! - Wait ${auth.checkTimeout(req)}ms`
    }
    if (!username || username.length < 1 || (!username && username.trim() == "") || !checkUsername(username)) {
        throw "INVALID USERNAME"
    }
    let requiredPassword = returnPassword(req, username, false)
    let requiredPasswordAdmin = returnPassword(req, username, true)
    if ((requiredPasswordAdmin != password) && (requiredPassword != password)) {
        consoleLog(`[INVALID_PASS] - "${password}" - USER: "${username}"`)
        auth.setConnTimeout(req, invalidTimeout)
        throw "INVALID PASSWORD"
    }
    return AddHash(username, password);
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
        if (updated < auth.token_lifetime) {
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
    return (params.hash && params.username && params.username.trim() !== "" && Check_UHash(params.hash, params.username)) || returnPassword(req, params.username, false) === "";
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
    if(!allowLoginPageMixins)return;
    if (!page) {
        loginPageLoc = './src/login.html';
    } else {
        loginPageLoc = page;
    }
}

export function sendLoginPage(req, res,requiredPermissions:string) {
    sendFile(req, res, loginPageLoc, 200, {reqPermissions: requiredPermissions})
}

export function checkHashes() {
    Object.keys(hashes_arr).forEach(hash => {
        hashes_arr[hash]['fromLastUpdate'] = Math.round((+new Date() / 1000) - hashes_arr[hash].lastUpdated)
        let ts = Math.round(new Date().getTime() / 1000);
        let updated = ts - hashes_arr[hash].lastUpdated;
        if (updated < token_lifetime) {

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

Endpoint.get("/permsRaw", (req, res) => {
    sendJSON(res, (allPermissionsTree), 200)
}, "auth.perms.see")