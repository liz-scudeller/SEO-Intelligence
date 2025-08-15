import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { classifyUrl } from './classifyUrl.js';
import ClassifiedPage from '../models/classifiedPage.cjs';

export async function fetchAndClassifyUrls(sitemapUrl) {
  try {
    const res = await axios.get(sitemapUrl);
    const parsed = await parseStringPromise(res.data);
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
