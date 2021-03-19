"use strict";
exports.__esModule = true;
exports.setConfig = exports.defaultConfig = exports.config = void 0;
var fileStorage_1 = require("./fileStorage");
exports.defaultConfig = {
    auth: { token_lifetime: 60, invalidTimeout: 10000 },
    "ports": {
        "web": 8080
    },
    "openBrowserOnStart": false,
    "password": "admin",
    "admin_password": "admin123",
    "showModuleLoadingErrors": false
};
try {
    exports.config = fileStorage_1.readFileFromStorageJSON('config.json');
}
catch (_a) {
    exports.config = exports.defaultConfig;
    console.log("Error while loading config. Using default options!");
    fileStorage_1.writeFileToStorage('config.json', JSON.stringify(exports.config, null, 4));
    console.log("Creating config file.");
}
Object.keys(exports.defaultConfig).forEach(function (key) {
    if (!exports.config[key]) {
        exports.config[key] = exports.defaultConfig[key];
    }
    fileStorage_1.writeFileToStorage('config.json', JSON.stringify(exports.config, null, 4));
});
function setConfig(key, val) {
    exports.config[key] = val;
    fileStorage_1.writeFileToStorage('config.json', JSON.stringify(exports.config, null, 4));
}
exports.setConfig = setConfig;
//# sourceMappingURL=configHandler.js.map