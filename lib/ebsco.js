var https = require('https');


module.exports = function(ebscoOptions) {

  var authToken;

  function getAuthToken(callBack) {
    // if there is an existing authToken, use it

    if(authToken) {
    //TODO: check for expired token
    return callBack(authToken);
    }

    // Get our credential ready to send
    var authData = JSON.stringify({
      UserId : ebscoOptions.edsUser,
      Password : ebscoOptions.edsPass,
      InterfaceId : ebscoOptions.edsInterfaceId,
      Options : []
    });


    //set request options
    var options = {
      hostname: 'eds-api.ebscohost.com',
      path: '/authservice/rest/uidauth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': authData.length
      }
    };

    //create a request object
    var req = https.request(options, function(res){
      var rawData = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        rawData += chunk;
      //  console.log(`BODY: ${rawData}`)
      });

      res.on('end', function (){
        try {
          const parsedData = JSON.parse(rawData);

          // handle error response
          if (parsedData.ErrorCode) {
            throw new SyntaxError(parsedData.Reason)
          }
          // return auth object
          callBack(parsedData);
        } catch (e) {
          console.error(" there was a problem with the auth request: " + e.message);
        }
      });


    req.on('error', function(e) {
      console.error(`problem with request: ${e.message}`);
    });
  });

    req.write(authData);
    req.end();

 }

  return {
    search: function(query, count, callBack) {
    // TODO:
    },
    test: function() {
      getAuthToken(function(auth){
        console.log(`AuthToken: ${auth.AuthToken}`);
        console.log(`AuthTimeout: ${auth.AuthTimeout}`);
      });
    },

  };
};
