const express = require("express");
const router = express.Router();

const gscController = require('../controllers/gscController');


router.get('/auth', gscController.authController );
router.get('/callback', gscController.setTokensController);

router.get('/report', gscController.getReportController);


module.exports = router;