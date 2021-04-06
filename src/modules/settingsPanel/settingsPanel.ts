import {Endpoint} from "../../webserver";
import {sendFile} from "../../wsutils";
import {setConfig} from "../../configHandler";

Endpoint.get('/config', function (req, res) {
    sendFile(req, res, 'config.json', 200)
}, "settings.config")
Endpoint.get('/settings', function (req, res) {
    sendFile(req, res, 'src/modules/settingsPanel/settings.html', 200)
}, "settings")
Endpoint.get('/settings.js', function (req, res) {
    sendFile(req, res, 'src/modules/settingsPanel/settings.js', 200)
}, "settings")

Endpoint.post('/setSettings', function (req, res) {
    let body = req.body;
    setConfig(body.key, body.value)
    sendFile(req, res, 'config.json', 200)
}, "settings.change")