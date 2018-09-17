var request = require('request');

module.exports.requestAuthToken = function(authData, callback) {

  var options = {
    url: 'https://eds-api.ebscohost.com/authservice/rest/UIDauth',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': authData.length
    },
    body:authData

};

  request.post(options, function(err, response, body) {
    if (!err) {
      callback(null, body);
    }
    else {
      callback(err)
    }

  });
};

module.exports.search = function(query, authToken, sessionToken, callback) {
  //todo: build request, include authtoken and session token in headers

  var options = {
    url: 'https://eds-api.ebscohost.com/edsapi/rest/Search?query-1=AND,' + query,
    headers: {
      'Content-Type': 'application/json',
      'x-authenticationToken': authToken,
      'x-sessionToken': sessionToken
    }


};
  //todo: send request to eds api

  request.get(options, function(err, response, body) {
    if (response.statusCode !== 200) {
      edsApiError = JSON.parse(body);
      console.log('there was an error:' + edsApiError.DetailedErrorDescription)
      callback(edsApiError.ErrorNumber, body);

    }
    else {
      console.log(body)
      callback(null, body)
    }

  });

}
