import * as fs from "fs";
import {getAndRegisterConfig} from "../configHandler";

export let loadedModules: any = {}
export let showModuleLoadingErrors = getAndRegisterConfig("showModuleLoadingErrors", true);

export function requireModule(name: string) {
    if (!loadedModules) loadedModules = {}
    loadModule(name, "default");
    if (!loadedModules[name] || !loadedModules[name].loaded) {
        console.log(`  * Error Loading dependency ${name}`)
    }
    return
}

export let currentModule = "";

export function loadModule(name: string, type: string) {
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
            let module = require(`./${name}/${name}.ts`);
            console.log(`Loading ${name} - SUCCESS`)
            loadedModules[name] = {name: name, loaded: true}
            return module;
        } catch (ex) {
            console.log(`Loading ${name} - FAIL`)
            if (showModuleLoadingErrors) {
                console.log(ex);
            }
            loadedModules[name] = {name: name, loaded: false}
        }
    }
}

export function loadModules() {
    loadModulesCustom("default")
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
