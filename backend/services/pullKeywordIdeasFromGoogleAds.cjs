// Busca Keyword Ideas por serviço × localidade (EN) usando Google Ads REST,
// resolvendo automaticamente o GeoTarget para cada cidade (geoTargetConstants:suggest).
// Tudo dinâmico por usuário: lê user_id do service, carrega locations do mesmo user,
// e grava keyword_ideas com o user_id do service.
//
// Uso:
//   node services/pullKeywordIdeasFromSupabase.cjs --top=60 --per-loc=40 --update-services
//   node services/pullKeywordIdeasFromSupabase.cjs --top=60 --per-loc=40 --update-services --save-ideas
//   node services/pullKeywordIdeasFromSupabase.cjs --service-slug=window-installation --top=50
//   node services/pullKeywordIdeasFromSupabase.cjs --only-loc-slug=kitchener --top=50
//
// Flags:
//   --top              nº total (p/ ordenação final por serviço) [default 50]
//   --per-loc          nº por cidade [default 40]
//   --update-services  atualiza services.keyword (merge+dedupe)
//   --save-ideas       insere por cidade em keyword_ideas (com user_id do service)
//   --service-slug     roda só p/ um serviço (slug)
//   --only-loc-slug    roda só p/ uma localidade (slug)
//   --brand="home service solutions"  (opcional) exclui termos de marca
//
// Requisitos: npm i axios dotenv fs-extra @supabase/supabase-js

require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/* ================= CLI ================= */
function parseArgs(argv) {
  const args = { _: [] };
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) { args._.push(raw); continue; }
    const [k, v] = raw.replace(/^--/, '').split('=');
    args[k] = v === undefined ? true : v;
  }
  return args;
}
const args = parseArgs(process.argv);

const TOP_N_OVERALL = Number(args.top || 50);
const PER_LOC_LIMIT = Number(args['per-loc'] || 40);
const ONLY_SERVICE_SLUG = args['service-slug'] || '';
const ONLY_LOC_SLUG = args['only-loc-slug'] || '';
const DO_UPDATE_SERVICES = !!args['update-services'];
const DO_SAVE_IDEAS = !!args['save-ideas'];
const BRAND = (args.brand || '').toLowerCase().trim();
const DEFAULT_DELAY = Number(args['delay-ms'] || 800);   // ms entre chamadas
const MAX_RETRIES   = Number(args['max-retries'] || 5);  // tentativas em 429/5xx


/* ============== Config fixo ============== */
const LANGUAGE_ID = '1000';   // English
const COUNTRY_CODE = 'CA';    // ajuda a desambiguar Suggest
const LOCALE = 'en';

/* ============== Helpers ================= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function dedupeBy(arr, keyFn) { const s=new Set(), out=[]; for (const x of arr){const k=keyFn(x); if(s.has(k))continue; s.add(k); out.push(x);} return out; }
function toArray(input){ if(!input) return []; if(Array.isArray(input)) return input; return String(input).split(/[,;\n]/).map(s=>s.trim()).filter(Boolean); }
function excludeBrand(text){ if(!BRAND) return false; const t=String(text||'').toLowerCase(); return t.includes(BRAND)||t.includes(BRAND.replace(/\s+/g,'')); }
function normalizeIdeaFromREST(r){
  const m = r.keywordIdeaMetrics || {};
  return {
    text: r.text,
    avgMonthlySearches: m.avgMonthlySearches ?? 0,
    competition: m.competition || null,
    lowTopOfPageBidMicros: m.lowTopOfPageBidMicros ?? null,
    highTopOfPageBidMicros: m.highTopOfPageBidMicros ?? null,
  };
}
async function saveJson(filename, data){
  const outDir = path.join(process.cwd(), 'tmp');
  await fs.ensureDir(outDir);
  const outFile = path.join(outDir, filename);
  await fs.writeJson(outFile, data, { spaces: 2 });
  console.log(`💾 Saved: ${outFile}`);
}

async function postWithRetry(url, payload, headers, {retries=MAX_RETRIES, baseDelay=DEFAULT_DELAY} = {}) {
  let attempt = 0;
  // pequeno jitter para evitar sincronizar com outros clientes
  const jitter = () => Math.floor(Math.random() * 250);

  while (true) {
    try {
      const { data } = await axios.post(url, payload, { headers, timeout: 30000 });
      return data;
    } catch (e) {
      const code = e?.response?.status;
      const retriable = code === 429 || (code >= 500 && code < 600);
      if (!retriable || attempt >= retries) throw e;

      const backoff = baseDelay * Math.pow(2, attempt) + jitter();
      console.warn(`⏳ Retry ${attempt + 1}/${retries} em ${backoff}ms (HTTP ${code})`);
      await sleep(backoff);
      attempt++;
    }
  }
}


/* ============== Google Auth (REST) ============== */
async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString();
  const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return data.access_token;
}

