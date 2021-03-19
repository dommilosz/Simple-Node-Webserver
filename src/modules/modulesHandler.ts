import fs from "fs";
import {config} from "../configHandler";

export let loadedModules:any = {}
export function requireModule(name:string){
    if(!loadedModules)loadedModules = {}
    loadModule(name);
    if(!loadedModules[name]||!loadedModules[name].loaded){
        console.log(`  * Error Loading dependency ${name}`)
    }
    return
}
export function loadModule(name:string){
    if(!loadedModules)loadedModules = {}
    if(!loadedModules[name]||!loadedModules[name].loaded) {
        try {
            let module=  require(`./${name}/${name}.ts`);
            console.log(`Loading ${name} - SUCCESS`)
            loadedModules[name] = {name:name,loaded:true}
            return module;
        } catch (ex) {
            console.log(`Loading ${name} - FAIL`)
            if(config.showModuleLoadingErrors){
                console.log(ex);
            }
            loadedModules[name] = {name:name,loaded:false}
        }
    }
}

console.log("=== Loading modules:")
let modules = fs.readdirSync('./src/modules', {withFileTypes:true});
modules.forEach(el=>{
    if(el.isDirectory()){
        loadModule(el.name);
    }
})
console.log("=== END Loading modules:")
