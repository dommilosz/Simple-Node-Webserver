import {readFileFromStorageJSON, writeFileToStorage} from "../../fileStorage";
import {Endpoint, GetParams} from "../../webserver";
import {
    admin_password,
    checkPermission,
    overrideCheckUsername,
    overrideCheckUserPerms,
    overrideReturnPassword
} from "../../auth-handler";
import {atob, sendCompletion, sendFile, sendJSON, sendText} from "../../wsutils";
import {config, getConfig, registerConfigProp} from "../../configHandler";
import {currentModule} from "../modulesHandler";

let accounts = {}
try {
    accounts = readFileFromStorageJSON("accounts.json")
} catch {
    accounts = {}
}

overrideReturnPassword(function (req, username, isAdmin) {
    if (username == "root" && isAdmin) {
        return config.admin_password;
    }
    if (accounts[username]) {
        return accounts[username].password;
    }

    return undefined;
})

overrideCheckUsername(username => {
    if (username == "root") return true;
    return !!accounts[username];
})

overrideCheckUserPerms((username, password) => {
    if (username == "root") return "*.*";
    if (!accounts[username]) return "user.*";
    if (!accounts[username].permissions) return "user.*";
    return (accounts[username].permissions)
})


registerConfigProp(`modules.${currentModule}.registerNeedPermissions`, true);
export let registerNeedPermissions = getConfig(`modules.${currentModule}.registerNeedPermissions`);

Endpoint.get('/register', function (req, res) {
    sendFile(req, res, 'src/modules/accountAuth/register.html', 200)
}, registerNeedPermissions ? "auth.register" : "default")

Endpoint.get('/permsGUI', function (req, res) {
    let params = GetParams(req);
    if (params.user) {
        sendFile(req, res, 'src/modules/accountAuth/permsGUI.html', 200, {user: atob(params.user)})
    } else {
        sendText(res, "Invalid username", 400)
    }

}, "auth.perms.edit")

Endpoint.get('/customPropsGUI', function (req, res) {
    let params = GetParams(req);
    if (params.user) {
        sendFile(req, res, 'src/modules/accountAuth/customProps.html', 200, {user: atob(params.user)})
    } else {
        sendText(res, "Invalid username", 400)
    }

}, "auth.customProps.edit")

Endpoint.get('/register.js', function (req, res) {
    sendFile(req, res, 'src/modules/accountAuth/register.js', 200)
})

Endpoint.get('/accounts', function (req, res) {
    sendFile(req, res, 'src/modules/accountAuth/accounts.html', 200)
}, "auth.accounts")

Endpoint.post('/registerAcc', function (req, res) {
    let body = req.body;
    if (!body.username || !body.password || body.username.length < 4 || body.password.length < 4) {
        sendCompletion(res, "Wrong details", true, 200);
        return;
    }
    let isAdmin = false;
    if (body.level === "admin" && checkPermission(req, "auth.register.admin")) isAdmin = true;
    if (accounts[atob(body.username)]) {
        sendCompletion(res, "Account already exists!", true, 200);
        return;
    }
    registerAcc(atob(body.username), atob(body.password), isAdmin)
    sendCompletion(res, "Successfully created account", false, 200);
}, registerNeedPermissions ? "auth.register" : "default")

Endpoint.post('/deleteAcc', function (req, res) {
    let body = req.body;
    if (!body.username) {
        sendCompletion(res, "Wrong details", true, 200);
        return;
    }
    if (!accounts[(body.username)]) {
        sendCompletion(res, "Account does not exist!", true, 200);
        return;
    }
    removeAcc(body.username)
    sendCompletion(res, "Successfully deleted account", false, 200);
}, "auth.accounts.delete")

Endpoint.post('/changeAcc', function (req, res) {
    let body = req.body;
    if (!body.username) {
        sendCompletion(res, "Wrong details", true, 200);
        return;
    }
    if (!accounts[(body.username)]) {
        sendCompletion(res, "Account does not exist!", true, 200);
        return;
    }
    changeProps(body.username, body.password, body.admin, body.newUsername, body.custom)
    sendCompletion(res, "Successfully changed account", false, 200);
}, "auth.accounts.change")

Endpoint.post('/changePerms', function (req, res) {
    let body = req.body;
    if (!body.username || !body.permissions) {
        sendCompletion(res, "Wrong details", true, 200);
        return;
    }
    if (!accounts[(body.username)]) {
        sendCompletion(res, "Account does not exist!", true, 200);
        return;
    }
    let canChange = true;
    let permsEdit = body.permissions.split(';');
    permsEdit.forEach(el => {
        if (!checkPermission(req, el)) {
            canChange = false;
        }
    })
    if (!canChange) {
        sendCompletion(res, "You don't have permission to change this permissions", true, 200);
        return;
    }

    editPerms(body.username, body.permissions)
    sendCompletion(res, "Successfully changed account", false, 200);
}, "auth.perms.edit")

export function registerAcc(name, pass, isAdmin) {
    accounts[name] = ({username: name, password: pass, permissions: isAdmin ? "*.*" : "user.*"})
    checkAccounts();
    writeFileToStorage("accounts.json", JSON.stringify(accounts));
}

export function removeAcc(name) {
    delete accounts[name]
    writeFileToStorage("accounts.json", JSON.stringify(accounts));
}

export function renameAcc(name,newName){
    if(name==newName)return;
    accounts[newName] = accounts[name];
    delete accounts[name];
}

export function changeProps(name, pass, isAdmin, newName, custom?: { name: string, value: boolean | string | number }) {
    if (newName) {
        renameAcc(name,newName);
        return;
    }
    if (accounts[name].admin)
        delete accounts[name].admin
    if (isAdmin != undefined) {
        accounts[name].permissions = isAdmin ? "*.*" : "user.*"
        accounts[name].admin = isAdmin
    }
    if (pass) {
        accounts[name].password = pass;
    }
    if (custom) {
        accounts[name].customProps = custom;
        checkAccounts();
    }
    writeFileToStorage("accounts.json", JSON.stringify(accounts));
}

export let customProps = {};

export function registerCustomAccountProp(name, defVal: string | boolean | number) {
    customProps[name] = {type: typeof defVal, value: defVal,name:name};
    checkAccounts();
}

export function editPerms(name, perms) {
    accounts[name].permissions = perms;
    writeFileToStorage("accounts.json", JSON.stringify(accounts));
}

Endpoint.get('/accountsRaw', function (req, res) {
    checkAccounts();
    sendJSON(res, (accounts), 200)
}, "auth.accounts")

export function getAccount(username) {
    if(username==="root"){
        return {
            "username": "root",
            "password": admin_password,
            "admin": true,
            "permissions": "*.*",
            "customProps": {
                "parent": "root"
            }
        }
    }
    return accounts[username];
}

export function checkAccounts(){
    Object.keys(accounts).forEach(key => {
        let el = accounts[key];
        if (!el.customProps) el.customProps = {};
        Object.keys(customProps).forEach(key2 => {
            let el2 = customProps[key2];
            if(!el.customProps[el2.name]){
                el.customProps[el2.name] = el2.value;
            }
        })
    })
}