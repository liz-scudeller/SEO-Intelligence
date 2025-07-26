const { OpenAI } = require('openai');
require('dotenv').config();

const { fetchSitemapUrls } = require('../utils/sitemapReader');
const SeoTask = require('../models/seoTask');
const supabase = require('../services/supabaseClient');
const { fetchUserServices } = require('../services/fetchUserServices');
const { fetchUserLocations } = require('../services/fetchUserLocations');

const getUserServices = async (userId) => await fetchUserServices(userId);
const getUserCities = async (userId) => await fetchUserLocations(userId);


const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET,
});




// Sugestões gerais de SEO (create / improve)
async function generateSeoSuggestions(filteredData, filterType = 'all', userId = null) {
  const doneTasks = await SeoTask.find({});
  const donePairs = doneTasks.map(t => `${t.keyword}|${t.action}`);

  const allowedCities = userId ? await getUserCities(userId) : [];
  const allowedServices = userId ? await getUserServices(userId) : [];

    const newData = filteredData.filter(row => {
    const query = row.keys?.join(' ').toLowerCase().trim();
    const impressions = row.impressions || 0;
    const clicks = row.clicks || 0;
    const ctr = row.ctr || 0;
    const position = row.position || 0;

    if (donePairs.includes(`${query}|create`) || donePairs.includes(`${query}|improve`)) return false;

    const containsCity = allowedCities.some(city => query.includes(city));
    const containsService = allowedServices.some(service => query.includes(service));

    const validCombo = containsCity && containsService;

    if (!validCombo) return false;

    if (filterType === 'ranking') return impressions > 50 && ctr < 0.03 && position > 1 && position < 10;
    if (filterType === 'lowCtr') return impressions > 100 && ctr < 0.02;

    return true;
  });


  const topRows = newData.sort((a, b) => b.impressions - a.impressions).slice(0, 5);
  const doneKeywords = doneTasks.map(t => t.keyword);
  const sitemapUrl = 'https://homeservicesolutions.ca/sitemap.xml';
  const existingPages = await fetchSitemapUrls(sitemapUrl);



  const prompt = buildPrompt(topRows, existingPages, doneKeywords);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert SEO strategist helping a home service company improve local SEO.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
  });

  const rawText = completion.choices?.[0]?.message?.content || '';
  const suggestionsArray = parseSuggestions(rawText);

  const enrichedSuggestions = suggestionsArray.map(suggestion => {
    const base = topRows.find(row => suggestion.keyword.toLowerCase().includes(row.keys.join(' ').toLowerCase()));
    return {
      ...suggestion,
      baseData: base
        ? {
            url: base.keys?.length === 2 ? base.keys[0] : '',
            keyword: base.keys?.length === 2 ? base.keys[1] : base.keys?.[0] || '',
            impressions: base.impressions,
            clicks: base.clicks,
            ctr: base.ctr,
            position: base.position,
          }
        : null,
    };
  });

  for (const suggestion of enrichedSuggestions) {
    const { keyword, action, seoTitle, metaDescription, content, baseData, justification } = suggestion;
    const exists = await SeoTask.findOne({ keyword, action });
    if (!exists) {
      await SeoTask.create({
        keyword,
        action,
        seoTitle,
        metaDescription,
        content,
        justification,
        semanticScore: suggestion.semanticScore ?? 0,
        hasCallToAction: suggestion.hasCallToAction ?? false,
        status: 'pending',
        baseUrl: baseData?.url || '',
        baseKeyword: baseData?.keyword || '',
        impressions: baseData?.impressions || 0,
        clicks: baseData?.clicks || 0,
        ctr: baseData?.ctr || 0,
        position: baseData?.position || 0,
      });
    }
  }

  return enrichedSuggestions;
}

