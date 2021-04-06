import {Endpoint} from "../../webserver";
import {checkHashes, getHash, hashes_arr, setProp} from "../../auth-handler";
import {sendFile, sendJSON, sendText} from "../../wsutils";
import {config} from "../../configHandler";

Endpoint.get('/hashes', function (req, res) {
    sendJSON(res, hashes_arr, 200)
}, "hashes.view")

Endpoint.get('/ViewHashes', function (req, res) {
    checkHashes()
    sendFile(req, res, 'src/modules/hashesPanel/hashesView.html', 200)
}, "hashes.view")
Endpoint.get('/ViewHashes.js', function (req, res) {
    sendFile(req, res, 'src/modules/hashesPanel/hashesView.js', 200)
}, "hashes.view")

Endpoint.get('/ViewHashes/hash/*', function (req, res) {
    let args = req.url.split('?')[0].split('/')
    args.shift()
    args.shift()
    args.shift()
    let hash = args[0]
    let hash_obj = hashes_arr[hash]
    checkHashes()
    sendFile(req, res, 'src/modules/hashesPanel/hashView.html', 200, {obj: hash_obj})
}, "hashes.view")

Endpoint.post('/setHash', function (req, res) {
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
        if (getHash(hash.hash).used && getHash(hash.hash).usedByHash) {
            setProp(getHash(hash.hash).usedByHash, 'isAdmin', !hash.isAdmin)
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

    sendText(res, "State Changed", 200)
}, "hashes.set")