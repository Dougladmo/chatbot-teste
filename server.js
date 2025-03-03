require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { verifyWebhook } = require('./utils/verifyWebhook');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Rota GET para verificação do webhook
app.get('/webhook', verifyWebhook);

// Rota POST para receber as mensagens
app.post('/webhook', routes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
