const express = require('express');
const session = require('express-session');
const app = express();
const morgan = require('morgan')
require('dotenv').config();
var url = require('url');

const EDS_USER = process.env.EDS_USER;
const EDS_PASS = process.env.EDS_PASS;
const EDS_PROFILE = 'eds_api';
const SESSION_SECRET = process.env.SESSION_SECRET;

const ebscoAuth = require('./lib/ebscoAuth');


var http = require("http");
var https = require("https");



app.use(session({
	name: 'eds_session',
	secret: SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
        path: '/',
        //domain: 'yourdomain.com',
        maxAge: 1000 * 60 * 24, // 24 hours
        httpOnly: false

	}
}));


app.use(ebscoAuth({
        edsUser: EDS_USER,
        edsPass: EDS_PASS,
        edsInterfaceId: EDS_PROFILE
}));

app.listen(8888, function () {
  console.log('Server has started.');
});




/// Routes////

app.get('/autocomplete', function(req, res){
	var term = req.query.term;

	//get autocomplete info
	//res.json(req.session.autocomplete.Url);

//todo:FIX THIS
	var myURL = 'example.org/';
	console.log(myURL)
	const custId = req.session.autocomplete.CustId;
	const token = req.session.autocomplete.Token;
	const uri = `?term=${term}&idx=rawqueries&filters=[{"name":"custid","values":["${custId}"]}]&${token}`
	const options = {
		host: myURL.host,
		path:encodeURI(uri),
		method: 'GET'
	}

	var autocompleteRequest = https.request(options, function(response) {

		var rawData = '';
		response.setEncoding('utf8');
		//data comes back as chunks, so put them all together
		response.on('data', function(chunk){
			rawData += chunk;
		 console.log(`BODY: ${rawData}`)
		});

		response.on('end', function (){

			try {
				const parsedData = JSON.parse(rawData);
      //return response from EDS-API
			 res.json(parsedData);

			} catch (e) {
				console.error(" there was a problem with the autocomplete Request: " + e.message);
			}

		});

});

autocompleteRequest.on('error', function(e) {
console.error(`problem with request: ${e.message}`);
});

autocompleteRequest.end();

});


app.get('/search', function(req, res){

//send query to EDS-API search endpoint
	var query = req.query.q;
	const uri = `/edsapi/rest/Search?query-1=${query}`;
	console.dir(query);
	var options = {
		host: 'eds-api.ebscohost.com',
		path: encodeURI(uri),
		method: 'GET',

		headers: {
		'Content-Type': 'application/json',
			'x-authenticationToken': req.session.authToken,
			'x-sessionToken': req.session.sessionToken
		},
	};

	var searchRequest = https.request(options, function(response) {

		var rawData = '';
		response.setEncoding('utf8');
		//data comes back as chunks, so put them all together
		response.on('data', function(chunk){
			rawData += chunk;
		 console.log(`BODY: ${rawData}`)
		});

		response.on('end', function (){

			try {
				const parsedData = JSON.parse(rawData);
      //return response from EDS-API
			 res.json(parsedData);

			} catch (e) {
				console.error(" there was a problem with the search request: " + e.message);
			}

		});

});

searchRequest.on('error', function(e) {
console.error(`problem with request: ${e.message}`);
});

searchRequest.end();

});

app.get('/', function (req, res) {
  res.send(req.session);
});

module.exports = app;