/* ============== Google Ads REST calls ============== */
// sugere GeoTarget ID por nome da cidade
async function suggestGeoTargets(accessToken, cityName, countryCode = COUNTRY_CODE, locale = LOCALE) {
  const url = `https://googleads.googleapis.com/v18/geoTargetConstants:suggest`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  };
  const body = { locale, countryCode, locationNames: { names: [cityName] } };
  const data = await postWithRetry(url, body, headers);
  const results = data.geoTargetConstantSuggestions || [];
  const picks = results.map(s => s.geoTargetConstant).filter(Boolean);
  // pega o primeiro ENABLED; se vier com parent do país, melhor ainda
  const prefer = picks.find(p => p.status === 'ENABLED') || picks[0];
  if (!prefer?.resourceName) return null;
  return prefer.resourceName.split('/').pop(); // "geoTargetConstants/1017323" -> "1017323"
}

// gera ideias por keywords + geo
async function generateKeywordIdeasREST(accessToken, { keywords, geoId, languageId = LANGUAGE_ID }) {
  const url = `https://googleads.googleapis.com/v18/customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}:generateKeywordIdeas`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
    'Content-Type': 'application/json',
  };
  const payload = {
    language: `languageConstants/${languageId}`,
    geoTargetConstants: [`geoTargetConstants/${geoId}`],
    includeAdultKeywords: false,
    keywordSeed: { keywords },
  };
  const data = await postWithRetry(url, payload, headers);

  return (data.results || []).map(normalizeIdeaFromREST);
}

/* ============== Supabase ============== */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase config: SUPABASE_URL and a key (SERVICE_ROLE or ANON) are required.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// services ativos (sem filtrar por user_id; pegamos do próprio service)
async function fetchActiveServices() {
  let q = supabase.from('services').select('*').eq('active', true);
  if (ONLY_SERVICE_SLUG) q = q.eq('slug', ONLY_SERVICE_SLUG);
  const { data, error } = await q;
  if (error) throw new Error('Failed to fetch services: ' + error.message);
  return data || [];
}

// locations ativas do MESMO user do service
async function fetchActiveLocationsByUser(userId) {
  let q = supabase.from('locations').select('*').eq('active', true).eq('user_id', userId);
  if (ONLY_LOC_SLUG) q = q.eq('slug', ONLY_LOC_SLUG);
  const { data, error } = await q;
  if (error) throw new Error('Failed to fetch locations: ' + error.message);
  return data || [];
}

async function updateServiceKeywords(serviceId, mergedKeywords) {
  const { error } = await supabase.from('services').update({ keyword: mergedKeywords }).eq('id', serviceId);
  if (error) throw new Error(`Supabase update failed: ${error.message}`);
}

async function bulkInsertKeywordIdeas(rows) {
  if (!rows.length) return;

  // tenta com text_norm; se falhar, cai para (service_id,location_id,text)
  const tryUpsert = async (conflictCols) => {
    const chunkSize = 500;
    let total = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { data, error, status } = await supabase
        .from('keyword_ideas')
        .upsert(chunk, { onConflict: conflictCols });

      if (error) throw new Error(`Upsert (${conflictCols}) failed [${status}]: ${error.message}`);
      total += chunk.length;
    }
    console.log(`✅ Upserted ~${total} rows into keyword_ideas (conflict: ${conflictCols})`);
  };

  try {
    await tryUpsert('service_id,location_id,text_norm');
  } catch (e) {
    console.warn('⚠️ text_norm conflict failed, falling back to (service_id,location_id,text).', e.message);
    await tryUpsert('service_id,location_id,text');
  }
}


