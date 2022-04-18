import * as fs from "fs";
import {getAndRegisterConfig} from "../configHandler";

export let loadedModules: any = {}
export let showModuleLoadingErrors = getAndRegisterConfig("showModuleLoadingErrors", true);

export function requireModule(name: string, hidelogs?: boolean) {
    if (!loadedModules) loadedModules = {}
    loadModule(name, "default");
    if (!loadedModules[name] || !loadedModules[name].loaded) {
        if (!hidelogs)
            console.log(`  * Error Loading dependency ${name}`)
        return false;
    }
    return loadedModules[name].path;
}

export let currentModule = "";

export function loadModule(name: string, type: string, hidelogs?: boolean) {
    if (!loadedModules) loadedModules = {}
    if (!loadedModules[name] || !loadedModules[name].loaded) {
        try {
            let enabled = getAndRegisterConfig(`modules.${name}.enabled`, true);
            if (!enabled) {
                return;
            }

            try {
                let moduleConfig = require(`./${name}/module.ts`);
                if (moduleConfig.load != type) return;
            } catch {
                if (type != "default") return;
            }
            currentModule = name;
            let ts = +new Date();
            let path = `./${name}/${name}.ts`;
            let module = require(path);
            if (!hidelogs) {
                console.log(`Loading ${name} - SUCCESS - ${(+new Date())-ts}ms`);
            }


            loadedModules[name] = {name: name, loaded: true, path}
            return module;
        } catch (ex) {
            if (!hidelogs)
                console.log(`Loading ${name} - FAIL`)
            if (showModuleLoadingErrors) {
                if (!hidelogs)
                    console.log(ex);
            }
            loadedModules[name] = {name: name, loaded: false}
        }
    }
}

export function loadModules() {
    loadModulesCustom("default")
}

export function unloadModules() {
    console.log("Unloading modules")
    loadedModules.forEach(el => {
        if (el.path)
            unloadModule(el.path);
    })
    loadedModules.clear();
}

export function unloadModule(module) {
    let solvedName = require.resolve(module),
        nodeModule = require.cache[solvedName];
    if (nodeModule) {
        for (let i = 0; i < nodeModule.children.length; i++) {
            let child = nodeModule.children[i];
            unloadModule(child.filename);
        }
        delete require.cache[solvedName];
    }
}

export function loadModulesCustom(type) {
    console.log(`=== Loading modules: (${type})`)
    let modules = fs.readdirSync('./src/modules', {withFileTypes: true});
    modules.forEach(el => {
        if (el.isDirectory()) {
            loadModule(el.name, type);
        }
    })
    console.log("=== END Loading modules:")
}
