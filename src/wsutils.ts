import * as fs from "fs";
import {checkLogin} from "./auth-handler";
import request from "sync-request";
import mime = require('mime');

export function sendFile(req,res,path:string,status:number,args = {}){
    let type = mime.getType(path);
    let content = fs.readFileSync(path, {encoding: 'utf-8'});

    Object.keys(args).forEach(key=>{
        content = replaceAll(content,`"%key=%${key}%"`, `(JSON.parse(atob('${btoa(JSON.stringify(args[key]))}')))`)
    })
    res.setHeader("Content-Type",type)
    res.writeHead(status)
    res.write(content);
    res.end()
}

export function replaceAll(content: string, s: string, s2: string) {
    return content.split(s).join(s2)
}

export function btoa(obj){
    if(!obj)return ;
    if(typeof(obj)=="string"){
        return btoa_i(obj)
    }else {
        return btoa(JSON.stringify(obj))
    }
}
export function atob(obj:string){
    if(!obj)return ;
    return require('atob')(obj)
}

function btoa_i(str:string) {
    return Buffer.from(str).toString("base64");
}

export function consoleLog(str:String){
    let date = new Date();
    let time:string = ""+(date.getHours()>9?date.getHours():"0"+date.getHours());
    time += ":"+(date.getMinutes()>9?date.getMinutes():"0"+date.getMinutes());
    time += ":"+(date.getSeconds()>9?date.getSeconds():"0"+date.getSeconds());

    console.log("["+time+"] "+str)
}

export function sendText(res,text,code){
    res.writeHead(code,{"Content-Type": "text/html; charset=utf-8"})
    res.write(text)
    res.end()
}
export function sendJSON(res,json,code){
    res.writeHead(code,{"Content-Type": "application/json"})
    res.write(JSON.stringify(json))
    res.end()
}

export function sendCompletion(res,text,error,code){
    sendJSON(res,{error:error,text:text},code);
}

export function XHR_GET(url) {
    return request("GET",url, {json: true}).body.toString();
}
