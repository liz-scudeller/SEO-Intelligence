const { generateSeoSuggestions } = require('../../frontend/src/services/supabaseClient');

const aiGenerateSeoSuggestions = async (req, res) => {
  try {
    const { data, userId } = req.body;
const filterType = req.query.filterType || 'all';

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'filteredData is required and must be an array.' });
    }

    const result = await generateSeoSuggestions(data, filterType, userId);
    res.json({ suggestions: result });
  } catch (error) {
    console.error('Open AI Error: ', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  aiGenerateSeoSuggestions,
};
