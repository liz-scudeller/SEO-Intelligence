const express = require('express');
const router = express.Router();
const SeoTask = require('../models/seoTask');

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
    const task = await SeoTask.findByIdAndUpdate(req.params.id, { status: 'done' }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark task as done' });
  }
});

// PATCH mark as pending
router.patch('/:id/pending', async (req, res) => {
  try {
    const task = await SeoTask.findByIdAndUpdate(req.params.id, { status: 'pending' }, { new: true });
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
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET });

router.post('/:id/generate-content', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await SeoTask.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const prompt = task.contentPrompt || `Write an SEO-optimized blog post about ${task.keyword}. Include structure, benefits, and a call to action.`;

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

    // Simula geração do prompt (você pode chamar GPT depois)
    const generatedPrompt = `Write an SEO-optimized blog post for task ${id}`;

    const task = await SeoTask.findByIdAndUpdate(
      id,
      { contentPrompt: generatedPrompt },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error generating prompt:', err.message);
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

module.exports = router;
