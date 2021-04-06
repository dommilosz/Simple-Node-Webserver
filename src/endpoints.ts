import {Endpoint} from "./webserver";
import {sendFile} from "./wsutils";

Endpoint.get('/', function (req, res) {
    sendFile(req, res, 'src/index.html', 200)
}, "user")

Endpoint.get('/index.css', function (req, res) {
    sendFile(req, res, 'src/index.css', 200)
})

Endpoint.get('/login.js', function (req, res) {
    sendFile(req, res, 'src/login.js', 200)
})