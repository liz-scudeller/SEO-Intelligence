// export function generateAiRecommendations(page) {
//   const checklist = page.seoChecklist || [];

//   const map = [
//     // TITLE
//     { match: 'Missing <title>', suggestion: 'Add a <title> tag with 50–60 characters.', type: 'title', impact: 'high' },
//     { match: '<title> too short', suggestion: 'Extend the <title> tag to at least 50 characters.', type: 'title', impact: 'low' },
//     { match: '<title> too long', suggestion: 'Shorten the <title> to 60 characters or less.', type: 'title', impact: 'medium' },

//     // META DESCRIPTION
//     { match: 'Missing meta description', suggestion: 'Add a meta description to summarize the page.', type: 'meta', impact: 'high' },
//     { match: 'Meta description too short', suggestion: 'Write a meta description with 120–160 characters.', type: 'meta', impact: 'medium' },
//     { match: 'Meta description too long', suggestion: 'Shorten the meta description to 160 characters or less.', type: 'meta', impact: 'medium' },

//     // HEADINGS
//     { match: 'Missing <h1> or <h2>', suggestion: 'Include at least one <h1> or <h2> to define page hierarchy.', type: 'headings', impact: 'high' },
//     { match: 'Multiple <h1> tags', suggestion: 'Use only one <h1> tag per page.', type: 'headings', impact: 'high' },
//     { match: 'Incorrect heading tag order', suggestion: 'Ensure heading tags follow a logical hierarchy (H1 > H2 > H3).', type: 'headings', impact: 'medium' },

//     // STRUCTURED DATA
//     { match: 'Missing structured data', suggestion: 'Include JSON-LD structured data to improve search engine understanding.', type: 'structured-data', impact: 'medium' },

//     // OPEN GRAPH
//     { match: 'Missing Open Graph', suggestion: 'Include Open Graph meta tags for better social sharing.', type: 'og', impact: 'medium' },

//     // CANONICAL
//     { match: 'Missing canonical', suggestion: 'Add a <link rel="canonical"> to specify the preferred URL.', type: 'canonical', impact: 'medium' },

//     // IMAGES
//     { match: '<img> tags without alt', suggestion: 'Add descriptive alt attributes to all images.', type: 'images', impact: 'low' },

//     // LINKS
//     { match: 'No internal links', suggestion: 'Add links to other pages within your site.', type: 'internal-links', impact: 'medium' },
//     { match: 'No external links', suggestion: 'Add links to reputable external sources.', type: 'external-links', impact: 'low' },

//     // INDEXABILITY
//     { match: 'Page is blocked by robots.txt', suggestion: 'Remove the block in robots.txt to allow search engine crawling.', type: 'indexability', impact: 'high' },
//     { match: 'Page has noindex tag', suggestion: 'Remove the noindex directive if you want this page to be indexed.', type: 'indexability', impact: 'high' },

//     // MOBILE
//     { match: 'Mobile viewport not set', suggestion: 'Add a responsive viewport meta tag for better mobile experience.', type: 'mobile', impact: 'medium' },

//     // CONTENT
//     { match: 'Low word count', suggestion: 'Add more relevant content to provide value and improve SEO.', type: 'content', impact: 'medium' },
//     { match: 'Duplicate content detected', suggestion: 'Rewrite or consolidate duplicated content to improve uniqueness.', type: 'content', impact: 'high' },
//     { match: 'No main content detected', suggestion: 'Include relevant textual content in the main area of the page.', type: 'content', impact: 'high' }
//   ];

//   const recs = [];

//   checklist.forEach(item => {
//     map.forEach(rule => {
//       if (item.includes(rule.match)) {
//         recs.push({
//           type: rule.type,
//           suggestion: rule.suggestion,
//           impact: rule.impact
//         });
//       }
//     });
//   });

//   if (recs.length === 0) {
//     recs.push({
//       type: 'info',
//       suggestion: 'No issues found. Great job!',
//       impact: 'low'
//     });
//   }

//   return recs;
// }


// utils/generateAiRecommendations.js  (ESM)
function normalizeChecklistItems(checklist) {
  if (!checklist) return [];
  const out = [];
  const arr = Array.isArray(checklist) ? checklist : [checklist];
  for (const it of arr) {
    if (typeof it === 'string') out.push(it);
    else if (it && typeof it === 'object') {
      const msg = it.message || it.text || it.note || it.reason || null;
      if (typeof msg === 'string') out.push(msg);
    }
  }
  return out;
}

