import {server} from "../../webserver";
import {checkLogin, checkLoginAdmin, sendFileAuth, sendFileAuthAdmin, sendLoginPage} from "../../auth-handler";
import {sendFile} from "../../wsutils";
import {setConfig} from "../../configHandler";

server.get('/config', function (req, res) {
    sendFileAuthAdmin(req, res, 'src/config.json', 200)
})
server.get('/settings', function (req, res) {
    sendFileAuthAdmin(req, res, 'src/modules/settingsPanel/settings.html', 200)
})
server.get('/settings.js', function (req, res) {
    sendFile(req, res, 'src/modules/settingsPanel/settings.js', 200)
})

server.post('/setSettings', function (req, res) {
    if(checkLoginAdmin(req)){
        let body = req.body;
        setConfig(body.key,body.value)
        sendFileAuth(req, res, 'src/config.json', 200)
    }else {
        sendLoginPage(req,res)
    }
})