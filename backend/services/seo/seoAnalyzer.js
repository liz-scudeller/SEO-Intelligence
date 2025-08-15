import axios from 'axios';
import * as cheerio from 'cheerio';
import { getMetaTags } from './getMetaTags.js';
import { getHeadings } from './getHeadings.js';
import { getStructuredData } from './getStructuredData.js';
import { getLinks } from './getLinks.js';
import { calculateScore } from './calculateScore.js';

export async function analyzeSEO(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (...) Safari/537.36',
      },
    });

    const $ = cheerio.load(html);
    const metaTags = getMetaTags($);
    const headings = getHeadings($);
    const structuredData = getStructuredData($);
    const links = getLinks($);
    const { score, checklist } = calculateScore({ metaTags, headings, structuredData, links });

    return {
      url,
      score,
      checklist,
      metaTags,
      headings,
      structuredData,
      links,
    };
  } catch (err) {
    console.error(`Error analyzing SEO for ${url}:`, err.message);
    const status = err.response?.status;

    return {
      url,
      score: 0,
      checklist: [`Error: ${status === 429 ? 'Too Many Requests (429)' : err.message}`],
      metaTags: {},
      headings: {},
      structuredData: [],
      links: { internal: [], external: [] },
      error: true,
    };
  }
}
