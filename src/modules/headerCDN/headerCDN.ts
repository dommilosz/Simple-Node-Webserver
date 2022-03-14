import {Endpoint, GetParams} from "../../webserver";
import {HttpGet} from "http-client-methods";

Endpoint.get('/hcdn', async function (req, res) {
    let params: any = GetParams(req);
    let url = decodeURIComponent(params.url);
    let headers = JSON.parse(decodeURIComponent(params.headers));

    let resp = await HttpGet(url,undefined,true);
    let resHeaders:any = getHeaders(resp.headers);

    Object.keys(headers).forEach(key=>{
        resHeaders[key] = headers[key];
    })

    Object.keys(resHeaders).forEach(key=>{
        res.setHeader(key,resHeaders[key]);
    })

    res.writeHead(200);
    res.write(await resp.text());
})

const getHeaders = (headers) => {
    let headerObj = {};
    const keys = headers.keys();
    let header = keys.next();
    while (header.value) {
        headerObj[header.value] = headers.get(header.value);
        header = keys.next();
    }
    return headerObj;
};