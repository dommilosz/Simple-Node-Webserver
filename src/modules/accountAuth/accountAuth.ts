import {readFileFromStorageJSON, writeFileToStorage} from "../../fileStorage";
import {Endpoint, GetParams, server} from "../../webserver";
import {
    checkLogin, checkPermission,
    checkUsername, checkUsernameOverride, overrideCheckUsername, overrideCheckUserPerms,
    overrideReturnPassword,
    returnPassword,
    sendLoginPage
} from "../../auth-handler";
import {atob, sendCompletion, sendFile, sendJSON, sendText} from "../../wsutils";
import {requireModule} from "../modulesHandler";
import {config} from "../../configHandler";



let accounts = {}
try {
    accounts = readFileFromStorageJSON("accounts.json")
} catch {
    accounts = {}
}

overrideReturnPassword(function (req, isAdmin) {
    let username = (req.body.username);
    if(username=="root"&&isAdmin){
        return config.admin_password;
    }
    if (accounts[username]){
        return accounts[username].password;
    }

    return undefined;
})

overrideCheckUsername(username=>{
    if(username=="root")return true;
    return !!accounts[username];
})

overrideCheckUserPerms((username,password)=>{
    if(username=="root")return "*.*";
    if(!accounts[username])return "user.*";
    if(!accounts[username].permissions)return "user.*";
    return(accounts[username].permissions)
})

export let registerNeedAdmin = false;
Endpoint.get('/register', function (req, res) {
    sendFile(req, res, 'src/modules/accountAuth/register.html', 200)
},registerNeedAdmin?"auth.register":"default")

Endpoint.get('/permsGUI', function (req, res) {
    let params = GetParams(req);
    if(params.user){
        sendFile(req, res, 'src/modules/accountAuth/permsGUI.html', 200,{user:atob(params.user)})
    }else {
        sendText(res,"Invalid username",400)
    }

},"auth.perms.edit")

Endpoint.get('/register.js', function (req, res) {
    sendFile(req, res, 'src/modules/accountAuth/register.js', 200)
},"auth.register")

Endpoint.get('/accounts', function (req, res) {
    sendFile(req, res, 'src/modules/accountAuth/accounts.html', 200)
},"auth.accounts")

Endpoint.post('/registerAcc', function (req, res) {
    let body = req.body;
    if(!body.username||!body.password||body.username.length<4||body.password.length<4){
        sendCompletion(res,"Wrong details",true,200);
        return;
    }
    let isAdmin = false;
    if(body.level==="admin"&&checkPermission(req,"auth.register.admin"))isAdmin = true;
    if(accounts[atob(body.username)]){
        sendCompletion(res,"Account already exists!",true,200);
        return;
    }
    registerAcc(atob(body.username),atob(body.password),isAdmin)
    sendCompletion(res,"Successfully created account",false,200);
},registerNeedAdmin?"auth.register":"default")

Endpoint.post('/deleteAcc', function (req, res) {
    let body = req.body;
    if(!body.username){
        sendCompletion(res,"Wrong details",true,200);
        return;
    }
    if(!accounts[(body.username)]){
        sendCompletion(res,"Account does not exist!",true,200);
        return;
    }
    removeAcc(body.username)
    sendCompletion(res,"Successfully deleted account",false,200);
},"auth.accounts.delete")

Endpoint.post('/changeAcc', function (req, res) {
    let body = req.body;
    if(!body.username){
        sendCompletion(res,"Wrong details",true,200);
        return;
    }
    if(!accounts[(body.username)]){
        sendCompletion(res,"Account does not exist!",true,200);
        return;
    }
    changeProps(body.username,body.password,body.admin,body.newUsername)
    sendCompletion(res,"Successfully changed account",false,200);
},"auth.accounts.change")

Endpoint.post('/changePerms', function (req, res) {
    let body = req.body;
    if(!body.username||!body.permissions){
        sendCompletion(res,"Wrong details",true,200);
        return;
    }
    if(!accounts[(body.username)]){
        sendCompletion(res,"Account does not exist!",true,200);
        return;
    }
    let canChange = true;
    let permsEdit = body.permissions.split(';');
    permsEdit.forEach(el=>{
        if(!checkPermission(req,el)){
            canChange = false;
        }
    })
    if(!canChange){
        sendCompletion(res,"You don't have permission to change this permissions",true,200);
        return;
    }

    editPerms(body.username,body.permissions)
    sendCompletion(res,"Successfully changed account",false,200);
},"auth.perms.edit")

export function registerAcc(name,pass,isAdmin){
    accounts[name] = ({username: name, password: pass, permissions: isAdmin?"*.*":"user.*"})
    writeFileToStorage("accounts.json",JSON.stringify(accounts));
}
export function removeAcc(name){
    delete accounts[name]
    writeFileToStorage("accounts.json",JSON.stringify(accounts));
}
export function changeProps(name,pass,isAdmin,newName){
    if(newName){
        registerAcc(newName,accounts[name].password,accounts[name].admin);
        removeAcc(name);
        return;
    }
    if(accounts[name].admin)
    delete accounts[name].admin
    if(isAdmin!=undefined){
        accounts[name].permissions = isAdmin?"*.*":"user.*"
        accounts[name].admin = isAdmin
    }
    if(pass){
        accounts[name].password = pass;
    }
    writeFileToStorage("accounts.json",JSON.stringify(accounts));
}
export function editPerms(name,perms){
    accounts[name].permissions = perms;
    writeFileToStorage("accounts.json",JSON.stringify(accounts));
}

Endpoint.get('/accountsRaw', function (req, res) {
    sendJSON(res, (accounts), 200)
},"auth.accounts")

export function getAccount(username) {
    return accounts[username];
}