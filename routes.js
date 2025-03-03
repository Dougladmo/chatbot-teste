const express = require('express');
const { receiveMessage } = require('./controllers/whatsappController');
const router = express.Router();

router.post('/webhook', receiveMessage);

module.exports = router;
