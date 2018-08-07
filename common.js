var http = require("http");
var https = require("https");
var parseString = require('xml2js').parseString;
var querystring = require("querystring");
var util = require('util');
require('dotenv').config();

const EDS_USER = process.env.EDS_USER;
const EDS_PASS = process.env.EDS_PASS;
const EDS_PROFILE = 'eds_api';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////            Get Session Token from EDS API       ///////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getSessionToken(res, req, authToken){
var sessionTokenXML =''
//req.session.sessionToken=''
//console.log('req : '+util.inspect(req, {showHidden: false, depth: null}));


var options = {
  host: 'eds-api.ebscohost.com',
  path: `/edsapi/rest/createsession?profile=${EDS_PROFILE}&guest=n&limiter=FT:y`,
  method: 'GET',
  //query : querystring.stringify({ profile: 'edsapi', guest: 'Y'}),
  headers: {
	'Content-Type': 'application/xml',
    'x-authenticationToken': authToken
  }
};
console.log(querystring.stringify({ profile: EDS_PROFILE, guest: 'Y', org: ''}));
console.log(authToken);

var request = http.request(options, function(response) {
  console.log('STATUS: ' + response.statusCode);
  console.log('HEADERS: ' + JSON.stringify(response.headers));

response.on('data', function (chunk) {
	sessionTokenXML += chunk
    console.log('BODY: ' + chunk);
  });

response.on('end', function(){
	var xml = sessionTokenXML
	parseString(xml, function (err, result) {
	    console.dir(result)
		console.log(result.CreateSessionResponseMessage.SessionToken[0]);
		session = result.CreateSessionResponseMessage.SessionToken[0];
	    req.session.sessionToken=session;
	    req.session.save();
	});

})
});
request.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
//req.write(postData);
request.end();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////             Get Authentication Token from EDS API            ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getAuthToken(res, req){

  //check for existing Auth token

  // if an doesn't exist get a new one
  // if (!AuthToken) {



var authData = '<UIDAuthRequestMessage xmlns="http://www.ebscohost.com/services/public/AuthService/Response/2012/06/01">'+
	'<UserId>'+EDS_USER+'</UserId>'+
	'<Password>'+EDS_PASS+'</Password>'+
	'<InterfaceId>eds_api</InterfaceId>'+
'</UIDAuthRequestMessage>';
var authTokenXML =''
//console.log('req : '+util.inspect(req, {showHidden: false, depth: null}));

var options = {
  hostname: 'eds-api.ebscohost.com',
  path: '/authservice/rest/uidauth',
  method: 'POST',
  headers: {
    'Content-Type': 'application/xml',
    'Content-Length': authData.length
  }
};

