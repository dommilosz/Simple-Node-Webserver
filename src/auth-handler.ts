import {GetParams, server} from "./webserver";
import * as fs from "fs";
import {Request, Response} from "express";
import {config} from "./configHandler";
import {sendFile} from "./wsutils";
import {btoa,atob} from "./wsutils";

const auth = require("./auth-handler");
export let hashes_arr = {}
export let one_time_hashes = {}

export let password = config.password;
export let admin_password = config.admin_password

server.post("/auth", function (req: Request, res: Response) {
    let params: any = req.body
    if (params.username && params.username.trim() != "") {
        params.username = atob(params.username)
        params.password = atob(params.password)
        if (auth.checkTimeout(req)) {
            res.writeHead(403, {"Content-Type": "text/json"});
            res.write(`SLOW DOWN! - Wait ${auth.checkTimeout(req)}ms`);
            res.end();
            return;
        }
        let hash_redeem = redeemOneTimeToken(params.password, params.username);
        if (hash_redeem) {
            if (req.url.includes('?admin=1')) {
                if(!getHash(hash_redeem).isAdmin){
                    res.writeHead(403, {"Content-Type": "text/json"});
                    res.write("YOU NEED TO LOGIN AS ADMIN");
                    res.end();
                    console.log(
                        `"${params.username}" tried to login with user's password`
                    );
                }else {
                    res.writeHead(200, {"Content-Type": "text/json"});
                    res.write(hash_redeem);
                    res.end()
                }
            }else {
                res.writeHead(200, {"Content-Type": "text/json"});
                res.write(hash_redeem);
                res.end();
            }
        } else if ((params.password && params.password == password)) {
            if (req.url.includes('?admin=1')) {
                res.writeHead(403, {"Content-Type": "text/json"});
                res.write("YOU NEED TO LOGIN AS ADMIN");
                res.end();
                console.log(
                    `"${params.username}" tried to login with user's password`
                );
            } else {
                let r = AddHash(params.username, false);
                res.writeHead(200, {"Content-Type": "text/json"});
                res.write(r);
                res.end();
            }


        } else if ((params.password && params.password == admin_password)) {
            let r = AddHash(params.username, true);
            res.writeHead(200, {"Content-Type": "text/json"});
            res.write(r);
            res.end();
        } else {
            res.writeHead(403, {"Content-Type": "text/json"});
            res.write("INVALID PASSWORD");
            res.end();
            console.log(
                `"${params.username}" tried to enter invalid password "${params.password}".`
            );
            auth.setConnTimeout(req, config.auth.invalidTimeout)
        }
    } else {
        res.writeHead(403, {"Content-Type": "text/json"});
        res.write("INVALID USERNAME (IT CAN BE ANYTHING)");
        res.end();

    }
});

function AddHash(username, isAdmin) {
    let hash = genHash()
    console.log("hash : ", hash, "  Username : ", username);
    let ts = Math.round(new Date().getTime() / 1000);
    let hash_obj = {
        isAdmin: false,
        lastUpdated: ts,
        username: username,
        hash: hash,
        expired: false,
        type: "hash"
    };
    if (isAdmin) hash_obj.isAdmin = true;
    hashes_arr[hash] = hash_obj
    return hash;
}

function genHash() {
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
            console.log(
                `Validating hash "${hash}" for username "${username}". INVALID : USERNAME DOESN'T MATCH`
            );
            return false;
        }
        let updated = ts - hashes_arr[hash].lastUpdated;
        if (updated < config.auth.token_lifetime) {
            if (hashes_arr[hash].isAdmin) {
                console.log(
                    `Validating hash "${hash}" for username "${username}". VALID [ADMIN]`
                );
            } else {
                console.log(
                    `Validating hash "${hash}" for username "${username}". VALID`
                );
            }

            return true;
        } else {
            console.log(
                `Validating hash "${hash}" for username "${username}". INVALID : EXPIRED`
            );
            return false;
        }
    } else {
        console.log(
            `Validating hash "${hash}" for username "${username}". INVALID : HASH NOT FOUND`
        );
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
    return (params.hash && params.username && params.username.trim() !== "" && Check_UHash(params.hash, params.username)) || password == "";
}

