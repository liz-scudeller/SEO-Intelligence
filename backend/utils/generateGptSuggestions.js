const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET,
});

const knownCities = ['ayr', 'baden', 'waterloo', 'kitchener', 'cambridge', 'guelph', 'fergus', 'elmira', 'new-hamburg', 'hamilton'];

function buildPrompt(page) {
  const cleanHeadings = Object.values(page.headings || {})
    .flat()
    .map(h => h.replace(/\s+/g, ' ').trim())
    .join('; ');

  const type = page.type || 'service';
  const location = page.url?.split('/').filter(p => p).slice(-1)[0] || '';
  const isLocal = knownCities.includes(location);
  const hasEstimateBtn = /\/service-areas\//.test(page.url);

  return `
You're an expert SEO assistant.

Page type: ${type}
Target audience: homeowners
Intent: ${type === 'blog' ? 'informational' : 'transactional'}
Local intent: ${isLocal ? 'yes' : 'no'}
Call-to-action present on page: ${hasEstimateBtn ? 'yes (button: "Get Estimate")' : 'unknown'}

Page URL: ${page.url}
Current Title: ${page.metaTags?.title || 'N/A'}
Headings: ${cleanHeadings || 'None'}

Please suggest SEO metadata in this exact JSON format:

{
  "title": "...",
  "description": "...",
  "keywords": ["...", "..."],
  "justification": "...",
  "hasCallToAction": true,
  "semanticScore": "0 to 10"
}
`;
}

async function generateTitleAndMetaWithGPT(page) {
  const prompt = buildPrompt(page);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content || '';
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonString = raw.slice(jsonStart, jsonEnd + 1);

    const parsed = JSON.parse(jsonString);

    return {
      title: parsed.title || '',
      description: parsed.description || '',
      keywords: parsed.keywords || [],
      justification: parsed.justification || '',
      hasCallToAction: parsed.hasCallToAction === true,
      semanticScore: Math.min(10, Math.max(0,
        typeof parsed.semanticScore === 'number'
          ? parsed.semanticScore
          : parseFloat(parsed.semanticScore) || 0
      )),
    };

  } catch (err) {
    console.error('⚠️ Failed to parse GPT metadata response:', err.message);
    return {
      title: '',
      description: '',
      keywords: [],
      justification: '',
      hasCallToAction: false,
      semanticScore: 0,
    };
  }
}

module.exports = { generateTitleAndMetaWithGPT };
