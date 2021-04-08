import * as fs from "fs";
import * as mime from 'mime';
import * as crypto from "crypto";

export function sendFile(req, res, path: string, status: number, args = {}) {
    // @ts-ignore
    let type = mime.getType(path);
    let content = fs.readFileSync(path, {encoding: 'utf-8'});

    Object.keys(args).forEach(key => {
        content = replaceAll(content, `"%key=%${key}%"`, `(JSON.parse(atob('${btoa(JSON.stringify(args[key]))}')))`)
    })
    res.setHeader("Content-Length", byteSize(content))
    res.setHeader("Content-Checksum", sha256(content))
    res.setHeader("Content-Type", type)
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
    res.setHeader("Content-Length", byteSize(text))
    res.setHeader("Content-Checksum", sha256(text))
    res.writeHead(code, {"Content-Type": "text/html; charset=utf-8"})
    res.write(text)
    res.end()
}

export function sendJSON(res, json, code) {
    let txt = JSON.stringify(json)
    res.setHeader("Content-Length", byteSize(txt))
    res.setHeader("Content-Checksum", sha256(txt))
    res.writeHead(code, {"Content-Type": "application/json"})
    res.write(txt)
    res.end()
}

export function sendCompletion(res, text, error, code) {
    sendJSON(res, {error: error, text: text}, code);
}

export async function XHR_GET(url) {
    return await httpGet(url);
}

async function httpGet(url:string) {
     let str = await (new Promise<string>((r, j) => {
        let handler;
        if(url.startsWith("https://")){
            handler = require('https');
        }else{
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
    return crypto.createHash('sha256').update(pwd).digest('hex');
}