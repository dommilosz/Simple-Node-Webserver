import admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";

import * as fileStorage from "./fileStorage";
import {getAndRegisterConfig} from "./configHandler";
import fs from "fs";
import {folderPath} from "./fileStorage";
import {Endpoint, server} from "./webserver";

let serviceAccount = fileStorage.readFileFromStorageJSON("firebase_secret.json")

let defaultApp = initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: getAndRegisterConfig("dburl",""),
});
// Retrieve services via the defaultApp variable...
export const firebase_db = getFirestore(defaultApp);
export const realtime_db = admin.database();
export const firebase_auth = getAuth();

export async function firebase_set(collection:string,doc,data){
    await firebase_db.collection(collection).doc(String(doc)).set(data);
}

export async function firebase_get(collection:string,doc:string){
    return (await firebase_db.collection(collection).doc(doc).get()).data();
}

export async function realtime_set(path:string,data){
    await realtime_db.ref(path).set(data);
}

export async function realtime_get(path:string){
    return (await realtime_db.ref(path).get());
}

export async function readFileFromStorageJSON(name) {
    return await firebase_get("data", name)
}

export async function readFileFromStorageJSON_Safe(name) {
    try {
        return await readFileFromStorageJSON(name);
    } catch {
        return {};
    }
}

export async function writeFileToStorageJSON(name, data:{ [key: string]: any }) {
    await firebase_set("data",name,data);
}

export function getFileElement(name):FileElement {
    return new FileElement(name);
}

export class FileElement {
    name;
    state;

    constructor(name) {
        this.name = name;
    }

    async readFileFromStorageJSON_Safe() {
        this.state = await readFileFromStorageJSON_Safe(this.name)
        return this.state;
    }

    async readFileFromStorageJSON() {
        this.state = await readFileFromStorageJSON(this.name)
        return this.state;
    }

    async writeFileToStorageJSON(data:{ [key: string]: any }) {
        await writeFileToStorageJSON(this.name, data);
    }

    async save(){
        await writeFileToStorageJSON(this.name,this.state);
    }
}

server.use('/firebase/functions/accountDelete', (req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});

Endpoint.post("/firebase/functions/accountDelete",async function (req: any, res: any) {
    if (!req.body || !req.body.uid || !req.body.token) {
        res.setHeader("Content-Type", "Application/json");
        res.writeHead(400)
        res.write(JSON.stringify({success: false, response: `ERROR`}))
        res.end()
        return;
    }

    let token = await firebase_auth.verifyIdToken(req.body.token);
    let perms = ((await firebase_db.collection("accounts").doc(token.uid).get()).data()).permissions;
    //"admin.accounts.manage"
    if (!(perms === true || perms.admin === true || perms.admin.accounts === true || perms.admin.accounts.manage === true)) {
        res.setHeader("Content-Type", "Application/json");
        res.writeHead(400)
        res.write(JSON.stringify({success: false, response: `ERROR`}))
        res.end()
        return;
    }

    await firebase_db.collection("indexes").doc("accounts").update({[req.body.uid]:admin.firestore.FieldValue.delete()})
    await firebase_db.collection("accounts").doc(req.body.uid).delete();
    await firebase_auth.deleteUser(req.body.uid);

    res.setHeader("Content-Type", "Application/json");
    res.writeHead(200)
    res.write(JSON.stringify({success: true, response: `OK`}))
    res.end()
})