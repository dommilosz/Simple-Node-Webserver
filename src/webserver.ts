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

	let regex = /\?[a-z0-9]*=[^?]*/gm;
	let m;
	while ((m = regex.exec(url)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		m.forEach((match, groupIndex) => {
			match = match.replace('?','')
			let matcharr = match.split('=')
			matcharr.shift()
			params[match.split('=')[0]] = matcharr.join('=')
		});
	}

	return params
}





