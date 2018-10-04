const request = require('supertest');
var expect = require('chai').expect;
const server = require('../server')
var nock = require('nock');

var interceptor = nock('https://eds-api.ebscohost.com').persist();

var searchResponseSuccess = JSON.stringify({AN: 'donuts'});
var searchResponseAuthFail = JSON.stringify({ErrorNumber: '104'});
var searchResponseSessionFail = JSON.stringify({ErrorNumber: '108'});
var validAuthToken = '12345'
var validSessionToken = '6789'



interceptor.get('/edsapi/rest/Search').query(true).reply(function(uri, requestBody) {

  if (this.req.headers['x-sessiontoken'] != validSessionToken) {
    return [400, searchResponseSessionFail];
  } else if (this.req.headers['x-authenticationtoken'] != validAuthToken) {
    return [400, searchResponseAuthFail];
  } else
    return [200, searchResponseSuccess];
    //TODO: if request body has good session token return 200, searchResponse otherwise return 400
  }
);

var authResponse = {
  'AuthToken': '12345'
};
interceptor.post('/authservice/rest/UIDauth').reply(200, authResponse);

describe('GET /search', function() {
  it('success', function(done) {


    request(server).get('/search')
    //.expect('Content-Type', /json/)
    .expect(200)
    .expect(function(res) {
    //console.log(res)
      expect(res).to.exist;
      expect(searchResponseSuccess)
    }).end(done);

  });

});
