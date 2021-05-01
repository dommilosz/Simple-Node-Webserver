import {OverrideExpandPermissions} from "../../webserver";
import {checkPerm} from "../../auth-handler";
import {getAccount, registerCustomAccountProp} from "../accountAuth/accountAuth";
import {requireModule} from "../modulesHandler";

requireModule("accountAuth");

OverrideExpandPermissions(function (username, perm) {
    let acc = getAccount(username);
    if (!acc) return;
    let props = acc.customProps;
    let parentAcc = getAccount(props.parent);
    if (!parentAcc) return;
    let perms = parentAcc.permissions;
    let canAccess = false;
    perms.split(';').forEach(el => {
        if (checkPerm(el, perm)) canAccess = true;
    })
    return canAccess;
})

registerCustomAccountProp("parent", "");