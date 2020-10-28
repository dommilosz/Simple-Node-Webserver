import {config} from "./configHandler";

export const server = require('express')();
export let port = config.ports.web;

export function Create(){
	console.log(`Starting server on port ${port}`)
	server.listen(port);
}
Create();

import {json, Request} from "express";

server.use(json());



export function GetParams(req){
	let url = req.originalUrl
	let params = {};
	url.split("?").slice(1,1024).forEach(element => {
		params[element.split('=')[0]] =  decodeURI(element.split('=')[1]);
	});
	return params
}





