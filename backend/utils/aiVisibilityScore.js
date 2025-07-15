function calculateAiVisibilityScore(page) {
  if (page.error) {
    return {
      score: 0,
      notes: ['Could not analyze page (error fetching content)'],
    };
  }

  let score = 0;
  const notes = [];

  const title = page.metaTags?.title || '';
  const description = page.metaTags?.description || '';
  const ogTitle = page.metaTags?.ogTitle || '';
  const ogDescription = page.metaTags?.ogDescription || '';
  const canonical = page.metaTags?.canonical || '';
  const structuredData = page.structuredData || [];
  const headings = page.headings || [];
  const content = page.textContent || '';

  // Headings
  const hasH1 = headings.some(h => h.tag === 'h1');
  const hasH2 = headings.some(h => h.tag === 'h2');

  if (hasH1) {
    score += 10;
  } else {
    notes.push('Missing <h1> tag');
  }

  if (hasH2) {
    score += 5;
  } else {
    notes.push('Missing <h2> tags for structure');
  }

  // Title
  if (!title) {
    notes.push('Missing <title>');
  } else if (title.length < 30) {
    notes.push('<title> is too short');
  } else if (title.length > 70) {
    notes.push('<title> is too long');
  } else {
    score += 10;
  }

  // Meta description
  if (!description) {
    notes.push('Missing meta description');
  } else if (description.length < 120) {
    notes.push('Meta description is too short');
  } else if (description.length > 160) {
    notes.push('Meta description is too long');
  } else {
    score += 10;
  }

  // Context (Local SEO)
  const locationKeywords = ['waterloo', 'guelph', 'kitchener', 'cambridge', 'ontario', 'canada'];
  const hasLocation = locationKeywords.some(loc => content.toLowerCase().includes(loc));

  if (hasLocation) {
    score += 10;
  } else {
    notes.push('No local context detected (e.g., city or region)');
  }

  // Open Graph
  if (ogTitle && ogDescription) {
    score += 5;
  } else {
    notes.push('Missing or incomplete Open Graph tags');
  }

  // Canonical
  if (canonical) {
    score += 5;
  } else {
    notes.push('Missing canonical link');
  }

  // Structured data
  if (Array.isArray(structuredData) && structuredData.length > 0) {
    score += 20;
  } else {
    notes.push('Missing structured data (JSON-LD)');
  }

  // FAQ Schema
  const hasFaqSchema = structuredData.some(s => s['@type'] === 'FAQPage');

  if (hasFaqSchema) {
    score += 10;
  } else {
    notes.push('No FAQ structured data detected');
  }

  // Legibilidade / estrutura visual
  let readabilityScore = 0;

  // Parágrafos curtos
  const paragraphCount = content.split('\n').filter(p => p.trim().length > 0).length;
  if (paragraphCount >= 5) {
    readabilityScore += 3;
  } else {
    notes.push('Very few paragraph breaks – content may look like a wall of text');
  }

  // Frases curtas
  const sentences = content.split(/[.?!]/).filter(s => s.trim().length > 0);
  const shortSentences = sentences.filter(s => s.trim().length < 120);
  const shortRatio = sentences.length > 0 ? shortSentences.length / sentences.length : 0;

  if (shortRatio >= 0.6) {
    readabilityScore += 4;
  } else {
    notes.push('Too many long or complex sentences');
  }

  // Listas
  if (content.includes('- ') || content.includes('* ') || content.match(/\d+\./)) {
    readabilityScore += 3;
  } else {
    notes.push('No lists or bullet points found – add structure for clarity');
  }

  score += readabilityScore;

  // Normaliza o score para no máximo 100
  const maxScore = 100;
  score = Math.min(score, maxScore);

  return {
    score,
    notes,
  };
}

module.exports = { calculateAiVisibilityScore };
