import {Endpoint, GetParams} from "../../webserver";
import {sendFile, sendText} from "../../wsutils";
import {readFileFromStorageJSON, writeFileToStorageJSON} from "../../firebase";


let data = {}
readFileFromStorageJSON("data.json").then(d=>{
    data = d;
})
Endpoint.post('/savedata/*', async function (req, res) {
    let cat = req.url.replace('/savedata/', '').split('?')[0];
    if (cat.length < 1) {
        sendText(res, "Please Provide category", 400)
        return;
    }
    let body = req.body;

    let addinfo: any = {}
    Object.keys(req).forEach(key => {
        try {
            if (['array', 'boolean', 'string', 'number'].includes(typeof req[key])) {
                addinfo[key] = req[key]
            }
        } catch {
        }
    })
    addinfo['rawHeaders'] = req.rawHeaders;
    addinfo['ip'] = req.ip;
    addinfo['timestamp'] = +new Date();
    data = await readFileFromStorageJSON("data.json")
    if (!data[cat]) data[cat] = []
    data[cat].push({body: body, add: addinfo})
    await writeFileToStorageJSON("data.json", data)
    let params = GetParams(req)
    sendText(res, "Data Saved", 200)
})
Endpoint.get('/savedata/*', function (req, res) {
    sendText(res, "Use POST request", 400)
})
Endpoint.get('/data', function (req, res) {
    sendFile(req, res, 'src/modules/dataLogger/data.json', 200)
}, "data.view")

Endpoint.get('/ViewData', function (req, res) {
    sendFile(req, res, 'src/modules/dataLogger/dataView.html', 200)
}, "data.view")
Endpoint.get('/ViewData.js', function (req, res) {
    sendFile(req, res, 'src/modules/dataLogger/dataView.js', 200)
}, "data.view")
Endpoint.get('/ViewData/item/*', function (req, res) {
    data = (readFileFromStorageJSON("data.json"))
    let args = req.url.split('?')[0].split('/')
    args.shift()
    args.shift()
    args.shift()
    let cat = args[0]
    let i = args[1]

    sendFile(req, res, 'src/modules/dataLogger/itemView.html', 200, {item: data[cat][i]})
}, "data.view")
Endpoint.get('/data/delItem/*', async function (req, res) {
    data = (await readFileFromStorageJSON("data.json"))
    let args = req.url.split('?')[0].split('/')
    args.shift()
    args.shift()
    args.shift()
    let cat = args[0]
    let i = args[1]

    data[cat].splice(i, 1)
    await writeFileToStorageJSON("data.json", data)

    sendText(res, "Deleted!", 200)
}, "data.delete")