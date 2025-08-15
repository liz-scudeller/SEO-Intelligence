// services/seo/syncFromSitemaps.cjs
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const mongoose = require('mongoose');
let ClassifiedPage;
try {
  // garanta o caminho .cjs
  ClassifiedPage = require('../../models/classifiedPage.cjs');
} catch (_) {
  ClassifiedPage = null;
}

const parser = new XMLParser({ ignoreAttributes: false });

function normalize(raw) {
  try {
    const u = new URL(raw.trim());
    u.protocol = 'https:';
    u.hostname = u.hostname.replace(/^www\./, '');
    const drop = (k) => k.startsWith('utm_') || ['fbclid','gclid','mc_cid','mc_eid'].includes(k);
    for (const k of Array.from(u.searchParams.keys())) if (drop(k)) u.searchParams.delete(k);
    if (!u.pathname.endsWith('/')) u.pathname += '/';
    return u.toString();
  } catch {
    return raw.trim();
  }
}

function isGood(url) {
  return !/(\/feed\/?$|\/author\/|\/search\/|\/attachment\/|\/page\/\d+\/?$)/i.test(url);
}

async function fetchXml(url) {
  const { data } = await axios.get(url, {
    timeout: 20000,
    maxRedirects: 5,
    headers: { 'User-Agent': 'HSS-SEO-Bot/1.0 (+https://homeservicesolutions.ca)' },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return parser.parse(data);
}

async function fetchSitemapUrls(sitemapUrl, seen = new Set()) {
  const out = [];
  const q = [sitemapUrl];
  while (q.length) {
    const current = q.shift();
    if (seen.has(current)) continue;
    seen.add(current);

    let xml;
    try { xml = await fetchXml(current); }
    catch { continue; }

    if (xml?.sitemapindex?.sitemap) {
      const list = Array.isArray(xml.sitemapindex.sitemap) ? xml.sitemapindex.sitemap : [xml.sitemapindex.sitemap];
      for (const it of list) {
        const loc = typeof it?.loc === 'string' ? it.loc.trim() : null;
        if (loc) q.push(loc);
      }
      continue;
    }

    if (xml?.urlset?.url) {
      const list = Array.isArray(xml.urlset.url) ? xml.urlset.url : [xml.urlset.url];
      for (const u of list) {
        const loc = typeof u?.loc === 'string' ? u.loc.trim() : null;
        if (loc) out.push(loc);
      }
      continue;
    }
  }
  return out;
}

async function syncFromSitemaps(sitemapRoots = []) {
  if (!Array.isArray(sitemapRoots) || sitemapRoots.length === 0) {
    return { totalUrls: 0, considered: 0, inserted: 0, matched: 0, skipped: 0 };
  }

  const all = new Set();
  for (const root of sitemapRoots) {
    try {
      const urls = await fetchSitemapUrls(root);
      urls.forEach((u) => all.add(u));
    } catch { /* ignore */ }
  }

  const normalized = [];
  let skipped = 0;
  for (const raw of all) {
    const n = normalize(raw);
    if (isGood(n)) normalized.push(n);
    else skipped++;
  }

  if (!normalized.length) {
    return { totalUrls: all.size, considered: 0, inserted: 0, matched: 0, skipped };
  }

  const ops = normalized.map((url) => ({
    updateOne: {
      filter: { url },
      update: {
        $setOnInsert: { url, createdAt: new Date() },
        $set: { lastSeenInSitemapAt: new Date() },
      },
      upsert: true,
    },
  }));

  // ✅ Tenta via Model.bulkWrite; se não existir, usa a collection nativa
  let res;
  if (ClassifiedPage && typeof ClassifiedPage.bulkWrite === 'function') {
    res = await ClassifiedPage.bulkWrite(ops, { ordered: false });
  } else {
    const coll = mongoose.connection.collection('classifiedpages'); // mesmo nome do schema
    res = await coll.bulkWrite(ops, { ordered: false });
  }

  const inserted = res.upsertedCount || 0;
  const matched = res.matchedCount || 0;

  return {
    totalUrls: all.size,
    considered: normalized.length,
    inserted,
    matched,
    skipped,
  };
}

module.exports = { syncFromSitemaps, fetchSitemapUrls };
