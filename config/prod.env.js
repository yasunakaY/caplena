const hosts = require('./hosts')

module.exports = {
  NODE_ENV: '"production"',
  // If the CODIT_ENV isn't set, this means we're on local development
  CODIT_ENV: '"' + process.env.CODIT_ENV + '"',
  GAID: '"UA-146043346-1"',
  API_HOST: `"${hosts.API_HOSTS[process.env.CODIT_ENV]}"`,
  API_HTTP_BASE_URI: `"${hosts.API_HTTP_BASE_URIS[process.env.CODIT_ENV]}"`,
  API_WS_BASE_URI: `"${hosts.API_WS_BASE_URIS[process.env.CODIT_ENV]}"`
}
