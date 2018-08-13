var https = require('https');


module.exports = function(ebscoOptions) {

  var auth;

  function getAuthToken(callBack) {

    // if there is an existing auth object and it is not expired, use it
    if(auth && auth.timeStamp + auth.AuthTimeout*1000 > Date.now()) {
      //console.log(Date.now());

      //console.log(auth.timeStamp + +auth.AuthTimeout*1000)
      return callBack(auth);
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
      //data comes back as chunks, so put them all together
      res.on('data', function(chunk){
        rawData += chunk;
      //  console.log(`BODY: ${rawData}`)
      });
      // After we get all the response chunks we can try to parse the data
      res.on('end', function (){
        try {
          const parsedData = JSON.parse(rawData);
          console.dir(parsedData)
          // we are looking for an auth token in the response.
          // handle response that doesn't have an auth token
          if (!parsedData.AuthToken) {
            throw new SyntaxError(parsedData.Reason)
          }
          // We have an auth token so save it so we can reuse it later
          parsedData.timeStamp = Date.now();
          auth = parsedData;
          // return parsed Data from EBSCO API
          callBack(auth);
        } catch (e) {
          console.error(" there was a problem with the auth request: " + e.message);
        }
      });


    req.on('error', function(e) {
      console.error(`problem with request: ${e.message}`);
    });
  });
    //send our request
    req.write(authData);
    //let the server know we are done sending our request
    req.end();

 }

  return {
    search: function(query, count, callBack) {
    // TODO:
    },
    test: function(callBack) {

      getAuthToken(function(auth){
        console.log('were in the getauthtoken callback')
        return callBack(auth);

      });

    },

  };
};
