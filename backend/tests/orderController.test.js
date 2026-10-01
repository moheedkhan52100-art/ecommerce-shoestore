const test = require('node:test');
const assert = require('node:assert/strict');

const Order = require('../config/models/Order');
const Product = require('../config/models/Product');
const { createOrder } = require('../config/controllers/orderController');

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('createOrder stores catalog prices and calculates its total on the server', async (t) => {
  const originalFind = Product.find;
  const originalFindOneAndUpdate = Product.findOneAndUpdate;
  const originalCreate = Order.create;
  const productId = '64b000000000000000000001';
  const catalogProduct = {
    _id: productId,
    name: 'Catalog shoe',
    image: '/catalog-shoe.jpg',
    price: 49.99,
    stock: 8,
    sizes: ['M']
  };

  t.after(() => {
    Product.find = originalFind;
    Product.findOneAndUpdate = originalFindOneAndUpdate;
    Order.create = originalCreate;
  });

  Product.find = () => ({ select: async () => [catalogProduct] });
  Product.findOneAndUpdate = async () => catalogProduct;
  Order.create = async (order) => order;

  const response = createResponse();
  await createOrder({
    user: { id: productId, email: 'customer@example.com' },
    body: {
      items: [{ product: { _id: productId, name: 'Tampered name', price: 0 }, quantity: 2, size: 'M' }],
      total: 0,
      shipping: { name: ' Customer ', address: ' 1 Main St ', city: 'Town', postalCode: '12345' },
      paymentMethod: 'cash'
    }
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.total, 99.98);
  assert.equal(response.body.items[0].price, 49.99);
  assert.equal(response.body.items[0].name, 'Catalog shoe');
  assert.equal(response.body.items[0].image, '/catalog-shoe.jpg');
  assert.equal(response.body.shipping.name, 'Customer');
});

test('createOrder rejects card payments without a payment processor', async () => {
  const response = createResponse();
  await createOrder({ body: { items: [{}], paymentMethod: 'card' } }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /cash on delivery/i);
});