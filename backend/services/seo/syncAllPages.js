// services/seo/syncAllPages.js
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const ClassifiedPage = require('../../models/classifiedPage.cjs');

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchSitemapUrls(sitemapUrl, seen = new Set()) {
  if (seen.has(sitemapUrl)) return [];
  seen.add(sitemapUrl);

  const { data } = await axios.get(sitemapUrl, { timeout: 20000 });
  const xml = parser.parse(data);

  if (xml.sitemapindex?.sitemap) {
    const list = Array.isArray(xml.sitemapindex.sitemap) ? xml.sitemapindex.sitemap : [xml.sitemapindex.sitemap];
    const all = [];
    for (const it of list) {
      const loc = it.loc;
      if (loc) all.push(...(await fetchSitemapUrls(loc, seen)));
    }
    return all;
  }

  if (xml.urlset?.url) {
    const list = Array.isArray(xml.urlset.url) ? xml.urlset.url : [xml.urlset.url];
    return list.map(u => (typeof u.loc === 'string' ? u.loc.trim() : null)).filter(Boolean);
  }

  return [];
}

async function fetchWordPressPages(baseUrl) {
  // Paginação WP REST
  const urls = [];
  let page = 1;
  while (true) {
    const { data, headers } = await axios.get(`${baseUrl}/wp-json/wp/v2/pages`, {
      params: { per_page: 100, page, status: 'publish' },
      timeout: 20000,
    });
    for (const p of data) {
      if (p?.link) urls.push(p.link);
    }
    const totalPages = Number(headers['x-wp-totalpages'] || 1);
    if (page >= totalPages) break;
    page++;
  }
  return urls;
}

async function syncAllPages({ sitemapRoots = [], wpBaseUrl = null }) {
  const set = new Set();

  // Sitemap
  for (const root of sitemapRoots) {
    const urls = await fetchSitemapUrls(root);
    urls.forEach(u => set.add(u));
  }

  // WordPress
  if (wpBaseUrl) {
    const wpUrls = await fetchWordPressPages(wpBaseUrl);
    wpUrls.forEach(u => set.add(u));
  }



  const ops = [];
  for (const url of set) {
    ops.push({
      updateOne: {
        filter: { url },
        update: {
          $setOnInsert: { url, createdAt: new Date() },
          $set: { lastSeenAt: new Date() },
        },
        upsert: true,
      }
    });
  }

  // aqui provavelmente você quer executar algo como:
  if (ops.length > 0) {
    await ClassifiedPage.bulkWrite(ops);
  }

  return ops.length;
}