import * as fs from "fs";
import {PathLike} from "fs";
import * as mime from 'mime';
import * as crypto from "crypto";

export function sendFile(req, res, path: PathLike, status: number, args = {}) {
    // @ts-ignore
    let type = mime.getType(path);
    let content = fs.readFileSync(path, {encoding: 'utf-8'});

    Object.keys(args).forEach(key => {
        content = replaceAll(content, `"%key=%${key}%"`, `(JSON.parse(atob('${btoa(JSON.stringify(args[key]))}')))`)
    })
    addChecksumAndLength(res, content)
    res.setHeader("Content-Type", type)
    res.writeHead(status)
    res.write(content);
    res.end()
}

export function sendFileRaw(req, res, path: PathLike, status: number) {
    let content = fs.readFileSync(path);
    res.writeHead(status)
    res.write(content);
    res.end()
}


export function replaceAll(content: string, s: string, s2: string) {
    return content.split(s).join(s2)
}

export function btoa(obj) {
    if (!obj) return;
    if (typeof (obj) == "string") {
        return btoa_i(obj)
    } else {
        return btoa(JSON.stringify(obj))
    }
}

export function atob(obj: string) {
    if (!obj) return;
    return require('atob')(obj)
}

function btoa_i(str: string) {
    return Buffer.from(str).toString("base64");
}

export function consoleLog(str: String) {
    let date = new Date();
    let time: string = "" + (date.getHours() > 9 ? date.getHours() : "0" + date.getHours());
    time += ":" + (date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes());
    time += ":" + (date.getSeconds() > 9 ? date.getSeconds() : "0" + date.getSeconds());

    console.log("[" + time + "] " + str)
}

export function sendText(res, text, code) {
    try {
        addChecksumAndLength(res, text)
        res.writeHead(code, {"Content-Type": "text/html; charset=utf-8"})
        if (text)
            res.write(text)
        res.end()
    } catch {
    }
}

export function sendJSON(res, json, code) {
    try {
        let txt = JSON.stringify(json)
        addChecksumAndLength(res, txt)
        res.writeHead(code, {"Content-Type": "application/json"})
        if (txt)
            res.write(txt)
        res.end()
    } catch {
    }
}

export function sendCompletion(res, text, error, code) {
    sendJSON(res, {error: error, text: text}, code);
}

export async function XHR_GET(url) {
    return await httpGet(url);
}

export async function XHR_POST(url, data: string) {
    let str = await (new Promise<string>((r, j) => {
        let handler;
        if (url.startsWith("https://")) {
            handler = require('https');
        } else {
            handler = require('http');
        }

        let req = handler.request(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                r(data);
            });
        }).on("error", (err) => {
            j(err.message);
        });

        req.write(data);
        req.end();
    }))
    return str;
}

async function httpGet(url: string) {
    let str = await (new Promise<string>((r, j) => {
        let handler;
        if (url.startsWith("https://")) {
            handler = require('https');
        } else {
            handler = require('http');
        }

        handler.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                r(data);
            });
        }).on("error", (err) => {
            j(err.message);
        });
    }))
    return str;
}

export function byteSize(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

export function sha256(pwd) {
    if (!pwd) return undefined;
    return crypto.createHash('sha256').update(pwd).digest('hex');
}

export function sendMissingPermissionPage(perms, res) {
    sendText(res, `<script src="jsu.js"></script><h1>403 - Forbidden</h1>You don't have access to this resource. <a href="#" onclick="logout()">Logout</a><br>Permission: <code>${perms}</code>`, 403)
}
export function sendFlaggedPage(reason, res) {
    sendText(res, `<script src="jsu.js"></script><h1>403 - Forbidden. Account flagged</h1>You don't have access to this resource. <a href="#" onclick="logout()">Logout</a><br>Reason: ${reason}`, 403)
}

export function sendMissingPage(res) {
    sendText(res, "<h1>Error 404 - Not Found</h1><br/><span>Weird place, Void. If you think that something except of this text should be here contact the administrator</span>", 404)
}

export function addChecksumAndLength(res, content) {
    if (!content) return;
    res.setHeader("Content-Length", byteSize(content))
    res.setHeader("Content-Checksum", sha256(content))
}