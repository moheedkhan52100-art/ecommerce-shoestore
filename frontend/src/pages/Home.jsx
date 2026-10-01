import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CreditCard, Heart, Search, ShoppingBag, Trash2, UserRound, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import { getProducts } from "../services/productService";
import { addProductWithinStock, getCartStockMessage, notifyStoreToast, writeCart, writeWishlist } from "../services/storeService";
import ThemeToggle from "../components/ThemeToggle";
import StoreFooter from "../components/StoreFooter";

const homeHeroSlides = [
  {
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=2200&q=90",
    slogan: { lead: "Quiet luxury,", accent: "made to move." },
    tag: "The Khan Edit · 2026",
    description: "Thoughtful footwear & sportswear essentials with a confident point of view. Designed for the days that become memories."
  },
  {
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=2200&q=90",
    slogan: { lead: "A sharper stride,", accent: "every single day." },
    tag: "High-Performance Motion",
    description: "Engineered endurance sneakers and technical training fits crafted with lightweight precision."
  },
  {
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=2200&q=90",
    slogan: { lead: "Designed for", accent: "the long way." },
    tag: "Iconic Street & Sport",
    description: "Timeless court icons and contemporary apparel tailored to elevate your daily rotation."
  }
];

const fallbackImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85";

const productKey = (product) => product._id || product.name;

