const marked = require('marked');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const templatefile = fs.readFileSync(path.join(__dirname,"source","template.hbs"),"utf-8");
module.exports = function(data,hbsData){
	return new Promise((resolve,reject)=>{
		hbsData.body = marked(data);
		var template = handlebars.compile(templatefile);
		resolve(template(hbsData));
	});
};