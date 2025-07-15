const mongoose = require('mongoose');
const ClassifiedPage = require('../models/classifiedPage');
const { analyzeSEO } = require('../services/seo/seoAnalyzer');
const { generateAiRecommendations } = require('../services/seo/generateAiRecommendations');
const { calculateAiVisibilityScore } = require('../utils/aiVisibilityScore');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online-leads';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

async function analyzeAllPages() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const pages = await ClassifiedPage.find({
      seoChecklist: { $ne: ['Error: Request failed with status code 429'] },
    });

    for (const page of pages) {
      console.log(`🔍 Analyzing: ${page.url}`);

      try {
        const analysis = await analyzeSEO(page.url);
        const visibility = calculateAiVisibilityScore(analysis);

        const today = new Date();


          page.seoChecklist = analysis.checklist;

// 🧠 Regera somente se:
// 1. Não tem AI ainda
// 2. Tem AI mas os itens são strings quebradas
// 3. Ou você quiser sempre regenerar tudo (forçar)

const needsRegeneration =
  !page.aiRecommendations ||
  !Array.isArray(page.aiRecommendations.items) ||
  page.aiRecommendations.items.some(item => typeof item !== 'object');

let aiRecs = [];

if (needsRegeneration) {
  aiRecs = generateAiRecommendations(page);
  console.log('💡 Regenerating AI recommendations for:', page.url);
} else {
  aiRecs = page.aiRecommendations.items;
}

console.log('💡 AI recs to save:', aiRecs);


        const update = {
          seoScore: analysis.score,
          seoChecklist: analysis.checklist,
          metaTags: analysis.metaTags,
          headings: analysis.headings,
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

        if (!(page.scoreHistory || []).some((entry) => isSameDay(new Date(entry.date), today))) {
          update.$push = {
            scoreHistory: {
              date: today,
              seoScore: analysis.score,
              aiVisibilityScore: visibility.score
            }
          };
        }

        await ClassifiedPage.updateOne({ _id: page._id }, { $set: update, ...(update.$push && { $push: update.$push }) });

        console.log(`✅ Updated: ${page.url}`);
      } catch (innerErr) {
        console.error(`Error on ${page.url}:`, innerErr.message);
      }

      await delay(1000); // 1 segundo entre requisições
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
