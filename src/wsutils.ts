import * as fs from "fs";
import {checkLogin} from "./auth-handler";
import mime = require('mime');

export function sendFile(req,res,path,status){
    let type = mime.getType(path);
    res.setHeader("Content-Type",type)
    res.writeHead(status)
    res.write(fs.readFileSync(path, {encoding: 'utf-8'}));
    res.end()
}