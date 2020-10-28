import {server} from "../../webserver";
import {sendFileAuth, sendFileAuthAdmin} from "../../auth-handler";
import {sendFile} from "../../wsutils";

server.get('/admin', function (req, res) {
    sendFileAuthAdmin(req, res, 'src/modules/adminPanel/admin.html', 200)
})
server.get('/admin.js', function (req, res) {
    sendFile(req, res, 'src/modules/adminPanel/admin.js', 200)
})