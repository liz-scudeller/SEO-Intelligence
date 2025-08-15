import express from 'express';
import * as openaiServiceController from '../controllers/openAIController.js';

const router = express.Router();

router.post('/seo-suggestions', openaiServiceController.aiGenerateSeoSuggestions);

export default router;
