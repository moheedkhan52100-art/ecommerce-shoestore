import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, RotateCw, ShoppingBag, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProduct, getProducts } from "../services/productService";
import { addProductWithinStock, notifyStoreToast, readCart, readWishlist, writeCart, writeWishlist } from "../services/storeService";
import ShoeModel from "../components/ShoeModel";
import { useStoreSettings } from "../context/storeSettings";

const fallbackImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85";
const defaultShoeSizes = ["36", "37", "38", "39", "40", "41", "42"];
const defaultSportswearSizes = ["XS", "S", "M", "L", "XL", "XXL"];

const sportswearSizeChart = [
  { size: "XS", chest: "34-36\"", waist: "28-30\"" },
  { size: "S", chest: "36-38\"", waist: "30-32\"" },
  { size: "M", chest: "38-40\"", waist: "32-34\"" },
  { size: "L", chest: "41-43\"", waist: "35-37\"" },
  { size: "XL", chest: "44-47\"", waist: "38-41\"" },
  { size: "XXL", chest: "48-51\"", waist: "42-45\"" }
];

function ProductDetails() {
  const { formatCurrency } = useStoreSettings();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [frame, setFrame] = useState(0);
  const [mediaMode, setMediaMode] = useState("image");
  const [selectedImage, setSelectedImage] = useState("");
  const [review, setReview] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const currentProductId = product?._id;
  const currentProductCategory = product?.category;
  const currentProductAudience = product?.audience;

  useEffect(() => {
    const loadProduct = () => getProduct(id)
      .then((response) => {
        setProduct(response.data);
        setSelectedSize((current) => response.data.sizes?.includes(current) ? current : "");
        setSelectedImage(response.data.image || response.data.images?.[0] || "");
        // Ensure media mode is image if sportswear
        const isSportswear = response.data?.audience === "Sportswear" ||
          response.data?.category?.toLowerCase() === "sportswear" ||
          Boolean(response.data?.sportswearType);
        if (isSportswear) {
          setMediaMode("image");
        }
      })
      .catch((loadError) => setError(loadError.response?.data?.message || "Unable to load product."));

    loadProduct();
    window.addEventListener("focus", loadProduct);
    const handleProductUpdate = () => loadProduct();
    window.addEventListener("storage", handleProductUpdate);
    const refreshTimer = window.setInterval(loadProduct, 5000);

    return () => {
      window.removeEventListener("focus", loadProduct);
      window.removeEventListener("storage", handleProductUpdate);
      window.clearInterval(refreshTimer);
    };
  }, [id]);

  useEffect(() => {
    if (!currentProductId) return;

    let active = true;
    getProducts()
      .then((response) => {
        if (!active) return;
        const alternatives = response.data.filter((item) => item._id !== currentProductId);
        const category = currentProductCategory?.toLowerCase();
        const audience = currentProductAudience?.toLowerCase();
        const similar = alternatives.filter((item) =>
          (category && item.category?.toLowerCase() === category) ||
          (audience && item.audience?.toLowerCase() === audience)
        );
        setRelatedProducts((similar.length ? similar : alternatives).slice(0, 4));
      })
      .catch(() => {
        if (active) setRelatedProducts([]);
      });

    return () => {
      active = false;
    };
  }, [currentProductId, currentProductCategory, currentProductAudience]);

  if (error) {
    return <main className="product-details-page"><p className="detail-error">{error}</p><Link className="account-back-link" to="/">Back to storefront</Link></main>;
  }

  if (!product) {
    return <main className="product-details-page"><p className="loading-state">Loading product...</p></main>;
  }

  const isSportswear = product.audience === "Sportswear" ||
    product.category?.toLowerCase() === "sportswear" ||
    Boolean(product.sportswearType);

  const availableSizes = Array.isArray(product.sizes)
    ? product.sizes
    : (isSportswear ? defaultSportswearSizes : defaultShoeSizes);
  const productImages = [...new Set([product.image, ...(product.images || [])].filter(Boolean))];
  const selectedImageIndex = Math.max(0, productImages.indexOf(selectedImage));
  const activeProductImage = productImages[selectedImageIndex] || fallbackImage;

  const changeProductImage = (direction) => {
    if (productImages.length < 2) return;
    const nextIndex = (selectedImageIndex + direction + productImages.length) % productImages.length;
    setSelectedImage(productImages[nextIndex]);
  };

  const addToBag = (redirectToCart = true) => {
    if (!selectedSize) return false;
    const result = addProductWithinStock(readCart(), { ...product, selectedSize });
    if (result.message) {
      setCartNotice(result.message);
      return false;
    }
    setCartNotice("");
    writeCart(result.cart);
    if (redirectToCart) navigate("/cart");
    return true;
  };

  const buyNow = () => {
    if (addToBag(false)) navigate("/checkout");
  };

  const toggleWishlist = () => {
    const wishlist = readWishlist();
    const exists = wishlist.some((item) => item._id === product._id);
    const nextWishlist = exists ? wishlist.filter((item) => item._id !== product._id) : [...wishlist, product];
    writeWishlist(nextWishlist);
    setSaved(!exists);
    notifyStoreToast(exists ? `Removed ${product.name} from your wishlist.` : `Added ${product.name} to your wishlist.`);
  };

  return (
    <main className="product-details-page">
      <Link className="detail-back-link" to="/">Back to collection</Link>
      <section className="product-details-card">
        <div className="product-gallery">
          {!isSportswear && (
            <div className="media-switcher" role="tablist" aria-label="Product media">
              <button className={mediaMode === "image" ? "is-active" : ""} type="button" role="tab" aria-selected={mediaMode === "image"} onClick={() => setMediaMode("image")}>Product image</button>
              <button className={mediaMode === "model" ? "is-active" : ""} type="button" role="tab" aria-selected={mediaMode === "model"} onClick={() => setMediaMode("model")}>3D model</button>
            </div>
          )}
          <div className={`product-image-layout${(isSportswear || mediaMode === "image") && productImages.length > 1 ? " has-thumbnails" : ""}`}>
            {(isSportswear || mediaMode === "image") && productImages.length > 1 && (
              <div className="product-thumbnails" aria-label="Product images">
                {productImages.map((image, index) => (
                  <button
                    className={selectedImageIndex === index ? "is-active" : ""}
                    type="button"
                    key={image}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Show product image ${index + 1}`}
                    aria-pressed={selectedImageIndex === index}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="product-details-image-stage">
              {!isSportswear && mediaMode === "model" ? (
                <>
                  <ShoeModel color={product.color} frame={frame} modelUrl={product.modelUrl} />
                  <span className="viewer-badge"><RotateCw size={14} /> 360 view</span>
                </>
              ) : (
                <>
                  <img
                    className="product-details-image"
                    src={activeProductImage}
                    alt={`${product.name} product view`}
                    onError={(event) => { event.currentTarget.src = fallbackImage; }}
                  />
                  {productImages.length > 1 && (
                    <div className="product-image-arrows">
                      <button type="button" aria-label="Previous product image" onClick={() => changeProductImage(-1)}>
                        <ChevronLeft size={20} />
                      </button>
                      <button type="button" aria-label="Next product image" onClick={() => changeProductImage(1)}>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {!isSportswear && mediaMode === "model" && (
            <div className="viewer-controls">
              <button type="button" aria-label="Rotate left" onClick={() => setFrame((value) => value - 1)}><ChevronLeft size={18} /></button>
              <span>{Math.abs(frame % 12) * 30}°</span>
              <button type="button" aria-label="Rotate right" onClick={() => setFrame((value) => value + 1)}><ChevronRight size={18} /></button>
            </div>
          )}
        </div>
        <div className="product-details-copy">
          <p className="eyebrow">{isSportswear ? "Khan Sportswear" : "Khan collection"}</p>
          <h1>{product.name}</h1>
          <strong className="product-details-price">{formatCurrency(product.price)}</strong>
          <p className="product-details-description">{product.description || (isSportswear ? "Engineered for movement, performance, and everyday athletic comfort." : "A considered Khan essential, made for everyday movement.")}</p>
          
          <div className="size-selector">
            <div>
              <strong>Select your size {isSportswear ? "(Apparel)" : ""}</strong>
              <span>{product.stock > 0 ? "Available now" : "Sold out"}</span>
            </div>
            <div className="size-options">
              {availableSizes.map((size) => (
                <button
                  className={selectedSize === size ? "is-selected" : ""}
                  type="button"
                  key={size}
                  disabled={product.stock === 0}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            {!availableSizes.length && <p className="form-error">No sizes are currently available for this product.</p>}
            {isSportswear && (
              <div className="sportswear-size-guide-toggle">
                <button
                  type="button"
                  className="size-guide-button"
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                >
                  {showSizeGuide ? "Hide size guide" : "View size & measurement guide"}
                </button>
                {showSizeGuide && (
                  <div className="size-guide-table-wrap">
                    <table className="size-guide-table">
                      <thead>
                        <tr>
                          <th>Size</th>
                          <th>Chest</th>
                          <th>Waist</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sportswearSizeChart.map((row) => (
                          <tr key={row.size} className={selectedSize === row.size ? "is-highlighted" : ""}>
                            <td><strong>{row.size}</strong></td>
                            <td>{row.chest}</td>
                            <td>{row.waist}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {product.fit && <p className="fit-note"><strong>Fit:</strong> {product.fit} fit · True to standard athletic sizing.</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <dl className="product-details-specs">
            <div><dt>Category</dt><dd>{product.category || (isSportswear ? "Sportswear" : "Khan collection")}</dd></div>
            <div><dt>Color</dt><dd>{product.color || "Signature color"}</dd></div>
            {isSportswear && product.sport && <div><dt>Activity</dt><dd>{product.sport}</dd></div>}
            {isSportswear && product.sportswearType && <div><dt>Product type</dt><dd>{product.sportswearType}</dd></div>}
            {isSportswear && product.fit && <div><dt>Fit</dt><dd>{product.fit}</dd></div>}
            {isSportswear && product.material && <div><dt>Material</dt><dd>{product.material}</dd></div>}
            <div><dt>Availability</dt><dd>{product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}</dd></div>
          </dl>
          <div className="detail-actions">
            <button className="detail-add-button" type="button" disabled={product.stock === 0 || !selectedSize} onClick={addToBag}><ShoppingBag size={17} /> Add to bag</button>
            <button className="detail-buy-button" type="button" disabled={product.stock === 0 || !selectedSize} onClick={buyNow}>Buy now</button>
            <button className={`detail-wishlist-button ${saved ? "is-saved" : ""}`} type="button" onClick={toggleWishlist} aria-label="Add to wishlist"><Heart size={18} fill={saved ? "currentColor" : "none"} /></button>
          </div>
          {cartNotice && <p className="form-error" role="alert">{cartNotice}</p>}
          <section className="reviews-section"><div className="reviews-heading"><h2>Reviews</h2><span><Star size={15} fill="currentColor" /> 4.8 · 24 reviews</span></div><div className="review-card"><strong>"The pair I reach for every day."</strong><span>Verified Khan customer</span></div><form className="review-form" onSubmit={(event) => { event.preventDefault(); setReview(""); }}><input value={review} onChange={(event) => setReview(event.target.value)} placeholder="Share your experience" /><button type="submit" aria-label="Submit review">Post</button></form></section>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="product-recommendations" aria-label="Recommended products">
          <div className="product-recommendations-heading">
            <div>
              <p className="eyebrow">Picked for you</p>
              <h2>You May Also Like</h2>
            </div>
            <Link to="/shop">Explore all</Link>
          </div>
          <div className="product-recommendations-grid">
            {relatedProducts.map((item) => (
              <article className="product-recommendation-card" key={item._id}>
                <Link to={`/product/${item._id}`} className="product-recommendation-image">
                  <img
                    src={item.image || item.images?.[0] || fallbackImage}
                    alt={item.name}
                    onError={(event) => { event.currentTarget.src = fallbackImage; }}
                  />
                </Link>
                <div className="product-recommendation-meta">
                  <div>
                    <h3><Link to={`/product/${item._id}`}>{item.name}</Link></h3>
                    <p>{item.category || "Khan collection"}</p>
                  </div>
                  <strong>{formatCurrency(item.price || 0)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ProductDetails;
