const { products } = require('./products');

function getAllProducts() {
  return Object.values(products).flat();
}

async function sendCatalogImage(phoneNumberId, to, imageUrl, caption) {
  try {
    const responseData = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'image',
      image: {
        link: imageUrl,   
        caption: caption  
      }
    };

    await axios.post(
      `https://graph.facebook.com/v15.0/${phoneNumberId}/messages`,
      responseData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Seu token da Cloud API
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao enviar imagem do catálogo:', error?.response?.data || error.message);
  }
}

module.exports = { getAllProducts, sendCatalogImage, products };