function buildPrompt(filteredData, existingPages, doneKeywords) {
  const newData = filteredData.filter(row => {
    const query = row.keys?.join(' ').trim();
    return !doneKeywords.includes(query);
  });

  const rows = newData
    .map(row => {
      const query = row.keys?.join(' ').trim();
      return `${query} | Impressions: ${row.impressions}, Clicks: ${row.clicks}, CTR: ${(row.ctr * 100).toFixed(2)}%, Position: ${(row.position ?? 0).toFixed(2)}`;
    })
    .join('\n');

  return `
Here is a list of existing published URLs:
${existingPages.join('\n')}

Do not suggest creating a page if it already exists or overlaps clearly with any of these URLs.

Now, here is the list of search queries from Google Search Console with impressions, clicks, CTR, and average position:

${rows}

Please:

1. Identify SEO opportunities (queries with high impressions and low clicks or low CTR).
2. Suggest specific actions like "Create a page for [service] in [city]".
Only suggest pages that include BOTH a city and a service.
Cities allowed: [list]
Services allowed: [list]
3. Return a list of suggestions in English, numbered.
4. For each suggestion, provide:
   - Keyword
   - Action (create or improve)
   - SEO Title
   - Meta Description
   - A short SEO-friendly paragraph (content)
   - Justification
   - Semantic Score (0–10)
   - Whether it includes a call to action

Return only a valid JSON array using this format:

[
  {
    "keyword": "...",
    "action": "create" | "improve",
    "seoTitle": "...",
    "metaDescription": "...",
    "content": "...",
    "justification": "...",
    "semanticScore": 0–10,
    "hasCallToAction": true | false
  }
]
`;
}

function parseSuggestions(text) {
  try {
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('❌ Failed to parse suggestions JSON:', err);
    return [];
  }
}

