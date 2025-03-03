const axios = require('axios');
const { handleTextMessage } = require('../services/productService');
const { updateCart, finalizePurchase } = require('../services/cartService');

const token = process.env.WHATSAPP_TOKEN;
const apiUrl = 'https://graph.facebook.com/v15.0';

// Função principal para lidar com mensagens recebidas
async function receiveMessage(req, res) {
  try {
    const body = req.body;

    // Verifica se a entrada é um evento válido do WhatsApp
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

        // Se for clique de botão interativo
        if (msg.type === 'interactive' && msg.interactive.button_reply) {
          const buttonId = msg.interactive.button_reply.id;

          switch (buttonId) {
            /**
             * MENU INICIAL
             */
            case 'MENU_INICIAL':
              // Envia o menu inicial
              await sendMainMenu(phoneNumberId, from);
              break;

            case 'FAQ':
              // Envia algumas perguntas frequentes
              await sendTextMessage(phoneNumberId, from, 
                'Perguntas Frequentes:\n\n'+
                '1. Quais formas de pagamento?\n'+
                '2. Qual o prazo de entrega?\n'+
                '3. Como falar com um atendente?\n\n'+
                'Digite "menu" para voltar ao início.'
              );
              break;

            case 'COMPRAR':
              // Envia submenu de compra (produtos, carrinho, etc.)
              await sendPurchaseMenu(phoneNumberId, from);
              break;

            case 'PEDIDO':
              // Envia opções de status do pedido
              await sendOrderStatusMenu(phoneNumberId, from);
              break;

            /**
             * MENU DE COMPRA
             */
            case 'VER_PRODUTOS':
              // Listar produtos
              const productListMsg = handleTextMessage('1'); 
              await sendTextMessage(phoneNumberId, from, productListMsg);
              // Depois de listar, poderia novamente enviar os botões de compra
              await sendPurchaseMenu(phoneNumberId, from);
              break;

            case 'VER_CARRINHO':
              // Ver carrinho
              const cartMsg = updateCart(from);
              await sendTextMessage(phoneNumberId, from, cartMsg);
              // Retorna ao menu de compra
              await sendPurchaseMenu(phoneNumberId, from);
              break;

            case 'FINALIZAR_COMPRA':
              // Finalizar compra
              const finalMsg = finalizePurchase(from);
              await sendTextMessage(phoneNumberId, from, finalMsg);
              // Poderia voltar ao menu inicial
              await sendMainMenu(phoneNumberId, from);
              break;

            /**
             * ACOMPANHAR PEDIDO
             */
            case 'STATUS_PAGO':
              // Exemplo de notificação quando o pedido é pago
              await sendTextMessage(phoneNumberId, from, 'Seu pedido foi marcado como PAGO.');
              break;

            case 'STATUS_SEPARACAO':
              await sendTextMessage(phoneNumberId, from, 'O pedido está em separação.');
              break;

            case 'STATUS_ENTREGA':
              await sendTextMessage(phoneNumberId, from, 'O pedido saiu para entrega.');
              break;

            case 'STATUS_CONCLUIDO':
              await sendTextMessage(phoneNumberId, from, 'O pedido está pronto para retirada ou foi entregue.');
              break;

            default:
              // Caso não reconheça o ID do botão
              await sendTextMessage(phoneNumberId, from, 'Não entendi seu clique. Tente novamente ou digite "menu" para voltar.');
              break;
          }
        }
        // Se for mensagem de texto normal
        else if (msg.type === 'text' && msg.text) {
          const textBody = msg.text.body.toLowerCase().trim();

          // Se alguém digitar "menu", reenvia o menu inicial
          if (textBody === 'menu') {
            await sendMainMenu(phoneNumberId, from);
          }
          // Se quiser manter a lógica de adicionar via texto: "adicionar 2"
          else if (textBody.startsWith('adicionar')) {
            const splitted = textBody.split(' ');
            const productId = splitted[1];
            const cartMsg = updateCart(from, productId);
            await sendTextMessage(phoneNumberId, from, cartMsg);
            // Volta para menu de compra
            await sendPurchaseMenu(phoneNumberId, from);
          } else {
            // Fallback
            await sendTextMessage(phoneNumberId, from, 'Não entendi. Digite "menu" para voltar ao início.');
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro ao receber mensagem:', error?.response?.data || error.message);
    res.sendStatus(500);
  }
}

/**
 * Envia mensagem de texto simples
 */
async function sendTextMessage(phoneNumberId, to, message) {
  try {
    await axios.post(
      `${apiUrl}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao enviar mensagem de texto:', error?.response?.data || error.message);
  }
}

/**
 * Envia o menu inicial
 */
async function sendMainMenu(phoneNumberId, to) {
  try {
    const bodyText = 'Olá! Bem-vindo(a) ao Bot.\nO que deseja fazer?';
    const buttons = [
      { id: 'FAQ',      title: 'Perguntas Frequentes' },
      { id: 'COMPRAR',  title: 'Comprar' },
      { id: 'PEDIDO',   title: 'Acompanhar Pedido' }
    ];

    const responseData = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    await axios.post(`${apiUrl}/${phoneNumberId}/messages`, responseData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erro ao enviar menu inicial:', error?.response?.data || error.message);
  }
}

/**
 * Envia o submenu de compra (Ver Produtos, Ver Carrinho, Finalizar)
 */
async function sendPurchaseMenu(phoneNumberId, to) {
  try {
    const bodyText = 'Menu de Compras:\nEscolha uma opção:';
    const buttons = [
      { id: 'VER_PRODUTOS',    title: 'Ver Produtos' },
      { id: 'VER_CARRINHO',    title: 'Meu Carrinho' },
      { id: 'FINALIZAR_COMPRA',title: 'Finalizar Compra' }
    ];

    const responseData = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    await axios.post(`${apiUrl}/${phoneNumberId}/messages`, responseData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erro ao enviar menu de compras:', error?.response?.data || error.message);
  }
}

/**
 * Menu de acompanhamento de pedido (status)
 */
async function sendOrderStatusMenu(phoneNumberId, to) {
  try {
    const bodyText = 'Acompanhar Pedido:\nEscolha o status para atualizar ou consultar.';
    const buttons = [
      { id: 'STATUS_PAGO',        title: 'Marcado como Pago' },
      { id: 'STATUS_SEPARACAO',   title: 'Em separação' },
      { id: 'STATUS_ENTREGA',     title: 'Saiu para entrega' }
      // Se quiser 4, teria que dividir em duas mensagens 
      // ou usar uma lista interativa (list).
      // { id: 'STATUS_CONCLUIDO', title: 'Entregue/Concluído' },
    ];

    const responseData = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    await axios.post(`${apiUrl}/${phoneNumberId}/messages`, responseData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erro ao enviar acompanhamento de pedido:', error?.response?.data || error.message);
  }
}

module.exports = {
  receiveMessage
};
