import {readFileFromStorageJSON, writeFileToStorage} from "./fileStorage";

export let config: {
    admin_password: string;
    auth: {
        invalidTimeout: number;
        token_lifetime: number
    };
    ports: { web: number },
    openBrowserOnStart: boolean,
    password: string,
    showModuleLoadingErrors: boolean
};

export const defaultConfig = {
    auth: {token_lifetime: 60, invalidTimeout: 10000},
    "ports": {
        "web": 8080
    },
    "openBrowserOnStart": false,
    "password": "admin",
    "admin_password": "admin123",
    "showModuleLoadingErrors": false,
}

try {
    config = readFileFromStorageJSON('config.json');
} catch {
    config = defaultConfig;
    console.log("Error while loading config. Using default options!")
    writeFileToStorage('config.json', JSON.stringify(config, null, 4))
    console.log("Creating config file.")

}

Object.keys(defaultConfig).forEach(key => {
    if (!config[key]) {
        config[key] = defaultConfig[key]
    }
    writeFileToStorage('config.json', JSON.stringify(config, null, 4))
})

export function setConfig(key, val) {
    let parts = key.split('.')
    let obj = config;

    parts.forEach(el => {
        if (el !== parts[parts.length - 1]) {
            if(!obj[el])obj[el] = {};
            obj = obj[el];
        }

    })

    obj[parts[parts.length - 1]] = val;
    writeFileToStorage('config.json', JSON.stringify(config, null, 4))
}

export function getConfig(key) {
    if (config[key])
        return config[key];

    let parts = key.split('.')
    let obj = config;

    parts.forEach(el => {
        if (el !== parts[parts.length - 1]) {
            if(!obj[el])return false;
            obj = obj[el];
        }

    })

    return obj[parts[parts.length - 1]];
}

export function registerConfigProp(key, defVal) {
    if (typeof getConfig(key) == 'undefined') {
        setConfig(key, defVal)
    }
}