async function regenerateSeoSuggestion(keyword, action) {
  const prompt = `
You're an expert SEO specialist.

Task:
- Keyword: "${keyword}"
- Action: "${action}"

Please generate:
- SEO Title
- Meta Description
- A short SEO-friendly paragraph
- A short justification for why this change is important
- Semantic score (from 0 to 10)
- Whether it includes a clear Call To Action (true or false)

Return in this JSON format:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "content": "...",
  "justification": "...",
  "semanticScore": 0–10,
  "hasCallToAction": true | false
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  return JSON.parse(response.choices?.[0]?.message?.content || '{}');
}

// Blog post ideas
async function generateBlogIdeas(filteredData, userId = null) {
  const existingBlogTasks = await SeoTask.find({ action: 'blog' });
  const usedKeywords = existingBlogTasks.map(t => t.keyword.toLowerCase());

  const allowedCities = userId ? await getUserCities(userId) : [];
  const allowedServices = userId ? await getUserServices(userId) : [];

  console.log('✅ userId recebido:', userId);
  console.log('🌆 allowedCities:', allowedCities);
  console.log('🔧 allowedServices:', allowedServices);

  const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  const searchTerms = filteredData
    .filter(row => {
      const term = row.keys?.join(' ').toLowerCase();
      const normTerm = normalize(term);

      const containsCity = allowedCities.some(city => normTerm.includes(normalize(city)));
      const containsService = allowedServices.some(service => normTerm.includes(normalize(service)));
      const validCombo = containsCity || containsService;

      return (
        row.impressions > 100 &&
        row.clicks === 0 &&
        validCombo &&
        !term.includes('home service solutions') &&
        !usedKeywords.includes(term)
      );
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 2);

  const prompt = `You're an expert SEO strategist for a home service company in Ontario, Canada.

Here are some search queries from Google Search Console with high impressions but poor performance (low CTR or no clicks). These are opportunities for blog posts.

Do NOT suggest content related to the brand name "Home Service Solutions".

Queries:
${searchTerms
  .map(q => `- "${q.keys?.join(' ')}" | Impressions: ${q.impressions} | Clicks: ${q.clicks} | CTR: ${(q.ctr * 100).toFixed(2)}%`)
  .join('\n')}

Please suggest blog post ideas using this JSON format:
[
  {
    "keyword": "...",
    "blogTitle": "...",
    "slug": "seo-friendly-url-based-on-title",
    "metaDescription": "...",
    "keywords": ["...", "..."],
    "justification": "...",
    "semanticScore": 0-10,
    "hasCallToAction": true | false
  }
]`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  const raw = completion.choices?.[0]?.message?.content || '';
  const jsonStart = raw.indexOf('[');
  const jsonEnd = raw.lastIndexOf(']') + 1;
  const jsonString = raw.slice(jsonStart, jsonEnd);

  try {
    const parsed = JSON.parse(jsonString);
    return parsed.map(suggestion => {
      const keyword = suggestion.keyword?.toLowerCase().trim();
      const match = searchTerms.find(row => {
        const rowTerm = row.keys?.join(' ').toLowerCase().trim();
        return (
          rowTerm === keyword ||
          keyword.includes(rowTerm) ||
          rowTerm.includes(keyword)
        );
      });

      if (!match) {
        console.warn(`⚠️ No matching base data for keyword: "${suggestion.keyword}"`);
        console.warn(`🔍 Keywords in searchTerms:`, searchTerms.map(r => r.keys.join(' ')));
      }

      const title = suggestion.blogTitle || suggestion.seoTitle;
      const keywords = suggestion.keywords?.join(', ') || '';

      const contentPrompt = `Create a blog post about '${title}'. Write it in an informative tone. Use transition words. Use active voice. Write over 1000 words. The blog post should be in a beginner’s guide style. Add title and subtitle for each section. It should have a minimum of 6 sections. Include the following keywords: ${keywords}. Do not generate slug, meta description or excerpt. At the end of the blog post, add a short paragraph listing the cities we serve: Ayr, Waterloo, Kitchener, Cambridge, Guelph, Fergus, Elmira, Baden, New Hamburg, Hamilton, and surrounding areas. Finally, generate a prompt for an image that matches the blog topic.`;

      return {
        ...suggestion,
        baseData: match
          ? {
              keyword: match.keys?.join(' '),
              impressions: match.impressions,
              clicks: match.clicks,
              ctr: match.ctr,
              position: match.position,
            }
          : null,
        contentPrompt,
      };
    }).slice(0, 2);
  } catch (err) {
    console.error('Failed to parse blog idea response:', err);
    return [];
  }
}


async function generateBlogContentFromPrompt(prompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return completion.choices?.[0]?.message?.content || '';
}

async function generateContentPrompt({ title, keywords, userId }) {
  const cities = await getUserCities(userId);

  return `Create a blog post about '${title}'. Write it in an informative tone. Use transition words. Use active voice. Write over 1000 words. The blog post should be in a beginner’s guide style. Add title and subtitle for each section. It should have a minimum of 6 sections. Include the following keywords: ${keywords.join(', ')}. The meta description is already defined. At the end, add a final section listing the cities we serve: ${cities.join(', ')}. Also, generate a prompt for an image that fits the blog post.`;
}

async function generateLocalPageFromKeyword(keyword, url) {
  const knownCities = [
    'Kitchener', 'Waterloo', 'Cambridge', 'Guelph', 'Fergus', 'Ayr', 'Elmira', 'Baden', 'New Hamburg', 'Hamilton'
  ];

  const location = knownCities.find(city =>
    keyword.toLowerCase().includes(city.toLowerCase())
  );

  if (!location) return null;

  const serviceSlug = url.split('/').pop(); // ex: 'gutter-guards'
  const slug = `${serviceSlug}-${location.toLowerCase().replace(/\s+/g, '-')}`;
  const serviceName = serviceSlug.replace(/-/g, ' ');

  const seoTitle = `${capitalizeWords(serviceName)} in ${location}`;
  const metaDescription = `Explore expert ${serviceName} services in ${location}. Trusted by homeowners. Get a quote today.`;

  const contentPrompt = `
Generate an SEO-optimized local service page for a home services company.
- Service: ${serviceName}
- Location: ${location}
- Title: ${seoTitle}
- Slug: ${slug}
- Meta Description: ${metaDescription}
- Use keywords like: "${keyword}"
- Structure: Introduction, Benefits, Why Choose Us, FAQs, Call to Action.
- Tone: Trustworthy, professional, local expert.
`;

  return {
    slug,
    keyword,
    seoTitle,
    metaDescription,
    contentPrompt,
    action: 'local-page',
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}


module.exports = {
  generateSeoSuggestions,
  regenerateSeoSuggestion,
  generateBlogIdeas,
  generateBlogContentFromPrompt,
  generateContentPrompt,
  generateLocalPageFromKeyword,
};
