const test = require("node:test");
const assert = require("node:assert/strict");

const Product = require("../config/models/Product");
const { listProductReviews } = require("../config/controllers/adminController");

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

test("listProductReviews returns reviews with product information newest first", async (t) => {
  const originalFind = Product.find;
  const newestDate = new Date("2026-10-05T10:00:00Z");
  const olderDate = new Date("2026-10-04T10:00:00Z");
  let filter;

  t.after(() => {
    Product.find = originalFind;
  });

  Product.find = (query) => {
    filter = query;
    return {
      select(fields) {
        assert.equal(fields, "name reviews");
        return this;
      },
      sort: async (sortOrder) => {
        assert.deepEqual(sortOrder, { updatedAt: -1 });
        return [
          {
            _id: "product-1",
            name: "Khan Runner",
            reviews: [
              { _id: "review-old", text: "Good", rating: 4, author: "Customer", createdAt: olderDate },
              { _id: "review-new", text: "Excellent", rating: 5, author: "Customer", createdAt: newestDate }
            ]
          }
        ];
      }
    };
  };

  const response = createResponse();
  await listProductReviews({}, response);

  assert.deepEqual(filter, { "reviews.0": { $exists: true } });
  assert.deepEqual(response.body.map((review) => review.id), ["review-new", "review-old"]);
  assert.equal(response.body[0].productName, "Khan Runner");
  assert.equal(response.body[0].rating, 5);
});