/* ============== Orchestrator ============== */
(async () => {
  try {
    const accessToken = await getAccessToken();

    const services = await fetchActiveServices();
    if (!services.length) {
      console.log('⚠️ Nenhum serviço ativo encontrado (confira services.active = true e/ou --service-slug).');
      return;
    }

    console.log(`▶️ Rodando para ${services.length} serviço(s) [EN/${COUNTRY_CODE}]`);

    const geoCache = new Map(); // "City,Province" -> geoId
    const allOutputs = [];

    for (const svc of services) {
      const locations = await fetchActiveLocationsByUser(svc.user_id);
      if (!locations.length) {
        console.warn(`⏭️  Service "${svc.slug}" sem locations ativas para user ${svc.user_id}. Pulando.`);
        continue;
      }

      // seeds: até 3 keywords do service, senão o nome do serviço
      const seed = toArray(svc.keyword).slice(0, 3);
      const keywordSeed = seed.length ? seed : [svc.name];

      const perServiceIdeas = [];

      for (const loc of locations) {
        const key = `${loc.city}, ${loc.province}`.trim();
        let geoId = geoCache.get(key);
        if (!geoId) {
          try {
            geoId = await suggestGeoTargets(accessToken, loc.city, COUNTRY_CODE, LOCALE);
            if (!geoId) {
              console.warn(`⚠️ GeoTarget não encontrado: ${key}`);
              continue;
            }
            geoCache.set(key, geoId);
            await sleep(200);
          } catch (e) {
            console.warn(`⚠️ Falha ao sugerir geo para ${key}:`, e?.response?.data || e?.message);
            continue;
          }
        }

        try {
          const ideas = await generateKeywordIdeasREST(accessToken, {
            keywords: keywordSeed,
            geoId,
            languageId: LANGUAGE_ID,
          });

          const filtered = ideas.filter(i => i.text && !excludeBrand(i.text));
          const topLoc = filtered
            .sort((a, b) => (b.avgMonthlySearches || 0) - (a.avgMonthlySearches || 0))
            .slice(0, PER_LOC_LIMIT);

          perServiceIdeas.push({ location: loc, geoId, ideas: topLoc });

          if (DO_SAVE_IDEAS) {
            const rows = topLoc.map(k => ({
              user_id: svc.user_id,                // <- dinâmico
              service_id: svc.id,
              location_id: loc.id,
              geo_id: Number(geoId),
              text: k.text,
              avg_monthly_searches: k.avgMonthlySearches ?? 0,
              competition: k.competition || null,
              low_bid: k.lowTopOfPageBidMicros != null ? Math.round(k.lowTopOfPageBidMicros / 1e6) : null,
              high_bid: k.highTopOfPageBidMicros != null ? Math.round(k.highTopOfPageBidMicros / 1e6) : null,
            }));
            await bulkInsertKeywordIdeas(rows);
          }
        } catch (e) {
          console.warn(`⚠️ Falha em ideas para ${svc.slug} @ ${key}:`, e?.response?.data || e?.message);
        }

        await sleep(DEFAULT_DELAY);
      }

      const mergedIdeas = dedupeBy(
        perServiceIdeas.flatMap(x => x.ideas),
        i => i.text.toLowerCase()
      ).sort((a, b) => (b.avgMonthlySearches || 0) - (a.avgMonthlySearches || 0));

      const topOverall = mergedIdeas.slice(0, TOP_N_OVERALL);
      const out = {
        service: { id: svc.id, slug: svc.slug, name: svc.name, user_id: svc.user_id },
        seed: keywordSeed,
        locations: perServiceIdeas.map(pi => ({
          location: { id: pi.location.id, city: pi.location.city, province: pi.location.province, slug: pi.location.slug },
          geoId: pi.geoId,
          ideas: pi.ideas,
        })),
        topOverall,
      };

      allOutputs.push(out);
      await saveJson(`ideas_${svc.slug}.json`, out);

      if (DO_UPDATE_SERVICES) {
        const current = toArray(svc.keyword);
        const incoming = topOverall.map(k => k.text);
        const merged = dedupeBy([...current, ...incoming], s => s.toLowerCase());
        try {
          await updateServiceKeywords(svc.id, merged);
          console.log(`✅ Service "${svc.slug}" atualizado: ${current.length} → ${merged.length} keywords.`);
        } catch (e) {
          console.warn(`❌ Falha ao atualizar "${svc.slug}":`, e.message);
        }
      }
    }

    await saveJson('ideas_summary.json', allOutputs);
    console.log('🎯 Concluído!');
  } catch (err) {
    console.error('❌ Erro geral:', err?.response?.data || err?.message || err);
  }
})();
