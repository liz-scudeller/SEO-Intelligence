const express = require('express');
const router = express.Router();

const getSiteReport = require('../../services/gsc/getSiteReport');
const { generateBlogIdeas, generateBlogContentFromPrompt, generateContentPrompt} = require('../../services/openAIService');
const SeoTask = require('../../models/seoTask');


// GET /blog-ideas
router.get('/', async (req, res) => {
  const blogTasks = await SeoTask.find({ action: 'blog' }).sort({ createdAt: -1 });
  res.json({ suggestions: blogTasks });
});

// POST /blog-ideas/generate
router.post('/generate', async (req, res) => {
  console.log('🚀 Recebida solicitação para gerar blog ideas');
  try {
    // const { data, userId } = req.body;

    const { userId } = req.body;

    const startDate = req.query.start || '2025-06-01';
    const endDate = req.query.end || '2025-07-01';
    const siteUrl = 'https://homeservicesolutions.ca';

    const rawData = await getSiteReport({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 1000,
    });

const blogSuggestions = await require('../../services/openAIService').generateBlogIdeas(rawData, userId);

    for (const s of blogSuggestions) {
  const exists = await SeoTask.findOne({ keyword: s.keyword, action: 'blog' });
  if (!exists) {
    try {
   await SeoTask.create({ 
  keyword: s.keyword,
  action: 'blog',
  seoTitle: s.blogTitle || s.seoTitle,
  slug: s.slug,
  metaDescription: s.metaDescription,
  content: '',
  justification: s.justification,
  semanticScore: s.semanticScore ?? 0,
  hasCallToAction: s.hasCallToAction ?? false,
  status: 'pending',
  impressions: s.baseData?.impressions || 0,
  clicks: s.baseData?.clicks || 0,
  ctr: s.baseData?.ctr || 0,
  position: s.baseData?.position || 0,
  contentPrompt: s.contentPrompt,
});
} catch (err) {
  console.error('❌ Erro ao salvar blog idea:', err.message);
}

  }
}

    res.json({ message: 'Blog ideas generated and saved.' });
  } catch (err) {
    console.error('Error generating blog ideas:', err.message);
    res.status(500).json({ error: 'Failed to generate blog ideas' });
  }
});

router.patch('/:id/generate-prompt', async (req, res) => {
  try {
    const task = await SeoTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Blog idea not found' });

    const title = task.seoTitle;
    const slug = task.slug;
    const metaDescription = task.metaDescription;
    const keywords = task.keyword;

    const contentPrompt = `Create a blog post about '${title}'. Write it in an informative tone. Use transition words. Use active voice. Write over 1000 words. The blog post should be in a beginner’s guide style. Add title and subtitle for each section. It should have a minimum of 6 sections. Include the following keywords: ${keywords}. Create a good SEO title, slug for this post, a meta description with a maximum of 100 words, and an excerpt. At the end, generate a prompt for an image that fits the blog post.`;

    task.contentPrompt = contentPrompt;
    await task.save();

    res.json({ message: 'Prompt generated', contentPrompt });
  } catch (err) {
    console.error('Error generating content prompt:', err.message);
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

router.post('/:id/generate-content', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await SeoTask.findById(id);
    if (!task) return res.status(404).json({ error: 'SeoTask not found' });

    if (!task.contentPrompt) {
      return res.status(400).json({ error: 'No contentPrompt found for this blog idea' });
    }

    const content = await generateBlogContentFromPrompt(task.contentPrompt);

    task.content = content;
    await task.save();

    res.json({ message: 'Blog content generated and saved.', content });
  } catch (err) {
    console.error('Error generating blog content:', err.message);
    res.status(500).json({ error: 'Failed to generate blog content' });
  }
});

router.patch('/:id/posted', async (req, res) => {
  try {
    const { id } = req.params;
    const { posted } = req.body;

    const idea = await SeoTask.findByIdAndUpdate(id, { posted }, { new: true });
        await SeoTask.findByIdAndUpdate(id, { status: posted ? 'done' : 'pending' });

    if (!idea) return res.status(404).json({ error: 'Blog idea not found' });

    res.json({ message: 'Updated posted status', posted: idea.posted });
  } catch (err) {
    console.error('Error updating posted status:', err.message);
    res.status(500).json({ error: 'Failed to update posted status' });
  }
});

router.patch('/:id/save-prompt', async (req, res) => {
  const { id } = req.params;
  const { contentPrompt } = req.body;

  try {
    const updated = await SeoTask.findByIdAndUpdate(
      id,
      { contentPrompt },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Task not found' });

    res.json({ message: 'Prompt updated', updated });
  } catch (err) {
    console.error('Error updating prompt:', err.message);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await SeoTask.findByIdAndDelete(id);
    res.json({ message: 'Idea deleted' });
  } catch (err) {
    console.error('Error deleting blog idea:', err.message);
    res.status(500).json({ error: 'Failed to delete blog idea' });
  }
});

module.exports = router;
