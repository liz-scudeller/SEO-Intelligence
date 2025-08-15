import express from 'express';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';

import ClassifiedPage from '../models/classifiedPage.cjs';
import { analyzeSEO } from '../services/seo/seoAnalyzer.js';
import { generateAiRecommendations } from '../utils/generateAiRecommendations.js';
import { generateTitleAndMetaWithGPT } from '../utils/generateGptSuggestions.js';

const router = express.Router();






// GET /seo-report?type=service
router.get('/', async (req, res) => {
  try {
    const { type, aiStatus } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (aiStatus === 'pending') {
  filter.$or = [
    { 'aiRecommendations.status': 'pending' },
    { 'aiRecommendations.status': { $exists: false } }
  ];
} else if (aiStatus) {
  filter['aiRecommendations.status'] = aiStatus;
}

    const pages = await ClassifiedPage.find(filter, {
      url: 1,
      seoScore: 1,
      seoChecklist: 1,
      type: 1,
      resolved: 1,
      aiRecommendations: 1,
      aiVisibilityScore: 1,
      aiVisibilityNotes: 1,
    }).sort({ seoScore: 1 });

    res.json(pages);
  } catch (err) {
    console.error('Error getting SEO report:', err.message);
    res.status(500).json({ error: 'Failed to fetch SEO report' });
  }
});


router.get('/low-score', async (req, res) => {
  try {
const min = req.query.min ? Number(req.query.min) : null;
    const type = req.query.type;

const query = {};
if (min !== null) query.seoScore = { $lt: min };
if (type) query.type = type;


    const pages = await ClassifiedPage.find(
      query,
      { url: 1, seoScore: 1, seoChecklist: 1, type: 1 }
    ).sort({ seoScore: 1 });

    res.json(pages);
  } catch (err) {
    console.error('Error getting low-score report:', err.message);
    res.status(500).json({ error: 'Failed to fetch low-score pages' });
  }
});


router.patch('/resolve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved } = req.body;

    const page = await ClassifiedPage.findByIdAndUpdate(
      id,
      { resolved: resolved === 'true' || resolved === true },
      { new: true }
    );

    if (!page) return res.status(404).json({ error: 'Page not found' });


    res.json({ message: 'Resolved status updated', resolved: page.resolved });
  } catch (err) {
    console.error('Error toggling resolved:', err.message);
    res.status(500).json({ error: 'Failed to update resolved status' });
  }
});



router.post('/reanalyze/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const page = await ClassifiedPage.findById(id);
    if (!page) return res.status(404).json({ error: 'Página não encontrada' });

const analysis = await analyzeSEO(page.url);

page.seoScore = analysis.score;
page.seoChecklist = analysis.checklist;
page.metaTags = analysis.metaTags;
page.headings = analysis.headings;

await page.save();


    res.json({ message: 'Reanalisado com sucesso', page });
  } catch (err) {
    console.error('Erro ao reanalisar página:', err.message);
    res.status(500).json({ error: 'Erro ao reanalisar' });
  }
});

router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const page = await ClassifiedPage.findById(id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(page);
  } catch (err) {
    console.error('Error fetching page details:', err.message);
    res.status(500).json({ error: 'Failed to fetch page details' });
  }
});

router.post('/reanalyze-all', async (req, res) => {
  try {
    const pages = await ClassifiedPage.find({
      seoChecklist: { $ne: ['Error: Request failed with status code 429'] },
    });

    for (const page of pages) {
      const analysis = await analyzeSEO(page.url);

      await ClassifiedPage.updateOne(
        { _id: page._id },
        {
          $set: {
            seoScore: analysis.score,
            seoChecklist: analysis.checklist,
            metaTags: analysis.metaTags,
            headings: analysis.headings,
            structuredData: analysis.structuredData,
            links: analysis.links,
            resolved: false,
          },
        }
      );
    }

    res.json({ message: 'All pages reanalyzed successfully' });
  } catch (err) {
    console.error('Error reanalyzing all pages:', err.message);
    res.status(500).json({ error: 'Failed to reanalyze all pages' });
  }
});

