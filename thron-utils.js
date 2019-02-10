var fs = require('fs'),
    request = require('request');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// thron login
var thronLoginUrl = 'https://'+config.thron.clientId+'-view.thron.com/api/xsso/resources/accessmanager/login/'+config.thron.clientId;
var formParams = {
	"username": config.thron.username,
	"password": config.thron.password
}
//request.post({url:thronLoginUrl, form: formParams});


module.exports.login = new Promise(function (resolve, reject) {
    request.post({url:thronLoginUrl, form: formParams}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log("THRON login done: ", body,);
            resolve(JSON.parse(body).tokenId); // TODO
        } else {
            // console.log("Something went wrong with THRON login: error ->" + error +"", body)
            reject();
        }
    });
})