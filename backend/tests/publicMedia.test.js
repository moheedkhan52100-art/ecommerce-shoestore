const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeOrderMedia, normalizeProductMedia, publicMediaUrl } = require("../config/utils/publicMedia");

const request = {
  protocol: "https",
  get: (header) => header === "host" ? "store.example.ngrok-free.dev" : undefined
};

test("publicMediaUrl serves legacy localhost uploads from the current public host", () => {
  assert.equal(
    publicMediaUrl(request, "http://localhost:5000/uploads/shoe.jpg"),
    "https://store.example.ngrok-free.dev/uploads/shoe.jpg"
  );
});

test("publicMediaUrl keeps remote media URLs unchanged", () => {
  const imageUrl = "https://images.example.com/shoe.jpg";
  assert.equal(publicMediaUrl(request, imageUrl), imageUrl);
});

test("normalizeProductMedia updates product, gallery, and model upload URLs", () => {
  const product = normalizeProductMedia({
    image: "/uploads/cover.jpg",
    images: ["http://localhost:5000/uploads/gallery.jpg"],
    modelUrl: "http://localhost:5000/uploads/model.glb"
  }, request);

  assert.equal(product.image, "https://store.example.ngrok-free.dev/uploads/cover.jpg");
  assert.deepEqual(product.images, ["https://store.example.ngrok-free.dev/uploads/gallery.jpg"]);
  assert.equal(product.modelUrl, "https://store.example.ngrok-free.dev/uploads/model.glb");
});

test("normalizeOrderMedia makes stored localhost order images public", () => {
  const order = normalizeOrderMedia({
    items: [{ image: "http://localhost:5000/uploads/order-shoe.jpg" }]
  }, request);

  assert.equal(order.items[0].image, "https://store.example.ngrok-free.dev/uploads/order-shoe.jpg");
});
