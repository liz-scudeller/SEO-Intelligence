import { google } from 'googleapis';
import dotenv from 'dotenv';

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

dotenv.config();


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
export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
};

// 💾 Se quiser salvar os tokens após obter um code
export const setTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

// 🔌 Usa o cliente autenticado
export const getSearchConsole = () => {
  return google.searchconsole({ version: 'v1', auth: oauth2Client });
};

// 🔍 Consulta dados
export const getSiteReport = async ({
  siteUrl,
  startDate,
  endDate,
  dimensions = ['page'],
  rowLimit = 1000,
}) => {
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



async function getAccessToken() {
  const client_id =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID; // fallback

  const client_secret =
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.CLIENT_SECRET; // fallback

  const refresh_token =
    process.env.GOOGLE_REFRESH_TOKEN ||
    process.env.REFRESH_TOKEN; // fallback

  if (!client_id || !client_secret || !refresh_token) {
    throw new Error(
      'Missing OAuth vars: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN (or their fallback CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN).'
    );
  }

  const body = new URLSearchParams({
    client_id,
    client_secret,
    refresh_token,
    grant_type: 'refresh_token',
  }).toString();

  const { default: axios } = await import('axios');
  const { data } = await axios.post(
    'https://oauth2.googleapis.com/token',
    body,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
  );
  return data.access_token;
}


// --- helpers ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fmtDate = (d) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;

function normalizeCountryEnv(v) {
  if (!v) return null;
  const s = String(v).trim().toUpperCase();
  if (s.length === 2) {
    if (s === 'CA') return 'CAN';
    if (s === 'US') return 'USA';
    if (s === 'GB') return 'GBR';
    return s;
  }
  return s;
}

// ===== usa seu getAccessToken() existente =====

// === fetchDay com filtro de país ===
async function fetchDay(accessToken, siteUrl, dateStr, { country } = {}) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const body = {
    startDate: dateStr,
    endDate: dateStr,
    dimensions: ['date', 'query', 'page', 'country'],
    rowLimit: 25000,
    dataState: 'final',
    type: 'web',
    ...(country ? {
      dimensionFilterGroups: [{
        filters: [{ dimension: 'country', operator: 'equals', expression: country }]
      }]
    } : {})
  };

  const { default: axios } = await import('axios');
  const { data } = await axios.post(url, body, { headers, timeout: 60000 });
  return data.rows || [];
}

// === upsert com double-check do país ===
async function upsertRows(supabaseClient, rows, userId, { country } = {}) {
  if (!rows.length) return 0;
  const target = country ? String(country).toLowerCase() : null;

  const payload = rows
    .map(r => {
      const [date, query, page, ctry] = r.keys;
      const c = (ctry || '').toLowerCase();
      if (target && c !== target) return null;
      return {
        user_id: userId,
        date,
        query,
        page: page || '',
        country: c, // armazenando minúsculo (ex.: 'can')
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
        ctr: r.ctr ?? null,
        position: r.position ?? null,
      };
    })
    .filter(Boolean);

  if (!payload.length) return 0;

  const { error } = await supabaseClient
    .from('gsc_queries')
    .upsert(payload, { onConflict: 'user_id,date,query_norm,page,country' });

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  return payload.length;
}

// === FUNÇÃO PRINCIPAL CORRIGIDA ===
export async function runGSCIngest({ onLog = () => {}, userId, siteUrl, days, country } = {}) {
  // 1) cria o client do Supabase no escopo CORRETO
  const { createClient } = await import('@supabase/supabase-js');
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or key');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 2) resolve parâmetros
  let resolvedUserId = userId || process.env.GSC_USER_ID || null;
  const resolvedSiteUrl = siteUrl || process.env.GSC_SITE_URL;
  const resolvedDays = Number(days || process.env.GSC_DAYS || 90);
  const resolvedCountry = normalizeCountryEnv(country || process.env.GSC_COUNTRY || 'CAN');

  if (!resolvedSiteUrl) throw new Error('Missing GSC_SITE_URL');

  if (!resolvedUserId) {
    const { data, error } = await supabase
      .from('services')
      .select('user_id')
      .eq('active', true)
      .limit(1);
    if (error) throw new Error('Failed to resolve user_id from services: ' + error.message);
    if (!data?.length) throw new Error('Could not resolve user_id: no active services found');
    resolvedUserId = data[0].user_id;
  }

  onLog(`Filtering country=${resolvedCountry}`);

  // 3) roda ingest
  const accessToken = await getAccessToken();
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (resolvedDays - 1));

  let total = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = fmtDate(d);
    try {
      const rows = await fetchDay(accessToken, resolvedSiteUrl, day, { country: resolvedCountry });
      const inserted = await upsertRows(supabase, rows, resolvedUserId, { country: resolvedCountry });
      total += inserted;
      if (inserted) onLog(`• ${day}: ${inserted} rows`);
    } catch (e) {
      onLog(`! ${day}: ${e?.response?.data?.error?.message || e.message}`);
    }
    await sleep(250);
  }

  onLog(`Done. Upserted ~${total} rows into gsc_queries.`);
}

// lista propriedades do GSC acessíveis pelo refresh_token atual
// usa o mesmo getAccessToken() que você já tem
export async function listGscSites() {
  const accessToken = await getAccessToken();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // ✅ endpoint correto (sem /list)
  const url = 'https://searchconsole.googleapis.com/webmasters/v3/sites';
  // (se preferir o host antigo, também funciona: 'https://www.googleapis.com/webmasters/v3/sites')

  const { data } = await axios.get(url, { headers, timeout: 30000 });
  return data?.siteEntry ?? [];
}