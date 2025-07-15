const mongoose = require('mongoose');
const { fetchSitemapUrls } = require('../utils/sitemapReader');
const { classifyUrl } = require('../utils/classifyUrl');
const ClassifiedPage = require('../models/classifiedPage');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online-leads';

async function syncPages() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 🧹 Limpa a coleção
    await ClassifiedPage.deleteMany({});
    console.log('🧹 Cleared classifiedPages collection');

    // 📥 Busca e classifica as URLs do sitemap
    const sitemapUrl = 'https://homeservicesolutions.ca/sitemap.xml';
    const classified = await fetchSitemapUrls(sitemapUrl);

    // 🔄 Remove duplicadas
    const uniqueUrls = new Set();
    const filtered = classified.filter((item) => {
      if (!item.url || !item.slug) return false;
      if (uniqueUrls.has(item.url)) return false;
      uniqueUrls.add(item.url);
      return true;
    });

    // 🧠 Insere ou atualiza
    for (const item of filtered) {
      await ClassifiedPage.updateOne(
        { url: item.url },
        { $set: item },
        { upsert: true }
      );
    }

    console.log(`✅ Upserted ${filtered.length} classified URLs into MongoDB`);

    // ✅ Reclassifica os que ficaram como unknown
    const unknownPages = await ClassifiedPage.find({ type: 'unknown' });

    for (const page of unknownPages) {
      const updated = classifyUrl(page.url);
      await ClassifiedPage.updateOne({ _id: page._id }, { $set: updated });
    }

    console.log(`🔄 Reclassified ${unknownPages.length} unknown pages`);
  } catch (err) {
    console.error('❌ Error syncing classified pages:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

syncPages();
