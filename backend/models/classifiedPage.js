const mongoose = require('mongoose');

const classifiedPageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true },
    type: { type: String, enum: ['blog', 'city', 'service', 'page', 'unknown', 'product'], required: true },
    slug: { type: String, required: true },
    seoScore: Number,
    seoChecklist: [String],
    resolved: { type: Boolean, default: false },
    structuredData: [mongoose.Schema.Types.Mixed],
links: {
  internal: [String],
  external: [String],
},


    metaTags: {
      title: String,
      description: String,
      ogTitle: String,
      ogDescription: String,
      ogImage: String,
      canonical: String,
    },

    headings: {
      h1: [String],
      h2: [String],
      h3: [String],
    },

    aiRecommendations: {
   items: [
  {
    type: { type: String, required: true },
    suggestion: { type: String, required: true },
    impact: { type: String, enum: ['low', 'medium', 'high'], required: true }
  }
]
,
  generatedAt: Date,
status: {
  type: String,
  enum: ['pending', 'done', 'implemented'],
  default: 'pending'
}
},
aiVisibilityScore: Number,
aiVisibilityNotes: [String],
scoreHistory: [
  {
    date: { type: Date, default: Date.now },
    seoScore: Number,
    aiVisibilityScore: Number,
  }
],
gptSuggestions: {
  title: String,
  description: String,
  keywords: [String],
  justification: String,
  hasCallToAction: Boolean,
  semanticScore: Number,
  generatedAt: Date
},



  },
  { timestamps: true }
);


module.exports = mongoose.model('ClassifiedPage', classifiedPageSchema);
