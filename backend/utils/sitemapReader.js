const axios = require('axios');
const xml2js = require('xml2js');

async function fetchSitemapUrls(sitemapUrl) {
  try {
    const { data } = await axios.get(sitemapUrl);
    const parsed = await xml2js.parseStringPromise(data);
    const urls = parsed.urlset.url.map(entry => entry.loc[0]);
    return urls;
  } catch (error) {
    console.error('Error reading sitemap:', error.message);
    return [];
  }
}

module.exports = { fetchSitemapUrls };

