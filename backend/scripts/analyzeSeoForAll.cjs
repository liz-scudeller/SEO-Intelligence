const mongoose = require('mongoose');

// 🔧 helper para tentar ambos CJS/JS
function safeRequire(path) {
  try { return require(path); } catch { return null; }
}

// 🔧 carrega serviços (tenta .cjs, depois .js)
let ClassifiedPage = safeRequire('../models/classifiedPage.cjs') || safeRequire('../models/classifiedPage.cjs');
let syncPkg = safeRequire('../services/seo/syncFromSitemaps.cjs') || safeRequire('../services/seo/syncFromSitemaps.js');
let analyzePkg = safeRequire('../services/seo/seoAnalyzer.cjs') || safeRequire('../services/seo/seoAnalyzer.js');
let recsPkg = safeRequire('../services/seo/generateAiRecommendations.cjs') || safeRequire('../services/seo/generateAiRecommendations.js');
let visPkg  = safeRequire('../utils/aiVisibilityScore.cjs') || safeRequire('../utils/aiVisibilityScore.js');

const { syncFromSitemaps } = syncPkg || {};
const { analyzeSEO } = analyzePkg || {};
const { generateAiRecommendations } = recsPkg || {};
const { calculateAiVisibilityScore } = visPkg || {};

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online-leads';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

// ⬇️ adicione este helper perto do topo do arquivo
function flattenHeadings(h) {
  if (!h) return [];
  if (Array.isArray(h)) return h.filter(x => typeof x === 'string');
  if (typeof h === 'object') {
    const out = [];
    for (const k of ['h1','h2','h3','h4','h5','h6']) {
      const v = h[k];
      if (Array.isArray(v)) out.push(...v.filter(x => typeof x === 'string'));
      else if (typeof v === 'string') out.push(v);
    }
    return out;
  }
  if (typeof h === 'string') return [h];
  return [];
}


async function getAllPagesToAnalyze() {
  const query = { seoChecklist: { $ne: ['Error: Request failed with status code 429'] } };

  // Se o Model veio ok (tem .find), use-o; senão caia para a collection nativa
  if (ClassifiedPage && typeof ClassifiedPage.find === 'function') {
    return await ClassifiedPage.find(query).lean();
  } else {
    const coll = mongoose.connection.collection('classifiedpages');
    return await coll.find(query).toArray();
  }
}

async function updatePageById(id, update) {
  const $set = update.$set || update;
  const $push = update.$push;

  if (ClassifiedPage && typeof ClassifiedPage.updateOne === 'function') {
    return ClassifiedPage.updateOne(
      { _id: id },
      { $set, ...(!!$push && { $push }) }
    );
  } else {
    const coll = mongoose.connection.collection('classifiedpages');
    return coll.updateOne(
      { _id: id },
      { $set, ...(!!$push && { $push }) }
    );
  }
}

async function analyzeAllPages() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (!syncFromSitemaps) throw new Error('syncFromSitemaps não carregado (checar import .cjs/.js).');

    // 1) Sync via sitemap INDEX
    const report = await syncFromSitemaps([
      'https://homeservicesolutions.ca/sitemap_index.xml',
    ]);
    console.log(`🧭 Sitemap sync: ${report.inserted} novos, ${report.matched} atualizados, total mapeado: ${report.considered}`);

    // 2) Buscar todas as páginas a analisar
    const pages = await getAllPagesToAnalyze();

    if (!analyzeSEO || !calculateAiVisibilityScore) {
      throw new Error('Serviços analyzeSEO / calculateAiVisibilityScore não carregados (ajuste .cjs/.js).');
    }

    for (const page of pages) {
      console.log(`🔍 Analyzing: ${page.url}`);
      try {
// ...
const analysis = await analyzeSEO(page.url);

// ⬇️ normaliza headings para array
const headingsFlat = flattenHeadings(analysis.headings);

// passe SEMPRE headings como array para quem usa .some(...)
const visibility = calculateAiVisibilityScore({
  ...analysis,
  headings: headingsFlat,
});

// se você gera recomendações usando o 'page' antigo, passe também os dados mais recentes
const needsRegeneration =
  !page.aiRecommendations ||
  !Array.isArray(page.aiRecommendations.items) ||
  page.aiRecommendations.items.some(item => typeof item !== 'object');

const aiRecs = needsRegeneration
  ? generateAiRecommendations({
      ...page,            // mantém o que você já tinha
      ...analysis,        // usa dados atuais da análise
      headings: headingsFlat, // garante array
    })
  : page.aiRecommendations.items;

// depois segue igual...
const today = new Date();
const update = {
  seoScore: analysis.score,
  seoChecklist: analysis.checklist,
  metaTags: analysis.metaTags,
  headings: analysis.headings,          // pode manter o objeto original no banco
  structuredData: analysis.structuredData,
  links: analysis.links,
  aiVisibilityScore: visibility.score,
  aiVisibilityNotes: visibility.notes,
  resolved: false,
  aiRecommendations: {
    items: aiRecs,
    generatedAt: new Date(),
    status: 'done'
  }
};


        if (!Array.isArray(page.scoreHistory) ||
            !page.scoreHistory.some(e => isSameDay(new Date(e.date), today))) {
          update.$push = {
            scoreHistory: {
              date: today,
              seoScore: analysis.score,
              aiVisibilityScore: visibility.score
            }
          };
        }

        await updatePageById(page._id, { $set: update, ...(update.$push && { $push: update.$push }) });

        console.log(`✅ Updated: ${page.url}`);
      } catch (innerErr) {
        console.error(`Error on ${page.url}:`, innerErr.message);
      }

      await delay(1000);
    }

    console.log('✅ Finished analyzing all pages.');
  } catch (err) {
    console.error('❌ Error connecting or analyzing:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

analyzeAllPages();
