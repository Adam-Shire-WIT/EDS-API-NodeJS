var express = require('express');
var session = require('express-session');
var app = express();
var morgan = require('morgan')
require('dotenv').config();

const EDS_USER = process.env.EDS_USER;
const EDS_PASS = process.env.EDS_PASS;
const EDS_PROFILE = 'eds_api';
const SESSION_SECRET = process.env.SESSION_SECRET;

var ebsco = require('./lib/ebsco')({
        edsUser: EDS_USER,
        edsPass: EDS_PASS,
        edsInterfaceId: EDS_PROFILE
});


var querystring = require("querystring");
var http = require("http");
var https = require("https");
var parseString = require('xml2js').parseString;
var util = require('util');
//EDS common functions used for this API implementations
var foobar = require('./common.js');




app.use(morgan('combined'))

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



app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});

/*
app.use(cookieSession({
  name: 'eds_session',

}))
*/



app.listen(8888, function () {
  console.log('Server has started.');
});


/// Routes////
app.get('/', function (req, res) {
  res.send('EBSCO Node.js API Implementation');
});



app.get('/search', function (req, res, next) {
//console.log('req : '+util.inspect(req, {showHidden: false, depth: null}));
ebsco.search(req, function(data){
   res.json(data);
});
//var body =  '<html>\n'+
// '<head>\n'+
// '<meta http-equiv="Content-Type" content="text/html; '+
// 'charset=UTF-8" />\n'+
// '</head>\n'+
// '<body>\n'+
// '<div style="padding-left:480px"><form action="/results" method="get">\n'+
// '<input type="text" name="bquery" size="55"><br />\n'+
// '<input type="radio" name="search_options" checked> Keyword \n'+
// '<input type="radio" name="search_options" disabled="disabled"> Title \n'+
// '<input type="radio" name="search_options" disabled="disabled"> Author \n'+
// '<input type="submit" value="Buscar" />\n'+
// '</form></div>\n'+
// '</body>\n'+
// '</html>\n';

//res.writeHead(200, {"Content-Type": "text/html"});
//res.write(body);
//res.end();


});

/////////////////////////////////////////////////////////////


app.get('/results', function (req, res, edsResults) {
console.log("Request handler 'results' was called.");
var resultsXML ='';
var bquery2 = querystring.escape(req.query.bquery)
console.log ('palabra clave: ' + bquery2);
var options = {
  host: 'eds-api.ebscohost.com',
  path: '/edsapi/rest/Search?query-1=AND,' + bquery2,
  method: 'GET',

  headers: {
	'Content-Type': 'application/xml',
    'x-authenticationToken': req.session.authToken,
    'x-sessionToken': req.session.sessionToken
  }
};


///// Real request
var request = http.request(options, function(response) {
	console.log('STATUS: ' + response.statusCode);
	console.log('HEADERS: ' + JSON.stringify(response.headers));

	response.on('data', function (chunk) {
		resultsXML += chunk
	    // console.log('BODY: ' + chunk);
	  });

	response.on('end', function(){
		var xml = resultsXML
		parseString(xml, function (err, result) {
			// console.dir(result)
		});
		foobar.edsResults(res, req, xml);
	})
});

request.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});
request.end();
///////

});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////      EDS Record View     ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/record', function (req, res, edsRecord) {
console.log("Request handler 'record' was called.");
var recordXML ='';
var dbid = querystring.escape(req.query.dbid)
var an   = querystring.escape(req.query.an)
//http://eds-api.ebscohost.com  dbid=a9h&an=36108341
var options = {
  host: 'eds-api.ebscohost.com',
  path: '/edsapi/rest/retrieve?dbid=' + dbid + '&an=' + an ,
  method: 'GET',

  headers: {
	'Content-Type': 'application/xml',
    'x-authenticationToken': req.session.authToken,
    'x-sessionToken': req.session.sessionToken
  }
};


var request = http.request(options, function(response) {
	console.log('STATUS: ' + response.statusCode);
	console.log('HEADERS: ' + JSON.stringify(response.headers));

	response.on('data', function (chunk) {
		recordXML += chunk
	    //console.log('BODY: ' + chunk);
	  });

	response.on('end', function(){
		var xml = recordXML
		parseString(xml, function (err, result) {
			//console.dir(result)
		});
		foobar.edsRecord(res, req, xml);
	})
});

request.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});
request.end();

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/test', function (req, res) {

	ebsco.test(req, function(request, auth){
    const body = {
      "auth token" : auth,
     "session token" : request.session,
   }
    res.send(body);

  });

});
