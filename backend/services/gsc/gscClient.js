import { google } from 'googleapis';
import { getOAuthClient } from './authService.js';

export const getSearchConsole = () => {
  return google.searchconsole({ version: 'v1', auth: getOAuthClient() });
};

export default getSearchConsole;
