const path = require('path');
const fs = require('fs');

module.exports.home = function () {
	return new Promise(function(resolve,reject){
		fs.readFile(path.join(process.cwd(),"readme.md"),"utf-8",function(err,file){
			if(err) reject("No readme.md file found");
			else resolve(file);
		});
	});
};

module.exports.articles = function () {
	return new Promise(function(resolve,reject){
		fs.readdir(process.cwd(),function(err,files){
			if(err) reject(err);
			else resolve(files
			.filter((name)=>/^\d\d\./.test(name))
			.filter((name)=>fs.lstatSync(path.join(process.cwd(),name)).isDirectory())
			.sort()
			.map((gpname)=>{
				return {
					name:gpname.substr(3),
					articles: fs.readdirSync(path.join(process.cwd(),gpname))
					.filter((name)=>/^\d\d\./.test(name))
					.filter((name)=>!fs.lstatSync(path.join(process.cwd(),gpname,name)).isDirectory())
					.sort()
					.map((name)=>{
						return {
							name:name.substr(3),
							content:fs.readFileSync(path.join(process.cwd(),gpname,name),"utf-8")
						};
					})
				};
			}));
		});
	});
};