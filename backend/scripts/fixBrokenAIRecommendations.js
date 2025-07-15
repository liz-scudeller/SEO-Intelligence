const mongoose = require('mongoose');
const ClassifiedPage = require('../models/classifiedPage');
const { generateAiRecommendations } = require('../utils/generateAiRecommendations');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online-leads';

async function fixOnlyBrokenRecommendations() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const pages = await ClassifiedPage.find({
      seoChecklist: { $exists: true, $not: { $size: 0 } }
    });

    console.log(`🔍 Checking ${pages.length} pages...`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const page of pages) {
      const items = page.aiRecommendations?.items;

      const needsFix =
        !Array.isArray(items) ||
        items.length === 0 ||
        items.some(it =>
          typeof it !== 'object' ||
          !it.type ||
          typeof it.suggestion !== 'string'
        );

      if (!needsFix) {
        console.log(`⏩ Skipped (valid): ${page.slug}`);
        skippedCount++;
        continue;
      }

      const fixed = generateAiRecommendations(page);

      const isValid = Array.isArray(fixed) &&
        fixed.every(obj =>
          typeof obj === 'object' &&
          obj.type &&
          typeof obj.suggestion === 'string'
        );

      if (!isValid) {
        console.warn(`⚠️ Skipped ${page.url}: AI result still invalid`);
        continue;
      }

      page.aiRecommendations = {
        items: fixed,
        generatedAt: new Date(),
        status: 'done'
      };

      await page.save();
      fixedCount++;
      console.log(`✅ Fixed: ${page.url}`);
    }

    console.log(`🎉 Finalizado! Corrigidos: ${fixedCount}, Pulados: ${skippedCount}`);
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

fixOnlyBrokenRecommendations();
