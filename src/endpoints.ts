import {Request, Response} from "express";
import {GetParams, server} from "./webserver";
import {checkLogin, sendFileAuth} from "./auth-handler";
import * as fs from "fs";
import {sendFile} from "./wsutils";
import "./modules/modulesHandler";

server.get('/',function(req, res) {
    sendFileAuth(req,res,'src/index.html',200)
})

server.get('/index.css',function(req, res) {
    sendFile(req,res,'src/index.css',200)
})