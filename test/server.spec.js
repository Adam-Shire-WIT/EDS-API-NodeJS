const request = require('supertest');
var expect = require('chai').expect;
const server = require('../server')
var nock = require('nock');

var interceptor = nock('https://eds-api.ebscohost.com').persist();

var searchResponseSuccess = JSON.stringify({AN: 'donuts'});
var searchResponseAuthFail = JSON.stringify({ErrorNumber: '104'});
var searchResponseSessionFail = JSON.stringify({ErrorNumber: '108'});
var sessionTokenFail = "bad auth token for session refresh";
var authTokenSuccess = {
  AuthToken: '12345'
}
var sessionTokenSuccess = {
  SessionToken: '6789'
}

describe.only('GET /search', function() {
  describe('with valid auth data', function() {

    //intercept requet for Auth Token
    interceptor.post('/authservice/rest/UIDauth').reply(function(uri, requestBody) {
      return [200, authTokenSuccess];
    });

    //intercept request for session Token
    interceptor.post('/edsapi/rest/CreateSession').reply(function(uri, requestBody) {


      if (this.req.headers['x-authenticationtoken'] != authTokenSuccess.AuthToken) {
        return [400, sessionTokenFail];
      } else {
        return [200, sessionTokenSuccess];
      }
    });

    interceptor.get('/edsapi/rest/Search').query(true).reply(function(uri, requestBody) {

      if (this.req.headers['x-authenticationtoken'] != authTokenSuccess.AuthToken) {
        return [400, searchResponseSessionFail];
      } else if (this.req.headers['x-sessiontoken'] != sessionTokenSuccess.SessionToken) {
        return [400, searchResponseAuthFail];
      } else
        return [200, searchResponseSuccess];
        //TODO: if request body has good session token return 200, searchResponse otherwise return 400
      }
    );

    it('success', function(done) {

      request(server).get('/search')
      //.expect('Content-Type', /json/)
        .expect(200).expect(function(res) {
        //console.log(res)
        expect(res).to.exist;
        expect(searchResponseSuccess)
      }).end(done);

    });

  });


});
