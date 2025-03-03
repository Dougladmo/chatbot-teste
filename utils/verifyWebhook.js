function verifyWebhook(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFICADO COM SUCESSO');
    return res.status(200).send(challenge);
  } else {
    console.error('FALHA NA VERIFICAÇÃO DO WEBHOOK');
    return res.sendStatus(403);
  }
}

module.exports = { verifyWebhook };
