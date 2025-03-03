const { products } = require('./productService');

// "banco" em memória para guardar carrinhos
const carts = {};
// Exemplo do formato:
// carts["5511999999999"] = [ { productId: '2', qty: 1 }, ... ]

function updateCart(userPhone, productId) {
  // Se não passar productId, apenas retorna o carrinho atual
  if (!productId) {
    if (!carts[userPhone] || carts[userPhone].length === 0) {
      return 'Seu carrinho está vazio.';
    }
    let msg = 'Seu carrinho:\n';
    carts[userPhone].forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      msg += `- ${prod.name} (R$${prod.price}) x ${item.qty}\n`;
    });
    return msg;
  }

  // Se passar productId, adiciona ou incrementa no carrinho
  if (!carts[userPhone]) {
    carts[userPhone] = [];
  }
  const existingItem = carts[userPhone].find(
    item => item.productId === productId
  );
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    carts[userPhone].push({ productId, qty: 1 });
  }

  const prod = products.find(p => p.id === productId);
  if (!prod) return 'Produto não encontrado. Verifique o ID.';

  return `Adicionado ao carrinho: ${prod.name}`;
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
