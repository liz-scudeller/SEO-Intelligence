// const { normalizeHeadings } = require('./normalizeHeadings.cjs');

// export function calculateAiVisibilityScore(page) {
//   if (page.error) {
//     return {
//       score: 0,
//       notes: ['Could not analyze page (error fetching content)'],
//     };
//   }

//   let score = 0;
//   const notes = [];

//   const title = page.metaTags?.title || '';
//   const description = page.metaTags?.description || '';
//   const ogTitle = page.metaTags?.ogTitle || '';
//   const ogDescription = page.metaTags?.ogDescription || '';
//   const canonical = page.metaTags?.canonical || '';
//   const structuredData = page.structuredData || [];
//   const headings = page.headings || [];
//   const content = page.textContent || '';

//   const hasH1 = headings.some(h => h.tag === 'h1');
//   const hasH2 = headings.some(h => h.tag === 'h2');

//   if (hasH1) {
//     score += 10;
//   } else {
//     notes.push('Missing <h1> tag');
//   }

//   if (hasH2) {
//     score += 5;
//   } else {
//     notes.push('Missing <h2> tags for structure');
//   }

//   if (!title) {
//     notes.push('Missing <title>');
//   } else if (title.length < 30) {
//     notes.push('<title> is too short');
//   } else if (title.length > 70) {
//     notes.push('<title> is too long');
//   } else {
//     score += 10;
//   }

//   if (!description) {
//     notes.push('Missing meta description');
//   } else if (description.length < 120) {
//     notes.push('Meta description is too short');
//   } else if (description.length > 160) {
//     notes.push('Meta description is too long');
//   } else {
//     score += 10;
//   }

//   const locationKeywords = ['waterloo', 'guelph', 'kitchener', 'cambridge', 'ontario', 'canada'];
//   const hasLocation = locationKeywords.some(loc => content.toLowerCase().includes(loc));

//   if (hasLocation) {
//     score += 10;
//   } else {
//     notes.push('No local context detected (e.g., city or region)');
//   }

//   if (ogTitle && ogDescription) {
//     score += 5;
//   } else {
//     notes.push('Missing or incomplete Open Graph tags');
//   }

//   if (canonical) {
//     score += 5;
//   } else {
//     notes.push('Missing canonical link');
//   }

//   if (Array.isArray(structuredData) && structuredData.length > 0) {
//     score += 20;
//   } else {
//     notes.push('Missing structured data (JSON-LD)');
//   }

//   const hasFaqSchema = structuredData.some(s => s['@type'] === 'FAQPage');

//   if (hasFaqSchema) {
//     score += 10;
//   } else {
//     notes.push('No FAQ structured data detected');
//   }

//   let readabilityScore = 0;

//   const paragraphCount = content.split('\n').filter(p => p.trim().length > 0).length;
//   if (paragraphCount >= 5) {
//     readabilityScore += 3;
//   } else {
//     notes.push('Very few paragraph breaks – content may look like a wall of text');
//   }

//   const sentences = content.split(/[.?!]/).filter(s => s.trim().length > 0);
//   const shortSentences = sentences.filter(s => s.trim().length < 120);
//   const shortRatio = sentences.length > 0 ? shortSentences.length / sentences.length : 0;

//   if (shortRatio >= 0.6) {
//     readabilityScore += 4;
//   } else {
//     notes.push('Too many long or complex sentences');
//   }

//   if (content.includes('- ') || content.includes('* ') || content.match(/\d+\./)) {
//     readabilityScore += 3;
//   } else {
//     notes.push('No lists or bullet points found – add structure for clarity');
//   }

//   score += readabilityScore;

//   score = Math.min(score, 100);

//   return {
//     score,
//     notes,
//   };
// }

// utils/aiVisibilityScore.cjs
const { normalizeHeadings } = require('./normalizeHeadings.cjs');

function coerceArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function extractHeadingsInfo(headingsInput) {
  // Aceita formatos:
  // - { h1:[], h2:[], ... } (strings)
  // - [{ tag:'h2', text:'...' }, ...]
  // - ['Some heading', ...]  (sem tag – não conta para h1/h2)
  const byTag = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };

  if (!headingsInput) return byTag;

  // Caso já seja objeto mapeado por tag
  if (typeof headingsInput === 'object' && !Array.isArray(headingsInput)) {
    for (const k of Object.keys(byTag)) {
      const v = headingsInput[k];
      if (Array.isArray(v)) {
        byTag[k].push(...v.filter(s => typeof s === 'string'));
      } else if (typeof v === 'string') {
        byTag[k].push(v);
      }
    }
    return byTag;
  }

  // Caso seja array heterogêneo
  if (Array.isArray(headingsInput)) {
    for (const item of headingsInput) {
      if (item && typeof item === 'object') {
        const tag = String(item.tag || '').toLowerCase();
        const text = typeof item.text === 'string' ? item.text : (typeof item === 'string' ? item : null);
        if (byTag[tag] && text) byTag[tag].push(text);
      }
      // strings puras aqui não têm tag -> não contam para h1/h2
    }
  }

  return byTag;
}

