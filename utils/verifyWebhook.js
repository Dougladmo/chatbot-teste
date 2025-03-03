function verifyWebhook(req, res) {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
  
    if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responde com o challenge token do webhook
      console.log('WEBHOOK VERIFICADO');
      return res.status(200).send(challenge);
    } else {
      // Resposta caso falhe
      console.error('FALHA NA VERIFICAÇÃO DO WEBHOOK');
      return res.sendStatus(403);
    }
  }
  
  module.exports = { verifyWebhook };
  