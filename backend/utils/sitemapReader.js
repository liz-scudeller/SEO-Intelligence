import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export async function fetchSitemapUrls(sitemapUrl) {
  try {
    const { data } = await axios.get(sitemapUrl);
    const parsed = await parseStringPromise(data);
    const urls = parsed.urlset.url.map(entry => entry.loc[0]);
    return urls;
  } catch (error) {
    console.error('Error reading sitemap:', error.message);
    return [];
  }
}