function normalizeStructuredData(structuredData) {
  // Garante array e expande @graph
  const list = [];
  const sdArray = coerceArray(structuredData);
  for (const node of sdArray) {
    if (!node || typeof node !== 'object') continue;
    if (Array.isArray(node['@graph'])) {
      for (const g of node['@graph']) {
        if (g && typeof g === 'object') list.push(g);
      }
    } else {
      list.push(node);
    }
  }
  return list;
}

function hasType(node, type) {
  if (!node || typeof node !== 'object') return false;
  const t = node['@type'];
  if (!t) return false;
  if (typeof t === 'string') return t.toLowerCase() === type.toLowerCase();
  if (Array.isArray(t)) return t.map(x => String(x).toLowerCase()).includes(type.toLowerCase());
  return false;
}

function getOg(metaTags = {}) {
  // Aceita campos custom e padrão "og:*"
  const ogTitle = metaTags.ogTitle || metaTags['og:title'] || '';
  const ogDescription = metaTags.ogDescription || metaTags['og:description'] || '';
  return { ogTitle, ogDescription };
}

function calculateAiVisibilityScore(page) {
  if (page?.error) {
    return { score: 0, notes: ['Could not analyze page (error fetching content)'] };
  }

  let score = 0;
  const notes = [];

  const title = page.metaTags?.title || '';
  const description = page.metaTags?.description || '';
  const { ogTitle, ogDescription } = getOg(page.metaTags || {});
  const canonical = page.metaTags?.canonical || '';
  const structuredData = normalizeStructuredData(page.structuredData || []);
  const content = page.textContent || '';

  // Headings robusto: aceita vários formatos
  const byTag = extractHeadingsInfo(page.headings);
  // Opcional: array "chato" de strings para checks futuros
  const headingsFlat = normalizeHeadings ? normalizeHeadings(page.headings) : [];

  const hasH1 = (byTag.h1 || []).length > 0;
  const hasH2 = (byTag.h2 || []).length > 0;

  if (hasH1) score += 10; else notes.push('Missing <h1> tag');
  if (hasH2) score += 5;  else notes.push('Missing <h2> tags for structure');

  if (!title) {
    notes.push('Missing <title>');
  } else if (title.length < 30) {
    notes.push('<title> is too short');
  } else if (title.length > 70) {
    notes.push('<title> is too long');
  } else {
    score += 10;
  }

  if (!description) {
    notes.push('Missing meta description');
  } else if (description.length < 120) {
    notes.push('Meta description is too short');
  } else if (description.length > 160) {
    notes.push('Meta description is too long');
  } else {
    score += 10;
  }

  const locationKeywords = ['waterloo', 'guelph', 'kitchener', 'cambridge', 'ontario', 'canada'];
  const lc = content.toLowerCase();
  const hasLocation = locationKeywords.some(loc => lc.includes(loc));
  if (hasLocation) score += 10; else notes.push('No local context detected (e.g., city or region)');

  if (ogTitle && ogDescription) score += 5; else notes.push('Missing or incomplete Open Graph tags');

  if (canonical) score += 5; else notes.push('Missing canonical link');

  if (structuredData.length > 0) {
    score += 20;
  } else {
    notes.push('Missing structured data (JSON-LD)');
  }

  const hasFaqSchema = structuredData.some(s => hasType(s, 'FAQPage'));
  if (hasFaqSchema) {
    score += 10;
  } else {
    notes.push('No FAQ structured data detected');
  }

  // Readability heuristics
  let readabilityScore = 0;

  const paragraphCount = content
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean).length;

  if (paragraphCount >= 5) {
    readabilityScore += 3;
  } else {
    notes.push('Very few paragraph breaks – content may look like a wall of text');
  }

  const sentences = content
    .split(/[.?!]+/g)
    .map(s => s.trim())
    .filter(Boolean);

  const shortSentences = sentences.filter(s => s.length < 120);
  const shortRatio = sentences.length > 0 ? shortSentences.length / sentences.length : 0;

  if (shortRatio >= 0.6) {
    readabilityScore += 4;
  } else {
    notes.push('Too many long or complex sentences');
  }

  if (/- |\* |\d+\.\s/.test(content)) {
    readabilityScore += 3;
  } else {
    notes.push('No lists or bullet points found – add structure for clarity');
  }

  score += readabilityScore;

  // Limites finais
  score = Math.max(0, Math.min(score, 100));

  return { score, notes, headingsChecked: { h1: byTag.h1.length, h2: byTag.h2.length } };
}

module.exports = { calculateAiVisibilityScore };
