const fs = require('fs');
const path = require('path');
const coreCss = fs.readFileSync(path.join(__dirname,"./source/core.css"),"utf-8");
const coreJs = fs.readFileSync(path.join(__dirname,"./source/core.js"),"utf-8");
const socketIO = fs.readFileSync(path.join(__dirname,"./source/socket.io.js"),"utf-8");
module.exports = function (additionalCss,additionalJs,config){
	var css = coreCss + (additionalCss||"");
	var js = coreJs + (additionalJs||"");
	if(~process.argv.indexOf("-w") || ~process.argv.indexOf("--watch")) {
		js = js + socketIO.replace("_____port______",config.previewPort);
	}
	fs.mkdir(path.join(process.cwd(),"assets"),function(){
		fs.writeFile(path.join(process.cwd(),"assets","style.css"),css,function(err){
			if(err) throw err;
			console.log("	Written CSS");
		});
		fs.writeFile(path.join(process.cwd(),"assets","script.js"),js,function(err){
			if(err) throw err;
			console.log("	Written JavaScript");
		});
	});
};