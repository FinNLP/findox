const fs = require("fs");
const path = require("path");

var watcher = function (paths) {
	if(typeof paths === "string") paths = [paths]; // always take arrays

	paths.forEach((singlePath)=>{
		if(!fs.fileExists(singlePath)) throw new Error(singlePath + " doesn't exist, or it's inaccessible");
	});

	this.paths = paths;

	var _dirs = {};
	var _files = {};

	this.paths.forEach((singlePath)=>{
		if(fs.isDir(singlePath)) {
			_dirs[singlePath] = getTInSec(singlePath);
			readdirRecDirs(singlePath).forEach((x)=>{
				_dirs[x] = getTInSec(x);
			});
			readdirRecFiles(singlePath).forEach((x)=>{
				_files[x] = getTInSec(x);
			});
		}
		else {
			_files[singlePath] = getTInSec(singlePath);
		}
	});

	this.files = _files;
	this.dirs = _dirs;
};

watcher.prototype.watch = function (callback) {
	if(!callback) throw new Error("A callback must be passed to the watcher");
	var interval = setInterval(()=>{
		for(var singlePath in this.dirs) {
			if (this.dirs.hasOwnProperty(singlePath)) {
				var oldTime = this.dirs[singlePath];
				if(!fs.fileExists(singlePath)) {
					delete this.dirs[singlePath];
					return;
				}
				var newTime = getTInSec(singlePath);
				if(newTime > oldTime) {
					this.dirs[singlePath] = newTime;
					readdirRecFiles(singlePath)
					.forEach((newFilePath)=>{
						if(!this.files[newFilePath]) callback("added",newFilePath);
						this.files[newFilePath] = getTInSec(newFilePath);
					});
				}
			}
		}
		for(var singlePath in this.files) {
			if (this.files.hasOwnProperty(singlePath)) {
				var oldTime = this.files[singlePath];
				if(!fs.fileExists(singlePath)) {
					delete this.files[singlePath];
					return;
				}
				var newTime = getTInSec(singlePath);
				if(newTime > oldTime) {
					this.files[singlePath] = newTime;
					callback("modified",singlePath);
				}
			}
		}
	},1000);
	return function(){
		clearInterval(interval);
	};
};

module.exports = watcher;

fs.isDir = function(dpath) {
	try {
		if(fs.lstatSync(dpath).isDirectory()) return true;
		else return false;
	} catch(e) {
		return false;
	}
};
fs.fileExists = function(filePath){
	try {
		fs.accessSync(filePath);
		return true;
	}
	catch(e) {
		return false;
	}
};
fs.readdirRec = function (dir) {
	if(!fs.isDir(dir)) throw new Error("The directory to be read must be valid and accessible");
	return fs.readdirSync(dir)
	.map((fileName)=>path.join(dir,fileName)) // add the directory
	.reduce((arr,fileDir)=>{
		if(fs.isDir(fileDir)) fs.readdirRec(fileDir).forEach((x)=>arr.push(x));
		else arr.push(fileDir);
		return arr;
	},[]);
};

function readdirRecFiles (dir) {
	return fs.readdirSync(dir)
	.reduce((arr,fileName)=>{
		var fileDir = path.join(dir,fileName);
		if(fs.isDir(fileDir)) readdirRecFiles(fileDir).forEach((x)=>arr.push(x));
		else arr.push(fileDir);
		return arr;
	},[]);
}

function readdirRecDirs(dir) {
	return fs.readdirSync(dir)
	.reduce((arr,fileName)=>{
		var fileDir = path.join(dir,fileName);
		if(fs.isDir(fileDir)) {
			arr.push(fileDir);
			readdirRecDirs(fileDir).forEach((x)=>arr.push(x));
		}
		return arr;
	},[]);	
}

function getTInSec(filePath) {
	return new Date (fs.statSync(filePath).mtime).getTime();
}