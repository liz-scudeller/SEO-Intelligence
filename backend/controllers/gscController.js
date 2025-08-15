import * as gscService from '../services/gscService.js';

export const authController = async (req, res) => {
  const url = gscService.getAuthUrl();
  console.log("Auth URL:", url);
  res.redirect(url);
};

export const setTokensController = async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await gscService.setTokens(code);
    res.json({ message: 'Authenticated successfully', tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReportController = async (req, res) => {
  try {
    const {
      siteUrl,
      startDate,
      endDate,
      dimensions = 'page', // pode ser page, query, page,query
      rowLimit = 1000,
      pageFilter,
      queryFilter,
    } = req.query;

    const dimensionArray = dimensions.split(',').map(d => d.trim());

    const rows = await gscService.getSiteReport({
      siteUrl,
      startDate,
      endDate,
      dimensions: dimensionArray,
      rowLimit: parseInt(rowLimit),
    });

    let filtered = rows;

    if (pageFilter) {
      filtered = filtered.filter(r => r.keys.some(k => k.includes(pageFilter)));
    }

    if (queryFilter) {
      filtered = filtered.filter(r => r.keys.some(k => k.toLowerCase().includes(queryFilter.toLowerCase())));
    }

    res.json(filtered);
  } catch (error) {
    console.error("GSC Report Error:", error);
    res.status(500).json({ error: error.message });
  }
};
