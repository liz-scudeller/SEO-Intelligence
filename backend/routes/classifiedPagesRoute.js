const express = require('express');
const router = express.Router();
const ClassifiedPage = require('../models/classifiedPage');

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

module.exports = router;
