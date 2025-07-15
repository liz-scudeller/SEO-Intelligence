const SeoTask = require('../models/seoTask');
const { generateSeoContent } = require('../services/openAIService');

exports.getSeoTasks = async (req, res) => {
  try {
    const tasks = await SeoTask.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching SEO tasks:', err.message);
    res.status(500).json({ error: 'Failed to fetch SEO tasks.' });
  }
};

exports.markAsDone = async (req, res) => {
  try {
    const task = await SeoTask.findByIdAndUpdate(req.params.id, { status: 'done' }, { new: true });
    res.json(task);
  } catch (err) {
    console.error('Error marking task as done:', err.message);
    res.status(500).json({ error: 'Failed to mark as done.' });
  }
};

exports.markAsUndone = async (req, res) => {
  try {
    const task = await SeoTask.findByIdAndUpdate(req.params.id, { status: 'pending' }, { new: true });
    res.json(task);
  } catch (err) {
    console.error('Error marking task as undone:', err.message);
    res.status(500).json({ error: 'Failed to mark as undone.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await SeoTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting SEO task:', err.message);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};

exports.generateContent = async (req, res) => {
  try {
    const task = await SeoTask.findById(req.params.id);
    if (!task || !task.contentPrompt) {
      return res.status(400).json({ error: 'No content prompt available' });
    }

    const content = await generateSeoContent(task.contentPrompt);
    task.content = content;
    await task.save();

    res.json({ message: 'Content generated', content });
  } catch (err) {
    console.error('Error generating content:', err.message);
    res.status(500).json({ error: 'Failed to generate content.' });
  }
};
