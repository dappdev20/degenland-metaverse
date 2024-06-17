const express = require('express');
const router = express.Router();
const placement = require("./controller");

//router.get('/get_url', placement.getUrl);
router.post('/get_url', placement.getUrl);
router.post('/setLinkUrl', placement.setLinkUrl);
module.exports = router;