function Check_UHashAdmin(hash: any, username: any) {
    if (!Check_UHash(hash, username)) return false;
    return hashes_arr[hash].isAdmin;

}

export function checkLoginAdmin(req) {
    let params: any = GetParams(req)
    params.username = atob(params.username)
    return (params.hash && params.username && params.username.trim() !== "" && Check_UHashAdmin(params.hash, params.username)) || password == "";
}

export function checkTimeout(req) {
    let now = +new Date();
    if (timeouts[req.ip] < now) return false;
    return timeouts[req.ip] - now
}

export function sendFileAuth(req, res, path, status) {
    if (checkLogin(req)) {
        sendFile(req, res, path, status)
    } else {
        sendLoginPage(req, res)
    }
}

export function sendFileAuthAdmin(req, res, path, status) {
    if (checkLoginAdmin(req)) {
        sendFile(req, res, path, status)
    } else {
        sendAdminLoginPage(req, res)
    }
}

export function sendLoginPage(req, res) {
    sendFile(req,res,'./src/login.html',200,{admin:false})
}

export function sendAdminLoginPage(req, res) {
    sendFile(req,res,'./src/login.html',200,{admin:true})
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
        if(getUsedToken(hash)){
            hashes_arr[hash].usedHashOTP = getUsedToken(hash);
        }
    })

    Object.keys(one_time_hashes).forEach(hash => {
        one_time_hashes[hash]['fromLastUpdate'] = Math.round((+new Date() / 1000) - one_time_hashes[hash].lastUpdated)
        let ts = Math.round(new Date().getTime() / 1000);
        let updated = ts - one_time_hashes[hash].lastUpdated;
        if (updated < config.auth.token_lifetime) {

        } else {
            one_time_hashes[hash].expired = true;
        }
    })

}

export function redeemOneTimeToken(token, username) {
    if (one_time_hashes[token]) {
        if (one_time_hashes[token].expired) {
            return false;
        } else if (one_time_hashes[token].used) {
            return false;
        } else {
            one_time_hashes[token].used = true;
            one_time_hashes[token].usedBy = username;
            let hash = AddHash(username, one_time_hashes[token].isAdmin);
            one_time_hashes[token].usedByHash = hash;
            console.log(`${username} redeemed otp : ${token}`)
            return hash
        }
    }
    return false
}


export function createOneTime(isAdmin) {
    let ts = +new Date();
    let hash = genHash();
    one_time_hashes[hash] = {
        isAdmin: isAdmin,
        lastUpdated: Math.round(ts / 1000),
        hash: hash,
        expired: false,
        used: false,
        fromLastUpdate: Math.round(ts / 1000),
        type: "otp",
    }
    return hash;
}

server.get("/getOneTime", function (req: Request, res: Response) {
    if (checkLoginAdmin(req)) {
        res.writeHead(200)
        res.write(createOneTime(req.url.includes("?admin=1")))
        res.end()
    } else {
        sendAdminLoginPage(req, res);
    }
})

export function getHash(hash) {
    if (one_time_hashes[hash]) {
        return one_time_hashes[hash]
    } else {
        return hashes_arr[hash]
    }
}

export function setProp(hash,prop,value) {
    if (one_time_hashes[hash]) {
        one_time_hashes[hash][prop] = value;
    } else {
        hashes_arr[hash][prop] = value;
    }
}

export function getUsedToken(hash){
    let hash_o = undefined
    if(hashes_arr[hash]){
        Object.keys(one_time_hashes).forEach(key=>{
            if(one_time_hashes[key].usedByHash&&one_time_hashes[key].usedByHash==hash){
                hash_o = key
            }
        })
    }
    return hash_o;
}