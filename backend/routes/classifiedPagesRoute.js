import express from 'express';
import ClassifiedPage from '../models/classifiedPage.cjs';

const router = express.Router();

// GET /classified-pages?type=service
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};

    const pages = await ClassifiedPage.find(filter).sort({ url: 1 });
    res.json(pages);
  } catch (error) {
    console.error('Error fetching classified pages:', error.message);
    res.status(500).json({ error: 'Failed to fetch classified pages' });
  }
});

export default router;
