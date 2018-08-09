require('dotenv').config();

const EDS_USER = process.env.EDS_USER;
const EDS_PASS = process.env.EDS_PASS;
const EDS_PROFILE = 'eds_api';

var ebsco = require('./lib/ebsco')({
        edsUser: EDS_USER,
        edsPass: EDS_PASS,
        edsInterfaceId: EDS_PROFILE
});

ebsco.test();
