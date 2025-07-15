const mongoose = require('mongoose');
require('dotenv').config();
const ClassifiedPage = require('../models/classifiedPage'); // ajuste o caminho se necessário


async function fixUnknownBlogPosts() {
  await mongoose.connect(process.env.MONGODB_URI);

  const pattern = /^\d{4}\/\d{2}\/\d{2}\//;

  const unknowns = await ClassifiedPage.find({ type: 'unknown' });

  let updated = 0;

  for (const page of unknowns) {
    if (pattern.test(page.slug)) {
      page.type = 'blog';
      await page.save();
      updated++;
    }
  }

  console.log(`✅ Updated ${updated} pages to type 'blog'.`);
  mongoose.connection.close();
}

fixUnknownBlogPosts().catch(err => {
  console.error('❌ Error updating pages:', err);
  mongoose.connection.close();
});
