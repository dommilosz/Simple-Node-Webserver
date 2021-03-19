"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
exports.__esModule = true;
exports.writeFileToStorage = exports.readFileFromStorageJSON_Safe = exports.readFileFromStorageJSON = exports.readFileFromStorage = exports.folderPath = void 0;
var fs = __importStar(require("fs"));
exports.folderPath = "files/";
function readFileFromStorage(name) {
    if (!fs.existsSync(exports.folderPath))
        fs.mkdirSync(exports.folderPath);
    return fs.readFileSync(exports.folderPath + name, { encoding: "utf8" });
}
exports.readFileFromStorage = readFileFromStorage;
function readFileFromStorageJSON(name) {
    if (!fs.existsSync(exports.folderPath))
        fs.mkdirSync(exports.folderPath);
    return JSON.parse(fs.readFileSync(exports.folderPath + name, { encoding: "utf8" }));
}
exports.readFileFromStorageJSON = readFileFromStorageJSON;
function readFileFromStorageJSON_Safe(name) {
    try {
        if (!fs.existsSync(exports.folderPath))
            fs.mkdirSync(exports.folderPath);
        return JSON.parse(fs.readFileSync(exports.folderPath + name, { encoding: "utf8" }));
    }
    catch (_a) {
        return {};
    }
}
exports.readFileFromStorageJSON_Safe = readFileFromStorageJSON_Safe;
function writeFileToStorage(name, data) {
    if (!fs.existsSync(exports.folderPath))
        fs.mkdirSync(exports.folderPath);
    fs.writeFileSync(exports.folderPath + name, data, { encoding: "utf8" });
}
exports.writeFileToStorage = writeFileToStorage;
//# sourceMappingURL=fileStorage.js.map