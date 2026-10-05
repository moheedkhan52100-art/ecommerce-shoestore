const publicMediaUrl = (req, value) => {
  if (typeof value !== "string" || !value) return value;

  let mediaUrl;
  try {
    mediaUrl = new URL(value, `${req.protocol}://${req.get("host")}`);
  } catch {
    return value;
  }

  if (!mediaUrl.pathname.startsWith("/uploads/")) return value;
  return `${req.protocol}://${req.get("host")}${mediaUrl.pathname}${mediaUrl.search}${mediaUrl.hash}`;
};

const normalizeProductMedia = (product, req) => {
  const data = typeof product.toObject === "function" ? product.toObject() : { ...product };
  data.image = publicMediaUrl(req, data.image);
  data.images = Array.isArray(data.images)
    ? data.images.map((image) => publicMediaUrl(req, image))
    : data.images;
  data.modelUrl = publicMediaUrl(req, data.modelUrl);
  return data;
};

const normalizeOrderMedia = (order, req) => {
  const data = typeof order.toObject === "function" ? order.toObject() : { ...order };
  if (Array.isArray(data.items)) {
    data.items = data.items.map((item) => ({
      ...item,
      image: publicMediaUrl(req, item.image)
    }));
  }
  return data;
};

module.exports = { normalizeProductMedia, normalizeOrderMedia, publicMediaUrl };
