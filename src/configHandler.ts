import * as fs from "fs";
export let config:{
    admin_password: string;
    auth: {
        invalidTimeout: number;
        token_lifetime:number};
    ports: {web:number},
    openBrowserOnStart:boolean,
    password:string
};
try{
let json = JSON.parse(fs.readFileSync('src/config.json',{encoding:'utf-8'}));
config = json;
}catch {
    config = {
        auth: {token_lifetime: 60,invalidTimeout:10000},
        "ports":{
            "web":8080
        },
        "openBrowserOnStart": false,
        "password":"admin",
        "admin_password":"admin123"
    }
    console.log("Error while loading config. Using default options!")
    if(!fs.existsSync('src/config.json',)){
        fs.writeFileSync('src/config.json',JSON.stringify(config,null,4),{encoding:'utf-8'})
        console.log("Creating config file.")
    }
}

export function setConfig(key,val){
    config[key] = val;
    fs.writeFileSync('src/config.json',JSON.stringify(config,null,4),{encoding:'utf-8'})
}