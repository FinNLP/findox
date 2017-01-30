#!/usr/bin/env node 
if(~process.argv.indexOf("--version") || ~process.argv.indexOf("-v")) {
	console.log(require('../package.json').version);
	process.exit(0);
}

const fs = require('fs');
const path = require('path');
const static = require('node-static');
const read = require('./read.js');
const compile = require('./compile.js');
const assets = require('./assets.js');
const watcher = require('./watch.js');

var io,
	config,
	userconfig = {},
	stopWatching;

try {
	userconfig = fs.readFileSync(path.join(process.cwd(),"findox.config.js"),"utf8");
}
catch(e) {
}

if(~process.argv.indexOf("-w") || ~process.argv.indexOf("--watch")) {
	config.baseurl = "http://127.0.0.1:"+config.previewPort;
	var file = new static.Server(process.cwd());
	const http = require('http').createServer((request, response) => {
	    request.addListener('end',()=>{
	        file.serve(request, response);
	    }).resume();
	}).listen(config.previewPort||3000);
	io = require('socket.io')(http);
}

config.baseurl.replace(/\/$/,"");

build();

function build () {
	read.articles()
	.then((groups)=>{
		// build links array
		config.links = groups.map((group)=>{
			return {
				name:group.name,
				articles:group.articles.map((article)=>{
					return {
						baseurl:config.baseurl,
						name:article.name.replace(/\.md/,""),
						link:group.name+"/"+slugify(article.name.replace(/\.md/,""))+".html"
					};
				})
			};
		});
		// write files
		var promises = groups.reduce((newArr,group)=>{
			group.articles.forEach((article)=>{
				newArr.push(compileAndWrite(article.content,path.join(process.cwd(),group.name,article.name.replace(/\.md$/,".html"))));
			});
			return newArr;
		},[]);
		return promises;
	})
	.then(()=>read.home())
	.then((homeMD)=>compileAndWrite(homeMD,path.join(process.cwd(),"index.html")))
	.then(()=>assets(config.css,config.js,config))
	.then(()=>{
		if(~process.argv.indexOf("--watch") || ~process.argv.indexOf("-w")) {
			io.emit('reload',{for:'everyone'});
			if(stopWatching) stopWatching();
			stopWatching = new watcher(fs.readdirSync(process.cwd()).filter(x=>x==="readme.md"||/^\d\d\./.test(x))).watch(function(event,path){
				build();
			});
		}
	})
	.catch((err)=>{
		console.log(err);
	});
}

function compileAndWrite(data,filepath) {
	return new Promise((resolve,reject)=>{
		compile(data,config)
		.then((compiled)=>{
			mkdirp(path.dirname(filepath));
			fs.writeFile(filepath,compiled,function(err){
				if(err) throw err;
				console.log("	Written:",filepath);
				resolve();
			});
		})
		.catch((err)=>reject(err));
	});
}

function slugify(str) {
	return str.toString().toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}


function isDir(dpath) {
    try {
        return fs.lstatSync(dpath).isDirectory();
    } catch(e) {
        return false;
    }
}

function mkdirp(dirname) {
    dirname = path.normalize(dirname).split(path.sep);
    dirname.forEach((sdir,index)=>{
        var pathInQuestion = dirname.slice(0,index+1).join(path.sep);
        if((!isDir(pathInQuestion)) && pathInQuestion) fs.mkdirSync(pathInQuestion);
    });
}