import * as fs from "fs";
import {checkLogin} from "./auth-handler";
import mime = require('mime');

export function sendFile(req,res,path:string,status:number,args = {}){
    let type = mime.getType(path);
    let content = fs.readFileSync(path, {encoding: 'utf-8'});

    Object.keys(args).forEach(key=>{
        content = replaceAll(content,`"%key=%${key}%"`, `(JSON.parse(atob('${btoa(args[key])}')))`)
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
        let content = JSON.parse(JSON.stringify(obj))
        return Buffer.from(content, 'binary').toString('base64')
    }else {
        return btoa(JSON.stringify(obj))
    }
}
export function atob(obj:string){
    if(!obj)return ;
    let result = (Buffer.from(obj, 'base64').toString('binary'))

    try{
        return JSON.parse(result)
    }catch {}
    return result;
}