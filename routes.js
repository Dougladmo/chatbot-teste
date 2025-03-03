const express = require('express');
const { receiveMessage } = require('./controllers/whatsappController');

const router = express.Router();

// Quando receber POST em /webhook, chama o controller
router.post('/webhook', receiveMessage);

module.exports = router;
