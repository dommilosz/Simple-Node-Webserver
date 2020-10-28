import {server} from "../../webserver";
import {
    checkHashes,
    checkLoginAdmin, getHash,
    hashes_arr,
    one_time_hashes,
    sendAdminLoginPage,
    sendLoginPage, setProp
} from "../../auth-handler";
import {sendFile} from "../../wsutils";
import * as fs from "fs";
import {config} from "../../configHandler";

server.get('/hashes', function (req, res) {
    if (checkLoginAdmin(req)) {
        res.writeHead(200)
        res.write(JSON.stringify(hashes_arr))
        res.end()
    } else {
        sendAdminLoginPage(req, res)
    }
})
server.get('/one_times', function (req, res) {
    if (checkLoginAdmin(req)) {
        res.writeHead(200)
        res.write(JSON.stringify(one_time_hashes))
        res.end()
    } else {
        sendAdminLoginPage(req, res)
    }
})

server.get('/ViewHashes', function (req, res) {
    if (checkLoginAdmin(req)) {
        checkHashes()
        res.writeHead(200)
        res.write(fs.readFileSync('src/modules/hashesPanel/hashesView.html', {encoding: 'utf-8'}).replace('{"token_lifetime": 1}', String(config.auth.token_lifetime)))
        res.end()
    } else {
        sendAdminLoginPage(req, res)
    }
})
server.get('/ViewHashes.js', function (req, res) {
    sendFile(req, res, 'src/modules/hashesPanel/hashesView.js', 200)
})

server.get('/ViewHashes/hash/*', function (req, res) {
    if (checkLoginAdmin(req)) {
        let args = req.url.split('?')[0].split('/')
        args.shift()
        args.shift()
        args.shift()
        let hash = args[0]
        let hash_obj = hashes_arr[hash] ? hashes_arr[hash] : one_time_hashes[hash]
        checkHashes()
        let html = fs.readFileSync('src/modules/hashesPanel/hashView.html', {encoding: 'utf-8'})
        html = html.replace('{"json": "obj"}', `(JSON.parse('${JSON.stringify(hash_obj)}'))`)
        html = html.replace('{"json": "obj"}', `(JSON.parse('${JSON.stringify(hash_obj)}'))`)
        res.writeHead(200)
        res.write(html)
        res.end()

    } else {
        sendFile(req, res, './src/login.html', 200)
    }
})

server.post('/setHash', function (req, res) {
    if (checkLoginAdmin(req)) {
        let body = req.body;
        let hash = body.hash;
        if (body.type == "refresh") {
            setProp(hash.hash, "expired", false)
            setProp(hash.hash, "lastUpdated", Math.round(+new Date() / 1000))
            checkHashes()
        }
        if (body.type == "invalid") {
            setProp(hash.hash, "expired", true)
            setProp(hash.hash, "lastUpdated", Math.round(+new Date() / 1000) - (config.auth.token_lifetime + 60))
            checkHashes()
        }
        if (body.type == "admin") {
            if(getHash(hash.hash).used&&getHash(hash.hash).usedByHash){
                setProp(getHash(hash.hash).usedByHash,'isAdmin',!hash.isAdmin)
            }
            setProp(hash.hash, 'isAdmin', !hash.isAdmin)
            checkHashes()
        }
        if (body.type == "used") {
            setProp(hash.hash, 'used', !hash.used)
            setProp(hashes_arr[hash.usedByHash].hash, 'usedHashOTP', undefined)
            setProp(hash.hash, 'usedBy', undefined)
            setProp(hash.hash, 'usedByHash', undefined)
            checkHashes()
        }


        res.writeHead(200)
        res.write("State Changed")
        res.end()
    } else {
        sendLoginPage(req, res)
    }
})