const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

// ✅ Configura as credenciais usando o refresh token do .env
if (process.env.REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
}

// 🔐 Gera URL para autenticação (caso precise reautenticar)
const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
};

// 💾 Se quiser salvar os tokens após obter um code
const setTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

// 🔌 Usa o cliente autenticado
const getSearchConsole = () => {
  return google.searchconsole({ version: 'v1', auth: oauth2Client });
};

// 🔍 Consulta dados
const getSiteReport = async ({ siteUrl, startDate, endDate, dimensions = ['page'], rowLimit = 1000 }) => {
  const searchConsole = getSearchConsole();

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      aggregationType: 'auto',
    },
  });

  return response.data.rows || [];
};

module.exports = {
  getAuthUrl,
  setTokens,
  getSearchConsole,
  getSiteReport,
};
