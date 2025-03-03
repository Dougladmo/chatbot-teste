const products = [
    { id: '1', name: 'Produto A', price: 10.0 },
    { id: '2', name: 'Produto B', price: 20.0 },
    { id: '3', name: 'Produto C', price: 30.0 }
  ];
  
  function handleTextMessage(text) {
    // Se o texto é "1" -> retornar lista de produtos
    const productList = products.map(p => `${p.id} - ${p.name} (R$${p.price})`).join('\n');
    return `Lista de produtos:\n${productList}\n\nPara adicionar ao carrinho, digite: "adicionar <id>"`;
  }
  
  module.exports = {
    handleTextMessage,
    products
  };
  