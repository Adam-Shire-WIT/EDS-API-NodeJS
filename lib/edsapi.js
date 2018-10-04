var request = require('request');

var edsapi = {

  requestAuthToken: function(authData, callback) {

    //console.log(myauthData);

    var options = {
      url: 'https://eds-api.ebscohost.com/authservice/rest/UIDauth',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': authData.length
      },
      body: authData
    };

    request.post(options, function(err, response) {
      if (err) {
        return callback(err);
      }
      callback(null, response);
    });
  },

  requestSessionToken: function(sessionData, authToken, callback) {
    var options = {
      url: 'https://eds-api.ebscohost.com/edsapi/rest/CreateSession',
      headers: {
        'Content-Type': 'application/json',
        'x-authenticationToken': authToken
      },
      body: sessionData
    };

    request.post(options, function(err, response) {
      if (err) {
        return callback(err);
      }
      callback(null, response);
    });
  },

  sendSearchRequest: function(query, authToken, sessionToken, callback) {
    var options = {
      url: 'https://eds-api.ebscohost.com/edsapi/rest/Search?query-1=AND,' + query,
      headers: {
        'Content-Type': 'application/json',
        'x-authenticationToken': authToken,
        'x-sessionToken': sessionToken
      }
    };

    request.get(options, function(err, response, body) {
      if (err) {
        return callback(err);
      }
      //console.log(response)
      callback(null, response);
    });
  }
}
module.exports = edsapi;
