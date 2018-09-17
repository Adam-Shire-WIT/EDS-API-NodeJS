var https = require('https');
var http = require('http')


module.exports = function(ebscoOptions) {

  return function(req, res, next) {
    getAuthToken(req, function(){
      next();
    });
  };

  var auth = '';


  function getAuthToken(req, callBack) {

    // if there is an existing auth object and it is not yet expired, use it
    if(auth && auth.timeStamp + auth.AuthTimeout*1000 > Date.now()) {
      console.log('using existing auth token')
      req.session.authToken = auth.AuthToken;
      if (!req.session.sessionToken) { // if we don't have a session token, get one
      getSessionToken(req, auth.AuthToken, function(){
        return callBack();
      });
    } else {
      console.log('using existing session token');
      return callBack();
    }

    } else { // get a new auth token
    console.log('getting a new auth token');
    // Get our credential ready to send
    const authData = JSON.stringify({
      UserId : ebscoOptions.edsUser,
      Password : ebscoOptions.edsPass,
      InterfaceId : ebscoOptions.edsInterfaceId,
      //Options : ['autocomplete']
    });


    //set request options
    const options = {
      hostname: 'eds-api.ebscohost.com',
      path: '/authservice/rest/uidauth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': authData.length
      }
    };

    //create a request object
    var authRequest = https.request(options, function(res){
      var rawData = '';
      res.setEncoding('utf8');
      //data comes back as chunks, so put them all together
      res.on('data', function(chunk){
        rawData += chunk;
       console.log(`BODY: ${rawData}`)
      });
      // After we get all the response chunks we can try to parse the data
      res.on('end', function (){
        try {
          const parsedData = JSON.parse(rawData);
          //console.dir(parsedData)
          // we are looking for an auth token in the response.
          // handle response that doesn't have an auth token
          if (!parsedData.AuthToken) {
            throw new SyntaxError(parsedData.Reason)
          }
          // We have an auth token so save it so we can reuse it later
          parsedData.timeStamp = Date.now();
          auth = parsedData;
          req.session.autocomplete = auth.Autocomplete;
          req.session.authToken = auth.AuthToken;
          console.dir(req.session);
          //if we are getting a new auth token we need a new session token too
          getSessionToken(req, auth.AuthToken, function(){
             callBack();
          });



        } catch (e) {
          console.error(" there was a problem with the auth request: " + e.message);
        }
      });


    authRequest.on('error', function(e) {
      console.error(`problem with request: ${e.message}`);
    });
  });
    //send our request
    authRequest.write(authData);
    //let the server know we are done sending our request
    authRequest.end();
  }
 }

 function getSessionToken(req, authToken, callBack) {
  console.log('getting a new session token');

   //TODO: determine guest setting
   var guest = 'n';

 //get session token from Server
   const sessionData = JSON.stringify({
     Profile: ebscoOptions.edsInterfaceId,
     Guest: guest,

   });

   const options = {
     host: 'eds-api.ebscohost.com',
     path: '/edsapi/rest/CreateSession',
     method: 'POST',
     //query : querystring.stringify({ profile: 'edsapi', guest: 'Y'}),
     headers: {
   	'Content-Type': 'application/json',
       'x-authenticationToken': authToken
     }
   };

   //create a request object
   var sessionRequest = https.request(options, function(res){
     var rawData = '';
     res.setEncoding('utf8');
     //data comes back as chunks, so put them all together
     res.on('data', function(chunk){
       rawData += chunk;
     // console.log(`BODY: ${rawData}`)
     });

        //handle respose
     res.on('end', function (){

       try {
         const parsedData = JSON.parse(rawData);
         //console.dir(parsedData)
         // we are looking for a Session token in the response.
         // handle response that doesn't have a session token
         if (!parsedData.SessionToken) {
           throw new SyntaxError(parsedData.Reason)
         }
         //store SessionToken in session
         req.session.sessionToken = parsedData.SessionToken;
        req.session.save();
         callBack();
       } catch (e) {
         console.error(" there was a problem with the session request: " + e.message);
       }

     });


     sessionRequest.on('error', function(e) {
     console.error(`problem with request: ${e.message}`);
    });
   });
   //send our request
   sessionRequest.write(sessionData);
   //let the server know we are done sending our request
   sessionRequest.end();


 } //end getSessionToken


function search(req, callBack) {
      getAuthToken(req, function(req, auth){
        console.log(req.query)
      console.dir(req.session)
        var query = req.query.q;
        var pagenumber = req.query.pagenumber
        const uri = `/edsapi/rest/Search?query=AND,${query}&pagenumber=${pagenumber}`;

        var options = {
          host: 'eds-api.ebscohost.com',
          path: encodeURI(uri),
          method: 'GET',

          headers: {
        	'Content-Type': 'application/json',
            'x-authenticationToken': auth.AuthToken,
            'x-sessionToken': req.session.sessionToken
          },
        };
        var searchRequest = https.request(options, function(res) {

          var rawData = '';
          res.setEncoding('utf8');
          //data comes back as chunks, so put them all together
          res.on('data', function(chunk){
            rawData += chunk;
          console.log(`BODY: ${rawData}`)
          });

          res.on('end', function (){

            try {
              const parsedData = JSON.parse(rawData);
              console.dir(parsedData)
              // we are looking for a Session token in the response.
              // handle response that doesn't have a session token

              callBack(parsedData);
            } catch (e) {
              console.error(" there was a problem with the search request: " + e.message);
            }

          });

      });
      searchRequest.end();

    });
  }

  function test(req, callBack) {

      getAuthToken(req, function(request, auth){

        console.log('were in the getauthtoken callback');

        return callBack(request, auth);

      });

    }

  };
