webserver = require('./webserver.js')
server = webserver.server
auth = require('./auth-handler');
const fs = require("fs");

server.get('/',function(req, res) {
    params = webserver.GetParams(req)
    if(params.hash&&params.username&&params.username.trim()!=""&&auth.CheckHash( params.hash,params.username)){
        res.writeHead(200)
        res.write(fs.readFileSync('./index.html'))
        res.end()
    }else{
        res.writeHead(200)
        res.write(fs.readFileSync('./login.html'))
        res.end()
    }
})

server.get('/index.css',function(req, res) {
    params = webserver.GetParams(req)
    res.writeHead(200)
    res.write(fs.readFileSync('./index.css'))
    res.end()
})

