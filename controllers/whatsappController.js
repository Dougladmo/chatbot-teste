const axios = require('axios');
const { updateCart, finalizePurchase } = require('../services/cartService');
const { getAllProducts } = require('../services/productService');

const userStates = {};
const token = process.env.WHATSAPP_TOKEN;
const apiUrl = 'https://graph.facebook.com/v15.0';

async function receiveMessage(req, res) {
  try {
    const body = req.body;
    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const changes = body.entry[0].changes[0].value;
      const messages = changes.messages;
      const phoneNumberId = changes.metadata.phone_number_id;
      for (const msg of messages) {
        const from = msg.from;
        console.log(`📩 Recebida mensagem de ${from}`, msg);
        if (msg.type === 'interactive' && msg.interactive.button_reply) {
          const buttonId = msg.interactive.button_reply.id;
          await handleButtonClick(buttonId, phoneNumberId, from);
        } else if (msg.type === 'text' && msg.text) {
          const textBody = msg.text.body.trim();
          await handleTextInput(textBody, phoneNumberId, from);
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro ao receber mensagem:', error?.response?.data || error.message);
    res.sendStatus(500);
  }
}

async function handleButtonClick(buttonId, phoneNumberId, from) {
  switch (buttonId) {
    // MENU PRINCIPAL e FAQ
    case 'FAQ_PAGE_1':
      await sendFAQMenuPage1(phoneNumberId, from);
      break;
    case 'COMPRAR':
      await sendPurchaseMenu(phoneNumberId, from);
      break;
    // FAQ Página 1
    case 'FAQ_PAGAMENTO':
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        '❓ *Formas de Pagamento:*\n\nAceitamos cartão, débito, Pix e boleto.',
        'FAQ_PAGE_1',
        '↩️ Voltar'
      );
      break;
    case 'FAQ_PRAZO':
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        '⏰ *Prazo de Entrega:*\n\n3 a 7 dias úteis, conforme a região.',
        'FAQ_PAGE_1',
        '↩️ Voltar'
      );
      break;
    case 'FAQ_PAGE_2':
      await sendFAQMenuPage2(phoneNumberId, from);
      break;
    // FAQ Página 2
    case 'FAQ_ATENDENTE':
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        '📞 *Atendimento:*\n\nEntre em contato via e-mail: suporte@nobuggy.com.br ou pelo chat online.',
        'FAQ_PAGE_2',
        '↩️ Voltar'
      );
      break;
    case 'FAQ_TROCAS':
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        '🔄 *Trocas/Devoluções:*\n\nSolicite troca ou devolução em até 7 dias após o recebimento.',
        'FAQ_PAGE_2',
        '↩️ Voltar'
      );
      break;
    case 'FAQ_BACK':
      await sendFAQMenuPage1(phoneNumberId, from);
      break;
    // Menu de Compras – Catálogo
    case 'VER_PRODUTOS':
      await sendCatalogImage(
        phoneNumberId,
        from,
        'https://site-nobuggy.s3.sa-east-1.amazonaws.com/imgteste.png',
        '🖼️ Confira nosso Catálogo!'
      );
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        'Acima está nosso catálogo!\n\n👉 Digite o *ID do produto* que deseja (ex.: "3").',
        'MENU_COMPRA_VOLTA',
        '↩️ Voltar'
      );
      userStates[from] = { step: 'AWAITING_ID', tempProductId: null };
      break;
    case 'VER_CARRINHO': {
      const cartMsg = updateCart(from);
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        `🛒 Seu carrinho:\n${cartMsg}`,
        'MENU_COMPRA_VOLTA',
        '↩️ Voltar'
      );
      break;
    }
    case 'FINALIZAR_COMPRA': {
      const finalMsg = finalizePurchase(from);
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        `✅ ${finalMsg}`,
        'MENU_PRINCIPAL',
        '↩️ Voltar ao Início'
      );
      break;
    }
    case 'MENU_COMPRA_VOLTA':
      await sendPurchaseMenu(phoneNumberId, from);
      break;
    case 'MENU_PRINCIPAL':
      await sendMainMenu(phoneNumberId, from);
      break;
    default:
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        '❌ Não entendi seu clique.',
        'MENU_PRINCIPAL',
        '↩️ Voltar ao Início'
      );
      break;
  }
}

