export const productKey = (product) => `${product._id || product.name || "item"}${product.selectedSize ? `-${product.selectedSize}` : ""}`;

export const readCart = () => JSON.parse(localStorage.getItem("khan-cart") || "[]");
export const readWishlist = () => JSON.parse(localStorage.getItem("khan-wishlist") || "[]");
const notifyStoreDataUpdated = () => window.dispatchEvent(new Event("store-data-updated"));

export const getProductStockMessage = (cart, product, quantityToAdd = 1) => {
  const stock = Number(product.stock);
  const identity = product._id || product.name;
  const productQuantity = cart.filter((item) => (item._id || item.name) === identity).length;

  if (!Number.isFinite(stock) || productQuantity + quantityToAdd <= stock) return "";
  if (productQuantity >= stock) {
    return `${product.name} is at its stock limit (${stock} available).`;
  }

  const remaining = stock - productQuantity;
  return `Only ${remaining} more ${product.name} ${remaining === 1 ? "is" : "are"} available.`;
};

export const getCartStockMessage = (cart) => {
  const quantities = new Map();
  cart.forEach((item) => {
    const identity = item._id || item.name;
    const entry = quantities.get(identity) || { product: item, quantity: 0 };
    entry.quantity += 1;
    quantities.set(identity, entry);
  });

  for (const { product, quantity } of quantities.values()) {
    const stock = Number(product.stock);
    if (Number.isFinite(stock) && quantity > stock) {
      return `Your bag has ${quantity} ${product.name}, but only ${stock} ${stock === 1 ? "is" : "are"} available.`;
    }
  }

  return "";
};

export const addProductWithinStock = (cart, product) => {
  const message = getProductStockMessage(cart, product);
  return message ? { cart, message } : { cart: [...cart, product], message: "" };
};

export const writeCart = (cart) => {
  localStorage.setItem("khan-cart", JSON.stringify(cart));
  notifyStoreDataUpdated();
};

export const writeWishlist = (wishlist) => {
  localStorage.setItem("khan-wishlist", JSON.stringify(wishlist));
  notifyStoreDataUpdated();
};

export const groupedCart = (cart) => cart.reduce((items, product) => {
  const existing = items.find((item) => productKey(item.product) === productKey(product));
  if (existing) existing.quantity += 1;
  else items.push({ product, quantity: 1 });
  return items;
}, []);

export const cartTotal = (cart) => groupedCart(cart).reduce(
  (total, item) => total + Number(item.product.price || 0) * item.quantity,
  0
);

export const createOrder = (order) => fetch("http://localhost:5000/api/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`
  },
  body: JSON.stringify(order)
}).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to place order");
  return data;
});
