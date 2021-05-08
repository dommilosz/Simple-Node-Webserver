import {Endpoint} from "../../webserver";
import {checkLogin, checkPermission, sendLoginPage} from "../../auth-handler";
import {sendMissingPage, sendMissingPermissionPage, sendText} from "../../wsutils";
import {readFileFromStorageJSON_Safe} from "../../fileStorage";

let files = readFileFromStorageJSON_Safe("files.json");
let allFiles: { id: number, html: string, perm: string }[] = [];
export let additionalFiles = {}
additionalFiles["root"] = files;

Endpoint.get('/view/*', function (req: any, res: any) {
    {
        let src = req.url.split('/view/')[1].split('?')[0];
        allFiles = [];
        Object.keys(additionalFiles).forEach(el => {
            if (additionalFiles[el].forEach)
                additionalFiles[el].forEach(el2 => {
                    allFiles.push(el2);
                })
        })
        let file: { id: number, html: string, perm: string };
        allFiles.forEach(el => {
            if (el.id == src) {
                file = el;
            }
        })
        if (!file || !file.html) {
            sendMissingPage(res);
        } else {
            if (checkPermission(req, file.perm)) {
                sendText(res, file.html, 200);
            } else {
                sendMissingPermissionPage(file.perm,res);
            }

        }

    }

},"user.filehost.view")