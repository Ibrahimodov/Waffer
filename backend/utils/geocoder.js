const NodeGeocoder = require('node-geocoder');

const options = {
  provider: process.env.GEOCODER_PROVIDER || 'openstreetmap',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY, // Optional for some providers
  formatter: null
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;