function Home() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [panel, setPanel] = useState(() => location.state?.openCart ? "cart" : "");
  const [query, setQuery] = useState("");
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("khan-wishlist") || "[]"));
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("khan-cart") || "[]"));
  const [cartNotice, setCartNotice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderMessage, setOrderMessage] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const [checkoutDetails, setCheckoutDetails] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    const loadProducts = () => getProducts()
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Unable to load storefront products", error));

    loadProducts();
    window.addEventListener("focus", loadProducts);
    const refreshTimer = window.setInterval(loadProducts, 5000);
    const handleProductUpdate = () => loadProducts();
    window.addEventListener("storage", handleProductUpdate);
    return () => {
      window.removeEventListener("focus", loadProducts);
      window.clearInterval(refreshTimer);
      window.removeEventListener("storage", handleProductUpdate);
    };
  }, []);

  useEffect(() => {
    if (location.state?.openCart) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  useEffect(() => {
    const sliderTimer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % homeHeroSlides.length);
    }, 5500);
    return () => window.clearInterval(sliderTimer);
  }, []);

  useEffect(() => {
    let frame;
    const updateParallax = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setParallaxY(Math.min(window.scrollY * 0.16, 110)));
    };
    window.addEventListener("scroll", updateParallax, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateParallax);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const collection = products.slice(0, 6);
  const featuredProducts = products.slice(0, 4);

  const cartItems = cart.reduce((items, product) => {
    const existing = items.find((item) => productKey(item.product) === productKey(product));
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ product, quantity: 1 });
    }
    return items;
  }, []);
  const visibleProducts = query
    ? products.filter((product) => product.name?.toLowerCase().includes(query.toLowerCase()))
    : collection;
  const activeSlide = homeHeroSlides[slideIndex];

  const toggleWishlist = (product) => {
    const isSaved = wishlist.some((item) => productKey(item) === productKey(product));
    const nextWishlist = isSaved
      ? wishlist.filter((item) => productKey(item) !== productKey(product))
      : [...wishlist, product];
    setWishlist(nextWishlist);
    writeWishlist(nextWishlist);
    notifyStoreToast(isSaved ? `Removed ${product.name} from your wishlist.` : `Added ${product.name} to your wishlist.`);
  };

  const addToCart = (product) => {
    const result = addProductWithinStock(cart, product);
    if (result.message) {
      setCartNotice(result.message);
      setPanel("cart");
      return false;
    }
    setCart(result.cart);
    writeCart(result.cart);
    setCartNotice("");
    setPanel("cart");
    return true;
  };

  const removeFromWishlist = (product) => {
    const nextWishlist = wishlist.filter((item) => productKey(item) !== productKey(product));
    setWishlist(nextWishlist);
    writeWishlist(nextWishlist);
  };

  const clearWishlist = () => {
    setWishlist([]);
    writeWishlist([]);
  };

  const removeFromCart = (index) => {
    const nextCart = cart.filter((_, itemIndex) => itemIndex !== index);
    setCart(nextCart);
    writeCart(nextCart);
  };

  const changeCartQuantity = (product, change) => {
    const productIndex = cart.findIndex((item) => productKey(item) === productKey(product));
    if (productIndex === -1) return;

    if (change > 0) {
      const result = addProductWithinStock(cart, product);
      if (result.message) {
        setCartNotice(result.message);
        return;
      }
      setCart(result.cart);
      writeCart(result.cart);
      setCartNotice("");
      return;
    }

    removeFromCart(productIndex);
  };

  const clearCart = () => {
    setCart([]);
    writeCart([]);
  };

  const placeOrder = (event) => {
    event.preventDefault();
    const stockMessage = getCartStockMessage(cart);
    if (stockMessage) {
      setCartNotice(stockMessage);
      setPanel("cart");
      return;
    }
    setOrderMessage(`Order placed with ${paymentMethod === "cash" ? "Cash on Delivery" : "Card payment"}.`);
    setCart([]);
    writeCart([]);
  };

  const updateCheckoutDetails = (event) => {
    setCheckoutDetails({ ...checkoutDetails, [event.target.name]: event.target.value });
  };

  const accountTarget = localStorage.getItem("admin") ? "/admin" : localStorage.getItem("user") ? "/user/account" : "";

  const handleStoreLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    localStorage.removeItem("user");
    setAccountOpen(false);
  };

  return (
    <main className="storefront">
      <div className="sale-strip">Khan private sale is live · selected pieces up to 50% off</div>

      <header className="store-header">
        <Link className="brand-lockup" to="/">
          <span className="brand-mark">K</span>
          <span>KHAN</span>
        </Link>

        <nav className="store-nav" aria-label="Store navigation">
          <Link to="/shop">Shop</Link>
          {["Men", "Women", "Kids", "Jordan", "NikeSKIMS", "Sport", "Sportswear"].map((item) => <Link key={item} to={`/shop?audience=${encodeURIComponent(item)}`}>{item}</Link>)}
          <a href="#story">Our story</a>
          {!accountTarget && <Link to="/login">Sign in</Link>}
        </nav>

        <div className="store-actions" aria-label="Store actions">
          <button type="button" aria-label="Search products" title="Search products" onClick={() => setSearchOpen(!searchOpen)}><Search size={18} /></button>
          <button type="button" aria-label="Account and login" title="Account and login" onClick={() => setAccountOpen(!accountOpen)}><UserRound size={18} /></button>
          <button type="button" aria-label="Wishlist" title="Wishlist" onClick={() => setPanel("wishlist")}><Heart size={18} /></button>
          <button type="button" aria-label="Shopping bag and checkout" title="Shopping bag and checkout" onClick={() => setPanel("cart")}><ShoppingBag size={18} /><span className="action-count">{cart.length}</span></button>
          <ThemeToggle />
        </div>
      </header>
      <button className="floating-cart" type="button" aria-label="Open shopping bag" onClick={() => setPanel("cart")}><ShoppingBag size={19} /><span>{cart.length}</span></button>

      {searchOpen && (
        <div className="store-search-panel">
          <div className="search-input-row">
            <Search size={18} />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the Khan collection" />
            <button type="button" aria-label="Close search" onClick={() => { setSearchOpen(false); setQuery(""); }}><X size={18} /></button>
          </div>
          {query && (
            <div className="search-results-panel">
              <p className="search-results-label">Matching shoes</p>
              {visibleProducts.length ? visibleProducts.map((product) => (
                <Link className="search-result-item" to={`/product/${product._id}`} key={productKey(product)} onClick={() => setSearchOpen(false)}>
                  <img src={product.image || fallbackImage} alt={product.name} />
                  <div><strong>{product.name}</strong><span>{product.category || "Khan collection"} · {product.color || "Signature color"} · {product.stock ?? 0} in stock</span></div>
                  <b>{product.price ? `$${product.price}` : "View"}</b>
                </Link>
              )) : <p className="search-result-empty">No shoes found for “{query}”.</p>}
            </div>
          )}
        </div>
      )}

      {accountOpen && (
        <div className="account-menu">
          {accountTarget ? <>
            <Link to={accountTarget} onClick={() => setAccountOpen(false)}>My account</Link>
            <button type="button" onClick={handleStoreLogout}>Logout</button>
          </> : <Link to="/login" onClick={() => setAccountOpen(false)}>Login</Link>}
        </div>
      )}

      {/* High-End Editorial Hero with Background Image Slider */}
      <section className="store-hero" id="new-arrivals" style={{ "--parallax-y": `${parallaxY}px` }}>
        <img
          key={activeSlide.image}
          className="store-hero-image"
          src={activeSlide.image}
          alt={activeSlide.tag}
          onError={(event) => { event.currentTarget.src = fallbackImage; }}
        />
        <div className="store-hero-backdrop-gradient" />
        <motion.div className="store-hero-content" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
          <p className="eyebrow">{activeSlide.tag}</p>
          <h1>
            <span key={activeSlide.slogan.lead} className="hero-slogan">
              {activeSlide.slogan.lead}<br />
              <em>{activeSlide.slogan.accent}</em>
            </span>
          </h1>
          <p>{activeSlide.description}</p>
          <div className="hero-actions-row">
            <a className="store-button" href="#collection">Explore collection <ArrowRight size={17} /></a>
            <Link className="store-sub-button" to="/shop">Shop all styles</Link>
          </div>

          {/* Hero Slide Indicators */}
          <div className="hero-slide-indicators" aria-label="Hero slides">
            {homeHeroSlides.map((slide, idx) => (
              <button
                key={slide.image}
                type="button"
                className={`hero-dot-btn ${idx === slideIndex ? "is-active" : ""}`}
                onClick={() => setSlideIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Brand Story Editorial Section */}
      <section className="store-intro" id="story">
        <div className="store-intro-inner">
          <p className="eyebrow">A Considered Wardrobe</p>
          <h2>Pieces with presence.<br /><em>Made for every day.</em></h2>
          <p>Khan brings together modern silhouettes, rich textures, and enduring materials in a collection designed to stay with you wherever you move.</p>
        </div>
      </section>

      {/* Motion Video Showcase for Men, Women, Kids & Sportswear */}
      <section className="home-motion-showcase" aria-label="Motion Video Collections">
        <div className="collection-heading">
          <div>
            <p className="eyebrow">Visual Motion &amp; Performance</p>
            <h2>Shoes &amp; Sportswear In Motion</h2>
          </div>
          <Link to="/shop" className="home-motion-view-all">
            Explore Full Shop <ArrowRight size={15} />
          </Link>
        </div>

        <div className="home-motion-grid">
          {/* Men Motion Card */}
          <motion.article
            className="home-motion-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <div className="home-motion-video-wrap">
              <video autoPlay muted loop playsInline preload="metadata" className="home-motion-video">
                <source src="/videos/men-shoes.mp4" type="video/mp4" />
              </video>
              <div className="home-motion-overlay" />
            </div>
            <div className="home-motion-content">
              <span className="home-motion-pill">Men&apos;s Edit</span>
              <h3>Men&apos;s Footwear &amp; Active</h3>
              <p>Endurance sneakers, court icons, and engineered training apparel.</p>
              <div className="home-motion-links">
                <Link to="/shop?audience=Men" className="home-motion-btn">
                  Men&apos;s Shoes <ArrowRight size={13} />
                </Link>
                <Link to="/shop?audience=Men" className="home-motion-sub-btn">
                  Sportswear
                </Link>
              </div>
            </div>
          </motion.article>

          {/* Women Motion Card */}
          <motion.article
            className="home-motion-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="home-motion-video-wrap">
              <video autoPlay muted loop playsInline preload="metadata" className="home-motion-video">
                <source src="/videos/women-shoes.mp4" type="video/mp4" />
              </video>
              <div className="home-motion-overlay" />
            </div>
            <div className="home-motion-content">
              <span className="home-motion-pill">Women&apos;s Edit</span>
              <h3>Women&apos;s Footwear &amp; Sculpt</h3>
              <p>Dynamic lightweight runners and contouring activewear sets.</p>
              <div className="home-motion-links">
                <Link to="/shop?audience=Women" className="home-motion-btn">
                  Women&apos;s Shoes <ArrowRight size={13} />
                </Link>
                <Link to="/shop?audience=Women" className="home-motion-sub-btn">
                  Sportswear
                </Link>
              </div>
            </div>
          </motion.article>

          {/* Kids Motion Card */}
          <motion.article
            className="home-motion-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="home-motion-video-wrap">
              <video autoPlay muted loop playsInline preload="metadata" className="home-motion-video">
                <source src="/videos/kids-shoes.mp4" type="video/mp4" />
              </video>
              <div className="home-motion-overlay" />
            </div>
            <div className="home-motion-content">
              <span className="home-motion-pill">Kids&apos; Edit</span>
              <h3>Kids&apos; Play &amp; Sport Shoes</h3>
              <p>Cushioned all-day sneakers and resilient breathable gear.</p>
              <div className="home-motion-links">
                <Link to="/shop?audience=Kids" className="home-motion-btn">
                  Kids&apos; Shoes <ArrowRight size={13} />
                </Link>
                <Link to="/shop?audience=Kids" className="home-motion-sub-btn">
                  Sportswear
                </Link>
              </div>
            </div>
          </motion.article>

          {/* Sportswear Motion Card */}
          <motion.article
            className="home-motion-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="home-motion-video-wrap">
              <video autoPlay muted loop playsInline preload="metadata" className="home-motion-video">
                <source src="/videos/men-sportswear.mp4" type="video/mp4" />
              </video>
              <div className="home-motion-overlay" />
            </div>
            <div className="home-motion-content">
              <span className="home-motion-pill gold">Sportswear Studio</span>
              <h3>Performance Apparel</h3>
              <p>Tracksuits, gym hoodies, moisture-wicking tees, and compression sets.</p>
              <div className="home-motion-links">
                <Link to="/shop?audience=Sportswear" className="home-motion-btn">
                  View Sportswear <ArrowRight size={13} />
                </Link>
                <Link to="/shop" className="home-motion-sub-btn">
                  All Footwear
                </Link>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="featured-carousel" aria-label="Featured shoes">
          <motion.div className="featured-carousel-copy" initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.6 }}>
            <p className="eyebrow">The moving edit</p>
            <h2>One pair.<br /><em>Many directions.</em></h2>
            <p>Our current favorites, selected for movement, texture, and the rhythm of everyday life.</p>
          </motion.div>
          <Swiper className="featured-carousel-swiper" modules={[Autoplay, EffectFade]} effect="fade" loop autoplay={{ delay: 4800, disableOnInteraction: false }}>
            {featuredProducts.map((product) => <SwiperSlide key={productKey(product)}><Link className="featured-carousel-card" to={`/product/${product._id}`}><img className="featured-card-image" src={product.images?.[1] || product.image || fallbackImage} alt={product.name} /><div><span>{product.category || "Khan collection"}</span><strong>{product.name}</strong><b>${product.price}</b></div></Link></SwiperSlide>)}
          </Swiper>
        </section>
      )}

      <section className="collection-section" id="collection">
        <div className="collection-heading">
          <div>
            <p className="eyebrow">Curated for you</p>
            <h2>New arrivals</h2>
          </div>
          <span>{collection.length || 0} pieces</span>
        </div>
        <div className="store-grid">
          {visibleProducts.map((product, index) => (
            <motion.article className={`store-product store-product-${index % 4}`} key={productKey(product)} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, delay: index * 0.04 }} whileHover={{ y: -5 }}>
              <div className="store-product-image-wrap">
                <Link to={`/product/${product._id}`} onClick={() => setSearchOpen(false)}>
                  <img
                    className="store-product-image"
                    src={product.image || fallbackImage}
                    alt={product.name}
                    onError={(event) => { event.currentTarget.src = fallbackImage; }}
                  />
                </Link>
                <button className={`wishlist-button ${wishlist.some((item) => productKey(item) === productKey(product)) ? "is-active" : ""}`} type="button" aria-label={`Add ${product.name} to wishlist`} onClick={() => toggleWishlist(product)}><Heart size={17} fill={wishlist.some((item) => productKey(item) === productKey(product)) ? "currentColor" : "none"} /></button>
              </div>
              <div className="store-product-info">
                <Link to={`/product/${product._id}`} onClick={() => setSearchOpen(false)}>
                  <h3>{product.name}</h3>
                  <p>{product.category || "Khan collection"} · {product.color || "Signature color"} · {product.stock ?? 0} in stock</p>
                </Link>
                {product.price && <strong>${product.price}</strong>}
              </div>
              {product.price && <button className="add-bag-button" type="button" onClick={() => addToCart(product)}>Add to bag</button>}
            </motion.article>
          ))}
          {!visibleProducts.length && <p className="search-empty">{query ? `No shoes found for “${query}”. Try another name.` : "No products have been added yet."}</p>}
        </div>
      </section>

      {panel && (
        <div className="store-drawer-backdrop" onClick={() => setPanel("")}>
          <aside className="store-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-heading">
              <div className="drawer-heading-title">
                <button
                  type="button"
                  className="drawer-back-button"
                  aria-label="Back to store"
                  title="Back to store"
                  onClick={() => setPanel("")}
                >
                  <ArrowLeft size={18} />
                </button>
                <h2>{panel === "cart" ? "Your bag" : "Wishlist"}</h2>
              </div>
              <div className="drawer-heading-actions">
                {panel === "cart" && cart.length > 0 && <button className="clear-drawer-button" type="button" onClick={clearCart}>Clear bag</button>}
                {panel === "wishlist" && wishlist.length > 0 && <button className="clear-drawer-button" type="button" onClick={clearWishlist}>Clear all</button>}
                <button type="button" aria-label="Close panel" onClick={() => setPanel("")}><X size={20} /></button>
              </div>
            </div>
            {cartNotice && <p className="form-error" role="alert">{cartNotice}</p>}
            {(panel === "cart" ? cartItems : wishlist).length ? (panel === "cart" ? cartItems : wishlist).map((item, index) => {
              const product = panel === "cart" ? item.product : item;
              const quantity = panel === "cart" ? item.quantity : 1;
              return (
              <div className="drawer-item" key={`${product._id || product.name}-${index}`}>
                <img src={product.image || fallbackImage} alt={product.name} />
                <div><strong>{product.name}</strong><span>{product.price ? `$${product.price}` : "Khan collection"}</span><small>{panel === "cart" ? `${quantity} in your bag` : "Saved to wishlist"}</small></div>
                <div className="drawer-item-actions">
                  {panel === "cart" && <div className="quantity-controls"><button type="button" onClick={() => changeCartQuantity(product, -1)}>-</button><span>{quantity}</span><button type="button" onClick={() => changeCartQuantity(product, 1)}>+</button></div>}
                  {panel === "wishlist" && <button className="move-to-bag-button" type="button" onClick={() => { if (addToCart(product)) removeFromWishlist(product); }}>Move to bag</button>}
                  <button className="drawer-remove" type="button" aria-label={`Remove ${product.name}`} onClick={() => panel === "cart" ? removeFromCart(cart.findIndex((cartProduct) => productKey(cartProduct) === productKey(product))) : removeFromWishlist(product)}><Trash2 size={16} /></button>
                </div>
              </div>
              );
            }) : <p className="drawer-empty">Nothing here yet. Explore the collection to find your next favorite.</p>}

            {panel === "cart" && cart.length > 0 && (
              <form className="checkout-form" onSubmit={placeOrder}>
                <div className="checkout-total"><span>Total</span><strong>${cartItems.reduce((total, item) => total + Number(item.product.price || 0) * item.quantity, 0).toFixed(2)}</strong></div>
                <p className="checkout-label">Payment method</p>
                <label className="payment-option">
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} />
                  <span>Cash on Delivery</span>
                </label>
                <label className="payment-option">
                  <input type="radio" name="payment" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
                  <CreditCard size={17} />
                  <span>Card payment</span>
                </label>
                <div className="checkout-fields">
                  {paymentMethod === "cash" ? <>
                    <input name="name" type="text" placeholder="Full name" value={checkoutDetails.name} onChange={updateCheckoutDetails} required />
                    <input name="phone" type="tel" placeholder="Phone number" value={checkoutDetails.phone} onChange={updateCheckoutDetails} required />
                    <input className="checkout-wide" name="address" type="text" placeholder="Delivery address" value={checkoutDetails.address} onChange={updateCheckoutDetails} required />
                    <input name="city" type="text" placeholder="City" value={checkoutDetails.city} onChange={updateCheckoutDetails} required />
                    <input name="postalCode" type="text" placeholder="Postal code" value={checkoutDetails.postalCode} onChange={updateCheckoutDetails} required />
                  </> : <>
                    <input name="cardName" type="text" placeholder="Cardholder name" value={checkoutDetails.cardName} onChange={updateCheckoutDetails} required />
                    <input className="checkout-wide" name="cardNumber" type="text" inputMode="numeric" placeholder="Card number" value={checkoutDetails.cardNumber} onChange={updateCheckoutDetails} minLength="12" required />
                    <input name="expiry" type="text" placeholder="MM / YY" value={checkoutDetails.expiry} onChange={updateCheckoutDetails} required />
                    <input name="cvv" type="password" inputMode="numeric" placeholder="CVV" value={checkoutDetails.cvv} onChange={updateCheckoutDetails} minLength="3" required />
                    <input className="checkout-wide" name="address" type="text" placeholder="Billing address" value={checkoutDetails.address} onChange={updateCheckoutDetails} required />
                  </>}
                </div>
                {orderMessage && <p className="order-message">{orderMessage}</p>}
                <button className="checkout-button" type="submit">Place order</button>
              </form>
            )}
          </aside>
        </div>
      )}

      <StoreFooter />
    </main>
  );
}

export default Home;
