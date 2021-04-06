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

export function writeFileToStorage(name, data) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    fs.writeFileSync(folderPath + name, data, {encoding: "utf8"})
}

export function writeFileToStorageJSON(name, data) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    fs.writeFileSync(folderPath + name, JSON.stringify(data), {encoding: "utf8"})
}