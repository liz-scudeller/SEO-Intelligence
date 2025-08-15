import express from 'express';
import SeoTask from '../models/seoTask.js';
import generateLocalPageFromKeyword from '../services/gsc/generateLocalPageFromKeyword.js';
import { supabase } from '../services/supabaseClient.js';
import { generateBlogContentFromPrompt } from '../services/openAIService.js';
import axios from 'axios';

const router = express.Router();



// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await SeoTask.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// PATCH mark as posted
router.patch('/:id/posted', async (req, res) => {
  try {
    const { posted } = req.body;
    const task = await SeoTask.findByIdAndUpdate(req.params.id, { posted }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH mark as done
router.patch('/:id/done', async (req, res) => {
  try {
    const task = await SeoTask.findByIdAndUpdate(
      req.params.id,
      {
        status: 'done',
        doneAt: new Date(),
        posted: true
      },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark task as done' });
  }
});

// PATCH mark as pending
router.patch('/:id/pending', async (req, res) => {
  try {
    const task = await SeoTask.findByIdAndUpdate(
      req.params.id,
      {
        status: 'pending',
        posted: false,
        $unset: { doneAt: '' }  // Remove o doneAt
      },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark task as pending' });
  }
});


// DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    await SeoTask.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST regenerate content
import { OpenAI } from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET });

router.post('/:id/generate-content', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await SeoTask.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Garante que o prompt é rico em contexto
    let prompt = task.contentPrompt;
    if (!prompt) {
      const { seoTitle, slug, metaDescription, keyword } = task;
      prompt = `
Write an SEO-optimized blog post.

Title: ${seoTitle}
Slug: ${slug}
Meta description: ${metaDescription}
Target keyword: ${keyword}

Structure:
- Introduction with hook
- Benefits
- How it works / process
- Why choose us
- FAQs
- Conclusion with CTA

Audience: Local homeowners in our service area.
Tone: Informative, friendly, persuasive.
      `.trim();
    }

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful SEO assistant that writes persuasive, SEO-optimized blog posts.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const generatedContent = chatCompletion.choices[0].message.content;

    task.content = generatedContent;
    await task.save();

    res.json(task);
  } catch (err) {
    console.error('Failed to generate content:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});


router.patch('/:id/generate-prompt', async (req, res) => {
  try {
    const id = req.params.id;
    const task = await SeoTask.findById(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { seoTitle, slug, metaDescription, keyword } = task;

    const generatedPrompt = `
Write an SEO-optimized blog post.

Title: ${seoTitle}
Slug: ${slug}
Meta description: ${metaDescription}
Target keyword: ${keyword}

Structure:
- Introduction (engaging hook)
- Main sections with H2s and bullet points
- Use natural language and persuasive tone
- Include internal call-to-action
- End with a summary and soft CTA

Target audience: Homeowners looking for ${keyword}

Focus on helpful, accurate, and clear content that matches search intent.
`;

    task.contentPrompt = generatedPrompt.trim();
    await task.save();

    res.json(task);
  } catch (err) {
    console.error('Error generating prompt:', err.message);
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});


router.post('/generate-local-page', async (req, res) => {
  const { keyword, url, userId, metrics } = req.body;

  if (!keyword || !url || !userId) {
    return res.status(400).json({ error: 'Missing params' });
  }
  const task = await generateLocalPageFromKeyword(keyword, url, metrics || {});
  if (!task) {
    return res.status(400).json({ error: 'Could not extract location' });
  }

  try {
    const newTask = new SeoTask({ ...task, userId });
    await newTask.save();
    return res.json({ success: true, task: newTask });
  } catch (err) {
    console.error('❌ Mongo insert error:', err);
    return res.status(500).json({ error: 'MongoDB insert failed' });
  }
});

router.patch('/:id/generate-local-page', async (req, res) => {
  const body = req.body || {};
  const { metrics = {} } = body;
  const { id } = req.params;


  try {
    const existingTask = await SeoTask.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { keyword, url } = existingTask;

    const updatedFields = await generateLocalPageFromKeyword(keyword, url, metrics);
    if (!updatedFields) {
      return res.status(400).json({ error: 'Could not extract location' });
    }

    Object.assign(existingTask, updatedFields);

    const { impressions = 0, clicks = 0, ctr = 0, position = 0 } = metrics;
    existingTask.impressions = impressions;
    existingTask.clicks = clicks;
    existingTask.ctr = ctr;
    existingTask.position = position;

    await existingTask.save();

    res.json({ success: true, task: existingTask.toObject() });
  } catch (err) {
    console.error('❌ Error regenerating local page data:', err);
    res.status(500).json({ error: 'Failed to regenerate local page' });
  }
});


router.post('/generate-local-page-content', async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

  try {
    const task = await SeoTask.findById(taskId);
    if (!task || !task.contentPrompt) return res.status(404).json({ error: 'Task not found or no prompt' });

    const content = await generateBlogContentFromPrompt(task.contentPrompt);

    task.content = content;
    await task.save();

    res.json({ success: true, content });
  } catch (err) {
    console.error('❌ Error generating content:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

router.post('/:id/generate-local-page-content', async (req, res) => {
  const { id } = req.params;

  try {
    const task = await SeoTask.findById(id);
    if (!task || !task.contentPrompt) {
      return res.status(404).json({ error: 'Task not found or no prompt' });
    }

    const content = await generateBlogContentFromPrompt(task.contentPrompt);

    task.content = content;
    await task.save();

    res.json(task); // retorna a task atualizada
  } catch (err) {
    console.error('❌ Error generating content:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});


router.post('/:id/post-to-wordpress', async (req, res) => {
  try {
    const task = await SeoTask.findById(req.params.id);
    if (!task || !task.content) {
      return res.status(400).json({ error: 'Task not found or missing content' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64');

const response = await axios.post(`${process.env.WP_URL}/wp-json/wp/v2/pages`, {
  title: task.seoTitle,
  slug: task.slug,
  status: 'draft',
  content: '', // Deixe vazio se estiver usando ACF para o conteúdo
  
  template: 'page-local-service.php',

  // ✅ Envia os campos personalizados ACF
  acf: {
    mainTitle: task.mainTitle,
    introParagraph: task.introParagraph,
    serviceName: task.serviceName,
    cityName: task.cityName,
    whyItMatters: task.whyItMatters,
    howItWorks: task.howItWorks,
    benefits: task.benefits,
    ctaTitle: task.ctaTitle,
    ctaButtonText: task.ctaButtonText,
    ctaButtonLink: task.ctaButtonLink,
    bottomCtaText: task.bottomCtaText,
    is_local_service_page: true
  },

  // ✅ Envia o campo de descrição SEO do Yoast
  meta: {
    _yoast_wpseo_metadesc: task.metaDescription
  }

}, {
  headers: {
    Authorization: 'Basic ' + Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64'),
    'Content-Type': 'application/json'
  }
});


    const wpPostId = response.data.id;

    task.posted = true;
    task.postedAt = new Date();
    task.wpPostId = wpPostId;
    await task.save();

    await axios.post(`${process.env.WP_URL}/wp-json/acf/v3/pages/${wpPostId}`, {
  fields: {
    maintitle: task.mainTitle || '',
    introparagraph: task.introParagraph || '',
    serviceintro: task.serviceIntro || '',
    servicename: task.serviceName || '',
    cityname: task.cityName || '',
    whyitmatters: task.whyItMatters || '',
    howitworks: task.howItWorks || '',
    benefits: task.benefits || '',
    faq: task.faq || '',
    ctatitle: task.ctaTitle || '',
    ctabuttontext: task.ctaButtonText || '',
    ctabuttonlink: task.ctaButtonLink || '',
    bottomctatext: task.bottomCtaText || '',
    is_local_service_page: true
  }
}, {
  headers: {
    Authorization: authHeader,
    'Content-Type': 'application/json'
  }
});


    res.json({ success: true, postId: wpPostId });

  } catch (err) {
    console.error('❌ Error posting to WordPress:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to post to WordPress' });
  }
});

router.get('/implementation-report', async (req, res) => {
  try {
    const { doneAfter, doneBefore } = req.query;

    if (!doneAfter || !doneBefore) {
      return res.status(400).json({ error: 'Missing doneAfter or doneBefore parameters' });
    }

    const start = new Date(`${doneAfter}T00:00:00`);
    const end = new Date(`${doneBefore}T23:59:59.999`);

    const tasks = await SeoTask.find({
  $or: [
    {
      posted: true,
      doneAt: {
        $gte: start,
        $lte: end
      }
    },
    {
      status: 'pending',
      createdAt: {
        $gte: start,
        $lte: end
      }
    }
  ]
}).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching implementation report:', err);
    res.status(500).json({ error: 'Failed to fetch implementation report' });
  }
});



export default router;
