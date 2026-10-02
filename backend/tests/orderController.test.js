const test = require('node:test');
const assert = require('node:assert/strict');

const Order = require('../config/models/Order');
const Product = require('../config/models/Product');
const AdminLog = require('../config/models/AdminLog');
const emailService = require('../config/services/emailService');
const { createOrder } = require('../config/controllers/orderController');
const { setOrderStatus } = require('../config/controllers/adminController');
const { updateProduct } = require('../config/controllers/productController');

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

test('admin can persist Paid as an order status', async (t) => {
  const originalFindById = Order.findById;
  const originalFindByIdAndUpdate = Order.findByIdAndUpdate;
  const originalCreateLog = AdminLog.create;
  const originalSendOrderStatusEmail = emailService.sendOrderStatusEmail;
  const orderId = '64b000000000000000000001';
  const paidOrder = { _id: orderId, status: 'Paid', email: 'customer@example.com', total: 49.99 };
  const sentEmails = [];

  t.after(() => {
    Order.findById = originalFindById;
    Order.findByIdAndUpdate = originalFindByIdAndUpdate;
    AdminLog.create = originalCreateLog;
    emailService.sendOrderStatusEmail = originalSendOrderStatusEmail;
  });

  Order.findById = async () => ({ ...paidOrder, status: 'Pending' });
  Order.findByIdAndUpdate = () => ({
    populate() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(paidOrder).then(resolve, reject);
    }
  });
  AdminLog.create = async (entry) => entry;
  emailService.sendOrderStatusEmail = async (...args) => sentEmails.push(args);

  const response = createResponse();
  await setOrderStatus({
    params: { id: orderId },
    body: { status: 'Paid' },
    admin: { email: 'admin@example.com' }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'Paid');
  assert.deepEqual(sentEmails, [[paidOrder, 'Pending']]);
  await new Order({ email: 'customer@example.com', total: 49.99, status: response.body.status }).validate();
});

test('product update keeps an explicitly empty size list', async (t) => {
  const originalFindById = Product.findById;
  const originalFindByIdAndUpdate = Product.findByIdAndUpdate;
  const originalCreateLog = AdminLog.create;
  const productId = '64b000000000000000000001';
  const previousProduct = { _id: productId, name: 'Catalog shoe', sizes: ['42'] };
  let savedPayload;

  t.after(() => {
    Product.findById = originalFindById;
    Product.findByIdAndUpdate = originalFindByIdAndUpdate;
    AdminLog.create = originalCreateLog;
  });

  Product.findById = async () => previousProduct;
  Product.findByIdAndUpdate = async (id, payload) => {
    savedPayload = payload;
    return { ...previousProduct, ...payload };
  };
  AdminLog.create = async (entry) => entry;

  const response = createResponse();
  await updateProduct({ params: { id: productId }, body: { sizes: '[]' } }, response);

  assert.deepEqual(savedPayload.sizes, []);
  assert.deepEqual(response.body.sizes, []);
});