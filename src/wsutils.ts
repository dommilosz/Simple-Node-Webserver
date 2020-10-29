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