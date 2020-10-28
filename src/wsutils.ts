import * as fs from "fs";
import {checkLogin} from "./auth-handler";

export function sendFile(req,res,path,status){
    res.writeHead(status)
    res.write(fs.readFileSync(path, {encoding: 'utf-8'}));
    res.end()
}