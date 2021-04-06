import {Endpoint} from "../../webserver";
import {sendFile} from "../../wsutils";

Endpoint.get('/admin', function (req, res) {
    sendFile(req, res, 'src/modules/adminPanel/admin.html', 200)
}, "admin")
Endpoint.get('/admin.js', function (req, res) {
    sendFile(req, res, 'src/modules/adminPanel/admin.js', 200)
}, "admin")