const RULES = [
  { test: /Missing\s*<title>/i, suggestion: 'Add a <title> tag with 50–60 characters.', type: 'title', impact: 'high' },
  { test: /<title>\s*(is\s*)?too\s*short/i, suggestion: 'Extend the <title> to ~50–60 characters with the main keyword near the start.', type: 'title', impact: 'low' },
  { test: /<title>\s*(is\s*)?too\s*long/i, suggestion: 'Shorten the <title> to ≤60 characters and keep it readable.', type: 'title', impact: 'medium' },
  { test: /Missing meta description/i, suggestion: 'Add a meta description (~120–160 chars) summarizing the page and ending with a soft CTA.', type: 'meta', impact: 'high' },
  { test: /Meta description (is )?too short/i, suggestion: 'Expand the meta description to ~120–160 characters with value + CTA.', type: 'meta', impact: 'medium' },
  { test: /Meta description (is )?too long/i, suggestion: 'Trim the meta description to ≤160 characters to avoid truncation.', type: 'meta', impact: 'medium' },
  { test: /Missing\s*<h1>\s*tag/i, suggestion: 'Add exactly one <h1> summarizing the page topic.', type: 'headings', impact: 'high' },
  { test: /Missing\s*<h2>.*structure/i, suggestion: 'Add descriptive <h2> subheadings to organize sections.', type: 'headings', impact: 'medium' },
  { test: /Multiple\s*<h1>\s*tags/i, suggestion: 'Use only one <h1>; convert extras to <h2>/<h3>.', type: 'headings', impact: 'high' },
  { test: /Incorrect heading tag order/i, suggestion: 'Fix heading hierarchy (H1 → H2 → H3) without skipping levels.', type: 'headings', impact: 'medium' },
  { test: /Missing structured data/i, suggestion: 'Add JSON-LD (e.g., LocalBusiness/Service/FAQPage) matching on-page content.', type: 'structured-data', impact: 'medium' },
  { test: /Missing structured data \(JSON-LD\)/i, suggestion: 'Add JSON-LD (LocalBusiness/Service/FAQPage) aligned with content.', type: 'structured-data', impact: 'medium' },
  { test: /No FAQ structured data detected/i, suggestion: 'Add FAQPage JSON-LD for common customer questions.', type: 'structured-data', impact: 'low' },
  { test: /Missing or incomplete Open Graph tags/i, suggestion: 'Add og:title and og:description (and og:image) for better sharing.', type: 'og', impact: 'medium' },
  { test: /Missing Open Graph/i, suggestion: 'Add Open Graph meta tags (og:title, og:description, og:image).', type: 'og', impact: 'medium' },
  { test: /Missing canonical link/i, suggestion: 'Add <link rel="canonical"> to indicate the preferred URL.', type: 'canonical', impact: 'medium' },
  { test: /Missing canonical/i, suggestion: 'Add a canonical tag to prevent duplicate signals.', type: 'canonical', impact: 'medium' },
  { test: /<img>\s*tags?\s*without\s*alt/i, suggestion: 'Add descriptive alt text to all important images.', type: 'images', impact: 'low' },
  { test: /No internal links/i, suggestion: 'Add contextual internal links to relevant pages (services, locations, blog).', type: 'internal-links', impact: 'medium' },
  { test: /No external links/i, suggestion: 'Cite reputable external sources where appropriate.', type: 'external-links', impact: 'low' },
  { test: /blocked by robots\.txt/i, suggestion: 'Unblock the page in robots.txt (or move content to an indexable URL).', type: 'indexability', impact: 'high' },
  { test: /noindex/i, suggestion: 'Remove the noindex directive if the page should rank.', type: 'indexability', impact: 'high' },
  { test: /Mobile viewport not set/i, suggestion: 'Add a responsive viewport meta tag.', type: 'mobile', impact: 'medium' },
  { test: /Low word count/i, suggestion: 'Expand content with useful detail answering user intent.', type: 'content', impact: 'medium' },
  { test: /Duplicate content detected/i, suggestion: 'Rewrite or consolidate duplicate sections to be unique.', type: 'content', impact: 'high' },
  { test: /No main content detected/i, suggestion: 'Add substantial on-page copy describing the service and benefits.', type: 'content', impact: 'high' },
  { test: /No local context detected/i, suggestion: 'Add local signals (city/region copy) and consider LocalBusiness schema.', type: 'local', impact: 'medium' },
  { test: /Very few paragraph breaks/i, suggestion: 'Add paragraph breaks and subheads to avoid walls of text.', type: 'readability', impact: 'low' },
  { test: /Too many long or complex sentences/i, suggestion: 'Shorten/simplify sentences; aim for a mix of lengths.', type: 'readability', impact: 'low' },
  { test: /No lists or bullet points found/i, suggestion: 'Use bullet/numbered lists to present steps or benefits.', type: 'readability', impact: 'low' },
];

const PRIORITY = { high: 3, medium: 2, low: 1 };

export function generateAiRecommendations(page) {
  const checklist = normalizeChecklistItems(page?.seoChecklist);
  const recs = [];

  for (const item of checklist) {
    for (const rule of RULES) {
      if (rule.test.test(item)) {
        recs.push({
          type: rule.type,
          suggestion: rule.suggestion,
          impact: rule.impact,
          evidence: item,
        });
      }
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const r of recs) {
    const key = `${r.type}::${r.suggestion}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  deduped.sort((a, b) => (PRIORITY[b.impact] || 0) - (PRIORITY[a.impact] || 0));

  if (deduped.length === 0) {
    deduped.push({ type: 'info', suggestion: 'No issues found. Great job!', impact: 'low' });
  }
  return deduped;
}
