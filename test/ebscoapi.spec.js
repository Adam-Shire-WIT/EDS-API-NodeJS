var expect = require('chai').expect;
var nock = require('nock');
var edsapi = require('../lib/edsapi');

const authData = JSON.stringify({UserId: 'username', Password: 'password', InterfaceId: 'eds_api'});
const sessionData = JSON.stringify({'Profile': 'edsapi', 'Guest': 'y'});

var interceptor = nock('https://eds-api.ebscohost.com').persist();

describe('requestSessionToken()', function() {

  var sessionResponse = {
    'SessionToken': '6789'
  };
  interceptor.post('/edsapi/rest/CreateSession').reply(200, sessionResponse);

  it('returns a Session Token', function(done) {

    var authToken = '12345';
    edsapi.requestSessionToken(sessionData, authToken, function(err, response) {
      if (err) {
        done();
        return console.log(err);
      }
      expect(response).to.exist;
      expect(JSON.parse(response.body).SessionToken).to.equal(sessionResponse.SessionToken);
      done()
    });
  });
});

describe('requestAuthToken()', function() {
  var authResponse = {
    'AuthToken': '12345'
  };


  interceptor.post('/authservice/rest/UIDauth').reply(200, authResponse);

  it('returns an Auth Token', function(done) {
    this.timeout(3000);

    edsapi.requestAuthToken(authData, function(err, response) {
      if (err) {
        done();
        return console.log(err);
      }

      expect(response).to.exist;
      expect(JSON.parse(response.body).AuthToken).to.equal(authResponse.AuthToken);
      done();
    });

  });
});

describe('sendSearchRequest()', function() {
  var searchResponseSuccess = JSON.stringify({AN: 'donuts'});
  var searchResponseAuthFail = JSON.stringify({ErrorNumber: '104'});
  var searchResponseSessionFail = JSON.stringify({ErrorNumber: '108'});
  var validAuthToken = '12345'
  var validSessionToken = '6789'
  

  beforeEach(function() {


    interceptor.get('/edsapi/rest/Search').query(true).reply(function(uri, requestBody) {
      if (this.req.headers['x-authenticationtoken'] != validAuthToken) {
        return [400, searchResponseAuthFail];
      } else if (this.req.headers['x-sessiontoken'] != validSessionToken) {
        return [400, searchResponseSessionFail];
      } else
      return [200, searchResponseSuccess];
      //TODO: if request body has good session token return 200, searchResponse otherwise return 400
    });
  });



  describe('with valid auth token and session token', function() {


    it('returns a response from the EDS API search endpoint', function(done) {
      var query = 'salad';
      var authToken = validAuthToken;
      var sessionToken = validSessionToken;
      edsapi.sendSearchRequest(query, authToken, sessionToken, function(err, response) {
        if (err) {
          done();
          return console.log(err);
        }

        expect(response.body).to.equal(searchResponseSuccess)
        done();
      });

    });
  });
  describe('with invalid auth token and session token', function() {
    it('returns a response from the EDS API search endpoint', function(done) {
      var query = 'salad';
      var authToken = 'invalid auth token';
      var sessionToken = validSessionToken;
      edsapi.sendSearchRequest(query, authToken, sessionToken, function(err, response) {
        if (err) {
          done();
          return console.log(err);
        }

        expect(response.body).to.equal(searchResponseAuthFail);
        done();
      });

    });
  });

});
