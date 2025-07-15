const mongoose = require('mongoose');
require('dotenv').config();

const { fetchSitemapUrls } = require('../utils/sitemapReader');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('✅ Connected to DB');
  await fetchSitemapUrls('https://homeservicesolutions.ca/sitemap.xml');
  console.log('✅ Finished importing sitemap');
  process.exit();
});
