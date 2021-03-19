import {Request, Response} from "express";
import {Endpoint, GetParams, server} from "./webserver";
import {checkLogin} from "./auth-handler";
import * as fs from "fs";
import {sendFile} from "./wsutils";
import "./modules/modulesHandler";

Endpoint.get('/',function(req, res) {
    sendFile(req,res,'src/index.html',200)
},"user")

Endpoint.get('/index.css',function(req, res) {
    sendFile(req,res,'src/index.css',200)
})

Endpoint.get('/login.js',function(req, res) {
    sendFile(req,res,'src/login.js',200)
})