var expect = require('chai').expect;
var nock = require('nock');
var eds = require('../lib/edsapi')

describe('requestAuthToken()', function() {
  var authResponse = {
    "AuthToken": "12345"
  }
  options = {
    allowUnmocked: true
  };
  nock('https://eds-api.ebscohost.com', options).post('/authservice/rest/UIDauth').reply(200, authResponse);

  it('returns an Auth Token', function(done) {
    this.timeout(3000);

    var validAuthData = JSON.stringify({UserId: 'username', Password: 'password', InterfaceId: 'eds_api'});

    eds.requestAuthToken(validAuthData, function(err, authToken) {

      expect(authToken).to.exist;
      expect(JSON.parse(authToken)).to.have.property('AuthToken');
      done();
    });

  });
});
describe('search()', function(){
  describe('called with valid auth and session token', function() {
    it('returns results from eds search API', function(done) {
      var searchResponse = JSON.stringify({AN: '12345'});
      nock('https://eds-api.ebscohost.com').get('/edsapi/rest/Search').query(true).reply(200, searchResponse);
      query = "salad";
      authToken = 12345;
      sessionToken = 6789;
      eds.search(query, authToken, sessionToken, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data).to.equal(searchResponse)
        done();
      });
    });
  });
  describe('called without valid auth token', function(){
    it('returns an error', function(done){
      eds.search(query, authToken, sessionToken, function(err, data){
        expect(err).to.not.be.null;
        done();
      })
    })
  })

})
