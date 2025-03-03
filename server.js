require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { verifyWebhook } = require('./utils/verifyWebhook');
const routes = require('./routes');

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

// Rota GET -> verificação do webhook
app.get('/webhook', verifyWebhook);

// Rota POST -> recebe mensagens do WhatsApp
app.post('/webhook', routes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
