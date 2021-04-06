import {Endpoint} from "../../webserver";
import {checkLogin, checkPermission, sendLoginPage} from "../../auth-handler";
import {sendText} from "../../wsutils";
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
            sendText(res, "<h1>Error 404 - Not Found</h1><br/><span>Weird place, Void. If you think that something except of this text should be here contact the administrator</span>", 404)
        } else {
            if (!checkLogin(req)) {
                sendLoginPage(req, res);
                return;
            }
            if (checkPermission(req, file.perm)) {
                sendText(res, file.html, 200);
            } else {
                sendText(res, `<h1>403 - Forbidden</h1>You don't have access to this resource<br>Permission: <code>${file.perm}</code>`, 403)
            }

        }

    }

})