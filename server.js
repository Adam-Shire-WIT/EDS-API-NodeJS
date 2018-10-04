const express = require('express');
const session = require('express-session');
const app = express();
const morgan = require('morgan')
var request = require('request');
require('dotenv').config();

const SESSION_SECRET = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "development") {
  var authData = JSON.stringify({UserId: 'username', Password: 'password', InterfaceId: 'eds_api'});
}

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
    url: 'https://eds-api.ebscohost.com/edsapi/rest/Search?query-1=AND,' + req.query,
    headers: {
      'Content-Type': 'application/json',
      'x-authenticationToken': req.session.authToken,
      'x-sessionToken': '6789'
    }
  };

  request.get(options, function(err, response, body) {
    if (err) {
      console.log(err)
      return;
    }
    //console.log("before refresh: " + req.session.authToken)
    if (response.statusCode === 400) { // if there is a problem with the request
      //  console.log("search request returned status code: " + response.statusCode)
      //	console.log("here are the options I'm about to save")
      //console.log(options)
      //saveOptsToRequest(req, options)
      refreshAuthToken(req).then(function authOk() {
        //console.log("after refresh: " + req.session.authToken)
        handleSearchRequest(req, res, next) // call function again
      }).catch(function authKo() {
        res.status(500).send('something');
      });
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

        //console.log(req.session.authToken)
        resolve();
      } else {
        //console.log('SOMETHING HAPPENED');
        reject(new Error("SOMETHING!!!"));
      }
    });

  });
  return refreshAuthTokenPromise;
};

app.use('/search', handleSearchRequest);

app.get('/search', function(req, res, next) {
  res.json(res.body);
});
module.exports = app;
