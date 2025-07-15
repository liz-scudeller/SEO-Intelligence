const express = require("express");
const router = express.Router();
const openaiServiceController = require('../controllers/openAIController');


router.post('/seo-suggestions', openaiServiceController.aiGenerateSeoSuggestions);


module.exports = router;