router.get('/:id/recommendations', async (req, res) => {
  try {
    const page = await ClassifiedPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const recommendations = generateAiRecommendations(page);

    // Salva no banco
    page.aiRecommendations = {
      items: recommendations,
      generatedAt: new Date(),
      status: 'done'
    };

    await page.save();

res.json({
  aiRecommendations: page.aiRecommendations
});

} catch (err) {
    console.error('Error generating recommendations:', err.message);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

router.patch('/:id/recommendations/status', async (req, res) => {
  try {
    const { status } = req.body;
    const page = await ClassifiedPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    page.aiRecommendations.status = status;
    await page.save();

    res.json({ message: 'Status updated', status });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ error: 'Failed to update recommendation status' });
  }
});

router.get('/export', async (req, res) => {
  try {
    const { type, min, aiStatus } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (min) filter.seoScore = { $lt: Number(min) };
    if (aiStatus) {
      if (aiStatus === 'pending') {
        filter.$or = [
          { 'aiRecommendations.status': 'pending' },
          { 'aiRecommendations.status': { $exists: false } }
        ];
      } else {
        filter['aiRecommendations.status'] = aiStatus;
      }
    }

    const pages = await ClassifiedPage.find(filter).sort({ seoScore: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('SEO Report');

    sheet.columns = [
      { header: 'URL', key: 'url', width: 40 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Score', key: 'seoScore', width: 10 },
      { header: 'AI Status', key: 'aiStatus', width: 15 },
      { header: 'Checklist Items', key: 'checklist', width: 60 },
    ];

    pages.forEach((p) => {
      sheet.addRow({
        url: p.url,
        type: p.type,
        seoScore: p.seoScore,
        aiStatus: p.aiRecommendations?.status || 'pending',
        checklist: (p.seoChecklist || []).join('; ')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=seo-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting Excel:', err.message);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

router.get('/:id/gpt-suggestions', async (req, res) => {
  try {
    const page = await ClassifiedPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const suggestions = await generateTitleAndMetaWithGPT(page);

    // ✅ Apenas retorna (não salva ainda!)
    res.json({ suggestions });
  } catch (err) {
    console.error('GPT suggestion error:', err.message);
    res.status(500).json({ error: 'Failed to generate GPT suggestions' });
  }
});


router.patch('/:id/gpt-suggestions/apply', async (req, res) => {
  try {
    const page = await ClassifiedPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    if (!page.gptSuggestions) {
      return res.status(400).json({ error: 'No GPT suggestion found for this page' });
    }

const { title, description, applyToMetaTags, justification, semanticScore, hasCallToAction } = req.body;

if (!page.gptSuggestions) page.gptSuggestions = {};

if (title) page.gptSuggestions.title = title;
if (description) page.gptSuggestions.description = description;
if ('justification' in req.body) page.gptSuggestions.justification = justification;
if ('semanticScore' in req.body) page.gptSuggestions.semanticScore = semanticScore;
if ('hasCallToAction' in req.body) page.gptSuggestions.hasCallToAction = hasCallToAction;


page.gptSuggestions.generatedAt = new Date();

if (applyToMetaTags) {
  if (!page.metaTags) page.metaTags = {};
  page.metaTags.title = page.gptSuggestions.title;
  page.metaTags.description = page.gptSuggestions.description;
}
    await page.save();

    res.json({
      message: applyToMetaTags
        ? 'GPT Suggestions applied to metaTags'
        : 'Suggestions saved to gptSuggestions only',
      metaTags: page.metaTags,
      gptSuggestions: page.gptSuggestions,
    });
  } catch (err) {
    console.error('Error applying suggestions:', err.message);
    res.status(500).json({ error: 'Failed to apply suggestions' });
  }
});

router.patch('/:id/gpt-suggestions/save', async (req, res) => {
  try {
    const { title, description, justification, semanticScore, hasCallToAction } = req.body;

    const page = await ClassifiedPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    if (!page.gptSuggestions) page.gptSuggestions = {};

    if (title) page.gptSuggestions.title = title;
    if (description) page.gptSuggestions.description = description;
if ('justification' in req.body) page.gptSuggestions.justification = justification;
if ('semanticScore' in req.body) page.gptSuggestions.semanticScore = semanticScore;
if ('hasCallToAction' in req.body) page.gptSuggestions.hasCallToAction = hasCallToAction;

    

    page.gptSuggestions.generatedAt = new Date();

    await page.save();

    res.json({ message: 'Suggestions saved', gptSuggestions: page.gptSuggestions });
  } catch (err) {
    console.error('Error saving GPT suggestions:', err.message);
    res.status(500).json({ error: 'Failed to save GPT suggestions' });
  }
});


export default router;
