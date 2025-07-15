const axios = require('axios');
const xml2js = require('xml2js');
const { classifyUrl } = require('./classifyUrl');
const ClassifiedPage = require('../models/classifiedPage');

async function fetchAndClassifyUrls(sitemapUrl) {
  try {
    const res = await axios.get(sitemapUrl);
    const parsed = await xml2js.parseStringPromise(res.data);
    const urls = parsed.urlset.url.map((entry) => entry.loc[0]);

    const classified = urls.map(classifyUrl);

    // Salvar no MongoDB se ainda não existir
    for (const entry of classified) {
      const exists = await ClassifiedPage.findOne({ url: entry.url });
      if (!exists) {
        await ClassifiedPage.create(entry);
      }
    }

    return classified;
  } catch (error) {
    console.error('Error reading or saving sitemap:', error.message);
    return [];
  }
}

module.exports = { fetchAndClassifyUrls };