async function handleTextInput(textBody, phoneNumberId, from) {
  const state = userStates[from] || { step: null, tempProductId: null };
  if (state.step === 'AWAITING_ID') {
    const allProds = getAllProducts();
    console.log('📦 Produtos disponíveis:', allProds);
    const chosen = allProds.find(p => p.id === textBody);
    if (!chosen) {
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        '⚠️ Produto não encontrado. Digite novamente o ID, ou "menu" para voltar.',
        'MENU_COMPRA_VOLTA',
        '↩️ Voltar'
      );
      return;
    }
    userStates[from] = { step: 'AWAITING_QTY', tempProductId: chosen.id };
    await sendInteractiveSingle(
      phoneNumberId,
      from,
      `🔢 Quantas unidades de *${chosen.name}* você deseja? Envie apenas um número inteiro (ex.: "1" ou "3"). A quantidade não pode ser 0 ou negativa.`,
      'MENU_COMPRA_VOLTA',
      '↩️ Voltar'
    );
    return;
  }
  if (state.step === 'AWAITING_QTY') {
    const qty = parseInt(textBody, 10);
    if (isNaN(qty) || qty <= 0) {
      await sendInteractiveSingle(
        phoneNumberId,
        from,
        '⚠️ Quantidade inválida! Digite um número inteiro maior que zero.',
        'MENU_COMPRA_VOLTA',
        '↩️ Voltar'
      );
      return;
    }
    const prodId = state.tempProductId;
    const confirmationMsg = updateCart(from, prodId, qty);
    userStates[from] = { step: null, tempProductId: null };
    await sendInteractiveSingle(
      phoneNumberId,
      from,
      `✅ ${confirmationMsg}`,
      'MENU_COMPRA_VOLTA',
      '↩️ Voltar'
    );
    const cartMsg = updateCart(from);
    await sendInteractiveSingle(
      phoneNumberId,
      from,
      `🛒 *Seu Carrinho Atual:*\n${cartMsg}`,
      'MENU_COMPRA_VOLTA',
      '↩️ Voltar'
    );
    return;
  }
  await sendMainMenu(phoneNumberId, from);
}

async function sendMainMenu(phoneNumberId, to) {
  try {
    const bodyText = '👋 Olá! Bem-vindo(a) ao Bot de teste.\n\n👉 Escolha uma opção:';
    const buttons = [
      { id: 'FAQ_PAGE_1', title: '❓ FAQ' },
      { id: 'COMPRAR', title: '🛍️ Comprar' }
    ];
    const responseData = makeInteractiveButtons(to, bodyText, buttons);
    await callSendAPI(phoneNumberId, responseData);
  } catch (error) {
    console.error('Erro ao enviar menu inicial:', error?.response?.data || error.message);
  }
}

async function sendPurchaseMenu(phoneNumberId, to) {
  try {
    const bodyText = '🛍️ *Menu de Compras:*\n\n👉 Escolha uma opção:';
    const buttons = [
      { id: 'VER_PRODUTOS', title: '📖 Ver Produtos' },
      { id: 'VER_CARRINHO', title: '🛒 Meu Carrinho' },
      { id: 'FINALIZAR_COMPRA', title: '✅ Finalizar Compra' }
    ];
    const responseData = makeInteractiveButtons(to, bodyText, buttons);
    await callSendAPI(phoneNumberId, responseData);
  } catch (error) {
    console.error('Erro ao enviar menu de compras:', error?.response?.data || error.message);
  }
}

async function sendFAQMenuPage1(phoneNumberId, to) {
  try {
    const bodyText = '*❓ FAQ - Página 1*\n\n1️⃣ Formas de Pagamento\n2️⃣ Prazo de Entrega\n\nDigite "menu" para voltar.\n\n👉 Selecione um tópico:';
    const buttons = [
      { id: 'FAQ_PAGAMENTO', title: '💳 Pagamento' },
      { id: 'FAQ_PRAZO', title: '⏰ Prazo' },
      { id: 'FAQ_PAGE_2', title: '➡️ Mais FAQ' }
    ];
    const responseData = makeInteractiveButtons(to, bodyText, buttons);
    await callSendAPI(phoneNumberId, responseData);
  } catch (error) {
    console.error('Erro ao enviar FAQ (página 1):', error?.response?.data || error.message);
  }
}

async function sendFAQMenuPage2(phoneNumberId, to) {
  try {
    const bodyText = '*❓ FAQ - Página 2*\n\n1️⃣ Atendimento\n2️⃣ Trocas/Devoluções\n\nDigite "menu" para voltar.\n\n👉 Selecione um tópico:';
    const buttons = [
      { id: 'FAQ_ATENDENTE', title: '☎️ Atendimento' },
      { id: 'FAQ_TROCAS', title: '🔄 Trocas' },
      { id: 'FAQ_BACK', title: '⬅️ Voltar' }
    ];
    const responseData = makeInteractiveButtons(to, bodyText, buttons);
    await callSendAPI(phoneNumberId, responseData);
  } catch (error) {
    console.error('Erro ao enviar FAQ (página 2):', error?.response?.data || error.message);
  }
}

async function sendCatalogImage(phoneNumberId, to, imageUrl, caption) {
  try {
    const responseData = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption }
    };
    await callSendAPI(phoneNumberId, responseData);
  } catch (error) {
    console.error('Erro ao enviar imagem do catálogo:', error?.response?.data || error.message);
  }
}

async function sendInteractiveSingle(phoneNumberId, to, message, buttonId, buttonTitle) {
  try {
    const responseData = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: message },
        action: {
          buttons: [{ type: 'reply', reply: { id: buttonId, title: buttonTitle } }]
        }
      }
    };
    await callSendAPI(phoneNumberId, responseData);
  } catch (error) {
    console.error('Erro ao enviar mensagem interativa single:', error?.response?.data || error.message);
  }
}

function makeInteractiveButtons(to, bodyText, buttons) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) }
    }
  };
}

async function callSendAPI(phoneNumberId, responseData) {
  try {
    await axios.post(
      `${apiUrl}/${phoneNumberId}/messages`,
      responseData,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error?.response?.data || error.message);
  }
}

module.exports = { receiveMessage };
