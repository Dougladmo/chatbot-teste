const { products } = require('./products');

// "banco" em memória para guardar carrinhos
const carts = {};
// Exemplo do formato:
// carts["5511999999999"] = [ { productId: '2', qty: 1 }, ... ]

function updateCart(userPhone, productId, quantity) { // Adicione quantity como parâmetro
  if (!productId) {
    if (!carts[userPhone] || carts[userPhone].length === 0) {
      return 'Seu carrinho está vazio.';
    }
    let msg = '📦 *Seu Carrinho:*\n\n';
    let total = 0;
    
    carts[userPhone].forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const itemTotal = prod.price * item.qty;
        msg += `➤ ${prod.name} (ID: ${prod.id})\n`;
        msg += `   Quantidade: ${item.qty} x R$${prod.price} = R$${itemTotal.toFixed(2)}\n\n`;
        total += itemTotal;
      }
    });
    
    msg += `💵 *Subtotal:* R$${total.toFixed(2)}`;
    return msg;
  }

  if (!carts[userPhone]) carts[userPhone] = [];
  const existingItem = carts[userPhone].find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.qty += quantity;
  } else {
    carts[userPhone].push({ productId, qty: quantity });
  }

  const prod = products.find(p => p.id === productId);
  return `✅ *${quantity}x ${prod.name}* adicionado(s) ao carrinho!`;
}

function finalizePurchase(userPhone) {
  if (!carts[userPhone] || carts[userPhone].length === 0) {
    return 'Não há itens no carrinho para finalizar.';
  }
  let total = 0;
  carts[userPhone].forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    total += prod.price * item.qty;
  });
  // Zera o carrinho
  carts[userPhone] = [];
  return `Compra finalizada! Total: R$${total.toFixed(2)}.\nObrigado!`;
}

module.exports = {
  updateCart,
  finalizePurchase
};