var request = https.request(options, function(response) {
  console.log('STATUS: ' + response.statusCode);
  console.log('HEADERS: ' + JSON.stringify(response.headers));
  req.session.authToken=''
  response.setEncoding('utf8');

response.on('data', function (chunk) {
	authTokenXML += chunk
    console.log('BODY: ' + chunk);
  });

response.on('end', function(){
	var xml = authTokenXML
	parseString(xml, function (err, result) {
	    console.log(result['AuthResponseMessage']['AuthToken'][0]);
	    token = result['AuthResponseMessage']['AuthToken'][0];
	    req.session.authToken=token;
	    getSessionToken(res, req, result['AuthResponseMessage']['AuthToken'][0]);
	    //console.log('req : '+util.inspect(req, {showHidden: false, depth: null}));
	    //console.log('request2 : '+request2.eds_api_session.authToken);
	    req.session.save();
	});
	//console.log('BODY2: ' + authTokenXML);
})

});
request.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
request.write(authData);
request.end();
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function edsResults(res, req, xml){
	console.log("Called edsResults")
	var body =  '<html>\n'+
	'<head>\n'+
	'<meta http-equiv="Content-Type" content="text/html; '+
	'charset=UTF-8" />\n'+
	'</head>\n'+
	'<body>\n'+
	'<div style="padding-left:480px"><form action="/results" method="get">\n'+
	'<input type="text" name="bquery" size="55"><br />\n'+
	'<input type="radio" name="search_options" checked> Keyword \n'+
	'<input type="radio" name="search_options" disabled="disabled"> Title \n'+
	'<input type="radio" name="search_options" disabled="disabled"> Author \n'+
	'<input type="submit" value="Buscar" />\n'+
	'</form></div>\n'+
	'</body>\n'+
	'</html>\n';
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write('<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n');
	res.write(body);


	parseString(xml, function (err, result) {
		if (result.SearchResponseMessageGet != null){
			var totalHits = result.SearchResponseMessageGet.SearchResult[0].Statistics[0].TotalHits[0];
			if (totalHits != 0){
				var resultsLength = result.SearchResponseMessageGet.SearchResult[0].Data[0].Records[0].Record.length;
				res.write('<p>Showing ' + resultsLength + ' of ');
				res.write(totalHits + 'results<p>');
				for (var i = 0; i < resultsLength; i++) {
					var title = result.SearchResponseMessageGet.SearchResult[0].Data[0].Records[0].Record[i].Items[0].Item[0].Data[0];
					if (title != null)
					res.write(i+1 +') <a href="/record?dbid=a9h&an=36108341"> ' + title  + '</a><br />');
			}
			//res.write(util.inspect(result, {showHidden: false, depth: null}))
			//.SearchResponseMessageGet.SearchResult[0].Statistics[0].TotalHits[0]
			}
			else{
				res.write('<div id="noResults"><i>No results found</i></div>');
			}
		}
		else {
			res.write('<div id="error">Error Something went wrong :(</div>');
		}
	});
	res.end();
}

function edsRecord(res, req, xml){
	console.log("Called edsRecord")
	var body =  '<html>\n'+
	'<head>\n'+
	'<meta http-equiv="Content-Type" content="text/html; '+
	'charset=UTF-8" />\n'+
	'</head>\n'+
	'<body>\n'+
	'<div style="padding-left:480px"><form action="/results" method="get">\n'+
	'<input type="text" name="bquery" size="55"><br />\n'+
	'<input type="radio" name="search_options" checked> Keyword \n'+
	'<input type="radio" name="search_options" disabled="disabled"> Title \n'+
	'<input type="radio" name="search_options" disabled="disabled"> Author \n'+
	'<input type="submit" value="Buscar" />\n'+
	'</form></div>\n'+
	'</body>\n'+
	'</html>\n';
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write('<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n');
	res.write(body);

/*
	parseString(xml, function (err, result) {
		if (result.SearchResponseMessageGet != null){
			var totalHits = result.SearchResponseMessageGet.SearchResult[0].Statistics[0].TotalHits[0];
			if (totalHits != 0){
				var resultsLength = result.SearchResponseMessageGet.SearchResult[0].Data[0].Records[0].Record.length;
				res.write('<p>Showing ' + resultsLength + ' of ');
				res.write(totalHits + 'results<p>');
				for (var i = 0; i < resultsLength; i++) {
					var title = result.SearchResponseMessageGet.SearchResult[0].Data[0].Records[0].Record[i].Items[0].Item[0].Data[0];
					if (title != null)
					res.write(i+1 +') ' + title  + '<br />');
			}
			//res.write(util.inspect(result, {showHidden: false, depth: null}))
			//.SearchResponseMessageGet.SearchResult[0].Statistics[0].TotalHits[0]
			}
			else{
				res.write('<div id="noResults"><i>No results found</i></div>');
			}
		}
		else {
			res.write('<div id="error">Error Something went wrong :(</div>');
		}
	});
*/
	res.end();

}


exports.getSessionToken = getSessionToken;
exports.getAuthToken = getAuthToken;
exports.edsResults = edsResults;
exports.edsRecord = edsRecord;
