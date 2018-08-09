var https = require('https');


module.exports = function(ebscoOptions) {

  var authToken;

  function getAuthToken(callBack) {
    // if there is an existing authToken, use it

    if(authToken) {
    //TODO: check for expired token
    return callBack(authToken);
    }



    var authData = JSON.stringify({
      UserId : ebscoOptions.edsUser,
      Password : ebscoOptions.edsPass,
      InterfaceId : ebscoOptions.edsInterfaceId,
      Options : []
    });



    var options = {
      hostname: 'eds-api.ebscohost.com',
      path: '/authservice/rest/uidauth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': authData.length
      }
    };

    var req = https.request(options, function(res){
      var data = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        data += chunk;
        console.log(`BODY: ${data}`)
      });
      res.on('end', function(){
        console.log('No more data in response.');
        console.log(data);
        var auth = JSON.parse(data);

        // TODO: handle request error
        authToken = auth.AuthToken;
        callBack(authToken);
      });
    });

    req.on('error', function(e) {
      console.error(`problem with request: ${e.message}`);
    });
    console.log(authData);
    req.write(authData);
    req.end();
  }


  return {
    search: function(query, count, callBack) {
    // TODO:
    },
    test: function() {
      getAuthToken(function(authToken){
        console.log(authToken);
      });
    },

  };
};
