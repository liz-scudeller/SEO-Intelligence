const mongoose = require('mongoose');

const seoTaskSchema = new mongoose.Schema({
  keyword: String,
  action: String,
  seoTitle: String,
  metaDescription: String,
  slug: String,
  justification: String,
  impressions: Number,
  clicks: Number,
  ctr: Number,
  position: Number,
  semanticScore: Number,
  hasCallToAction: Boolean,
  contentPrompt: String,
  content: String,
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  posted: { type: Boolean, default: false }, 
}, { timestamps: true });

module.exports = mongoose.model('SeoTask', seoTaskSchema);
