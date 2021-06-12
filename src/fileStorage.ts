import * as fs from "fs";

export let folderPath = "files/";

export function readFileFromStorage(name) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    return fs.readFileSync(folderPath + name, {encoding: "utf8"})
}

export function readFileFromStorageJSON(name) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    return JSON.parse(fs.readFileSync(folderPath + name, {encoding: "utf8"}))
}

export function readFileFromStorageJSON_Safe(name) {
    try {
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
        return JSON.parse(fs.readFileSync(folderPath + name, {encoding: "utf8"}))
    } catch {
        return {};
    }
}

export function readFileFromStorage_Safe(name) {
    try {
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
        return fs.readFileSync(folderPath + name, {encoding: "utf8"})
    } catch {
        return "";
    }
}

export function getFilePath(name) {
    return folderPath + name;
}

export function writeFileToStorage(name, data) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    fs.writeFileSync(folderPath + name, data, {encoding: "utf8"})
}

export function writeFileToStorageJSON(name, data) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    fs.writeFileSync(folderPath + name, JSON.stringify(data), {encoding: "utf8"})
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

    readFileFromStorage_Safe() {
        this.state = readFileFromStorage_Safe(this.name);
        return this.state;
    }

    readFileFromStorageJSON_Safe() {
        this.state = readFileFromStorageJSON_Safe(this.name)
        return this.state;
    }

    readFileFromStorageJSON() {
        this.state = readFileFromStorageJSON(this.name)
        return this.state;
    }

    readFileFromStorage() {
        this.state = readFileFromStorage(this.name)
        return this.state;
    }

    writeFileToStorageJSON(data) {
        writeFileToStorageJSON(this.name, data);
    }

    writeFileToStorage(data) {
        writeFileToStorage(this.name, data);
    }
    save(){
        if(typeof this.state === typeof {}){
            writeFileToStorage(this.name,JSON.stringify(this.state));
            return;
        }
        writeFileToStorage(this.name,this.state);
    }
}