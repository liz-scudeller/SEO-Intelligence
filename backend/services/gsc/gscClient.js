const { google } = require('googleapis');
const { getOAuthClient } = require('./authService');

const getSearchConsole = () => {
  return google.searchconsole({ version: 'v1', auth: getOAuthClient() });
};

module.exports = getSearchConsole;
