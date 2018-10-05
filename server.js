const express = require('express');
const session = require('express-session');
const app = express();
const morgan = require('morgan')
var request = require('request');
require('dotenv').config();
//require('request-debug')(request);

const SESSION_SECRET = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "development") {
  var authData = {UserId: process.env.EDS_USER, Password: process.env.EDS_PASS, InterfaceId: 'eds_api'};
}

//sessionData names must be capitalized
var sessionData = {
	"Profile": "eds_api",
	"Guest": "Y"
};

const edsapi = require('./lib/edsapi');

app.use(session({
  name: 'eds_session',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/',
    //domain: 'yourdomain.com',
    maxAge: 1000 * 60 * 24, // 24 hours
    httpOnly: false

  }
}));

app.use(morgan('combined'));

app.listen(8888, function() {
  console.log('Server has started. listening on port 8888');
});

/// middleware /

function handleSearchRequest(req, res, next) {
  //console.log(req.session.authToken);
  //var options = getSavedOptsFromRequest(req) || buildAPIRequestOptions(req);

  var options = {
    url: 'https://eds-api.ebscohost.com/edsapi/rest/Search?query-1=AND,' + req.query.q,
    headers: {
      'Content-Type': 'application/json',
      'x-authenticationToken': req.session.authToken,
      'x-sessionToken': req.session.sessionToken
    },
		json: true
  };

  request.get(options, function(err, response, body) {
    if (err) {
      console.log(err)
      return;
    }

    if (response.statusCode === 400) { // if there is a problem with the request
      refreshAuthToken(req)
			.then(function() {
          refreshSessionToken(req)
					.then(function() {
						handleSearchRequest(req, res, next)
        }).catch(next);
			}).catch(next);


    } else {
			res.body = body;
			next();
		}

  });
};

  function refreshAuthToken(req) {

    var refreshAuthTokenPromise = new Promise(function(resolve, reject) {
      var options = {
        url: 'https://eds-api.ebscohost.com/authservice/rest/UIDauth',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': authData.length
        },
        json: true,
        body: authData
      };

      request.post(options, function(err, response, body) {
        if (err) {
          console.log(err)
          reject(new Error(err))
        }

        var responseBody = body;
        //console.log("auth request returned status code: " + response.statusCode)
        if (response.statusCode === 200) {
          //console.log("setting authToken to: " + responseBody.AuthToken)
          req.session.authToken = responseBody.AuthToken;


          resolve();
        } else {
          //console.log('SOMETHING HAPPENED');
          reject(new Error(responseBody));
        }
      });

    });
    return refreshAuthTokenPromise;
  };

  function refreshSessionToken(req) {

    var refreshSessionTokenPromise = new Promise(function(resolve, reject) {
      var options = {
        url: 'https://eds-api.ebscohost.com/edsapi/rest/CreateSession',
        headers: {
          'Content-Type': 'application/json',
          'x-authenticationToken': req.session.authToken
        },
				json: true,
        body: sessionData

      };

      request.post(options, function(err, response, body) {
        if (err) {
          console.log(err)
          reject(new Error(err))
        }
				
        var responseBody = body;

        if (response.statusCode === 200) {

          req.session.sessionToken = responseBody.SessionToken;

          resolve();
        } else {

          reject("problem with session request" + responseBody);
        }
      });

    });
    return refreshSessionTokenPromise;
  };

  app.use('/search', handleSearchRequest);

  app.get('/search', function(req, res, next) {
    res.json(res.body);
  });
  module.exports = app;
