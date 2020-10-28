import {GetParams, server} from "../../webserver";
import {checkLogin, checkLoginAdmin, sendFileAuth, sendFileAuthAdmin} from "../../auth-handler";
import * as fs from "fs";
import {sendFile} from "../../wsutils";

if (!fs.existsSync('src/modules/dataLogger/data.json')) {
    fs.writeFileSync('src/modules/dataLogger/data.json', JSON.stringify({}))
}
let data = JSON.parse(fs.readFileSync('src/modules/dataLogger/data.json', {encoding: "utf-8"}))
server.post('/savedata/*', function (req, res) {
    let cat = req.url.replace('/savedata/', '');
    if (cat.length < 1) {
        res.writeHead(400)
        res.write("Please Provide category")
        res.end()
        return;
    }
    let body = req.body;

    let addinfo: any = {}
    Object.keys(req).forEach(key => {
        try {
            if(['array','boolean','string','number'].includes(typeof req[key])){
                addinfo[key] = req[key]
            }
        } catch {
        }
    })
    addinfo['rawHeaders'] = req.rawHeaders;
    addinfo['ip'] = req.ip;
    addinfo['timestamp'] = + new Date();
    data = JSON.parse(fs.readFileSync('src/modules/dataLogger/data.json', {encoding: "utf-8"}))
    if (!data[cat]) data[cat] = []
    data[cat].push({body: body, add: addinfo})
    fs.writeFileSync('src/modules/dataLogger/data.json', JSON.stringify(data))
    let params = GetParams(req)
    res.writeHead(200)
    res.write("Data Saved")
    res.end()
})
server.get('/savedata/*', function (req, res) {
    res.writeHead(400)
    res.write("Use POST request")
    res.end()
})
server.get('/data', function (req, res) {
    sendFileAuthAdmin(req, res, 'src/modules/dataLogger/data.json', 200)
})

server.get('/ViewData', function (req, res) {
    sendFileAuthAdmin(req, res, 'src/modules/dataLogger/dataView.html', 200)
})
server.get('/ViewData.js', function (req, res) {
    sendFile(req, res, 'src/modules/dataLogger/dataView.js', 200)
})
server.get('/ViewData/item/*', function (req, res) {
    if (checkLoginAdmin(req)) {
        data = JSON.parse(fs.readFileSync('src/modules/dataLogger/data.json', {encoding: "utf-8"}))
        let args = req.url.split('?')[0].split('/')
        args.shift()
        args.shift()
        args.shift()
        let cat = args[0]
        let i = args[1]

        let html = fs.readFileSync('src/modules/dataLogger/itemView.html', {encoding: 'utf-8'})
        html = html.replace('{"json": "obj"}', `(JSON.parse(atob('${(Buffer.from(JSON.stringify(data[cat][i])).toString('base64'))}')))`)
        res.writeHead(200)
        res.write(html)
        res.end()

    } else {
        sendFile(req, res, './src/login.html', 200)
    }
})
server.get('/data/delItem/*', function (req, res) {
    if (checkLoginAdmin(req)) {
        data = JSON.parse(fs.readFileSync('src/modules/dataLogger/data.json', {encoding: "utf-8"}))
        let args = req.url.split('?')[0].split('/')
        args.shift()
        args.shift()
        args.shift()
        let cat = args[0]
        let i = args[1]

        data[cat].splice(i,1)
        fs.writeFileSync('src/modules/dataLogger/data.json', JSON.stringify(data))

        res.writeHead(200)
        res.write("Deleted!")
        res.end()

    } else {
        sendFile(req, res, './src/login.html', 200)
    }
})