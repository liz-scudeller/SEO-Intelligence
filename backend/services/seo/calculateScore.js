const weights = require('./scoreWeights');

function calculateScore({ metaTags, headings, structuredData, links }) {
  let score = 0;
  const checklist = [];

  if (!metaTags.title) checklist.push('Missing <title> tag');
  else {
    score += weights.title;
    const len = metaTags.title.length;
    if (len < 30) checklist.push('<title> too short');
    else if (len > 70) checklist.push('<title> too long');
  }

  if (!metaTags.description) checklist.push('Missing meta description');
  else {
    score += weights.description;
    const len = metaTags.description.length;
    if (len < 120) checklist.push('Meta description too short');
    else if (len > 160) checklist.push('Meta description too long');
  }

  if (metaTags.ogTitle || metaTags.ogDescription || metaTags.ogImage) score += weights.openGraph;
  else checklist.push('Missing Open Graph tags');

  if (metaTags.canonical) score += weights.canonical;
  else checklist.push('Missing canonical link');

  if (structuredData.length > 0) score += weights.structuredData;
  else checklist.push('Missing structured data (JSON-LD)');

  if (headings.h1.length > 0 && headings.h2.length > 0) score += weights.headings;
  else checklist.push('Missing <h1> or <h2>');

  if (headings.h1.length > 1) checklist.push('Multiple <h1> tags');

  const tagWeight = { h1: 1, h2: 2, h3: 3 };
  const headingTags = [...headings.h1.map(() => 'h1'), ...headings.h2.map(() => 'h2'), ...headings.h3.map(() => 'h3')];
  const isOrderValid = headingTags.every((tag, idx, arr) => idx === 0 || tagWeight[tag] >= tagWeight[arr[idx - 1]]);
  if (!isOrderValid) checklist.push('Incorrect heading tag order');

  if (links.internal.length > 0) score += weights.internalLinks;
  else checklist.push('No internal links found');

  if (links.external.length > 0) score += weights.externalLinks;
  else checklist.push('No external links found');

  return { score, checklist };
}

module.exports = calculateScore;