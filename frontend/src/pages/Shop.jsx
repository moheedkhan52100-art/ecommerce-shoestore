import { useEffect, useState, useMemo, useRef } from "react";
import {
  ArrowUpDown,
  Heart,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ShoppingBag
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getProducts } from "../services/productService";
import { notifyStoreToast, productKey, readWishlist, writeWishlist } from "../services/storeService";
import { getCategories } from "../services/adminService";
import { useStoreSettings } from "../context/storeSettings";

const fallbackImage =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85";

// Video Playlist for "All" view with automatic rotation
const allVideosPlaylist = [
  {
    key: "men-shoes",
    title: "Men's Footwear Motion",
    tagline: "High-Performance Footwear & Street Mastery",
    description:
      "Engineered for endurance and street elegance. Discover premium athletic shoes and court icons.",
    src: "/videos/men-shoes.mp4",
    mode: "shoes",
    categoryLabel: "Men's Shoes"
  },
  {
    key: "women-shoes",
    title: "Women's Footwear Motion",
    tagline: "Graceful Energy & Dynamic Silhouettes",
    description:
      "Curated athletic footwear and sculpted designs designed for all-day agility and modern comfort.",
    src: "/videos/women-shoes.mp4",
    mode: "shoes",
    categoryLabel: "Women's Shoes"
  },
  {
    key: "kids-shoes",
    title: "Kids' Footwear Motion",
    tagline: "Built For Play & Lightweight Agility",
    description:
      "High-energy sneakers and flexible soles ready for the playground and young athletes.",
    src: "/videos/kids-shoes.mp4",
    mode: "shoes",
    categoryLabel: "Kids' Shoes"
  },
  {
    key: "men-sportswear",
    title: "Men's Performance Sportswear",
    tagline: "Engineered Speed & Technical Fits",
    description:
      "Moisture-wicking tracksuits, compression sets, running tees, and technical training gear.",
    src: "/videos/men-sportswear.mp4",
    mode: "sportswear",
    categoryLabel: "Men's Sportswear"
  },
  {
    key: "women-sportswear",
    title: "Women's Activewear In-Motion",
    tagline: "Sculpted Support & Seamless Form",
    description:
      "Body-contouring activewear sets, training tops, and flexible lifestyle pieces.",
    src: "/videos/women-sportswear.mp4",
    mode: "sportswear",
    categoryLabel: "Women's Sportswear"
  },
  {
    key: "kids-sportswear",
    title: "Kids' Active Playwear",
    tagline: "Resilient Movement & Breathable Sets",
    description:
      "Lightweight, flexible training and play sets designed for active movement and fun.",
    src: "/videos/kids-sportswear.mp4",
    mode: "sportswear",
    categoryLabel: "Kids' Sportswear"
  }
];

// Video Mapping for Men, Women, Kids shoes and sportswear
const audienceVideoConfig = {
  Men: {
    shoesVideo: "/videos/3.mp4",
    sportswearVideo: "/videos/men-sportswear.mp4",
    title: "Men's Collection",
    tagline: "High-Performance Footwear & Precision Sportswear",
    description:
      "Engineered for endurance and street elegance. Discover premium athletic shoes and technical training apparel."
  },
  Women: {
    shoesVideo: "/videos/women-shoes.mp4",
    sportswearVideo: "/videos/women-sportswear.mp4",
    title: "Women's Collection",
    tagline: "Graceful Energy. Dynamic Silhouettes in Motion",
    description:
      "Curated athletic footwear and sculpted activewear designed for all-day agility and modern comfort."
  },
  Kids: {
    shoesVideo: "/videos/kids-shoes.mp4",
    sportswearVideo: "/videos/kids-sportswear.mp4",
    title: "Kids' Collection",
    tagline: "Built For Play. Lightweight Agility & Durability",
    description:
      "High-energy sneakers and flexible, breathable sportswear ready for the playground and sports days."
  },
  Sportswear: {
    shoesVideo: "/videos/men-sportswear.mp4",
    sportswearVideo: "/videos/women-sportswear.mp4",
    title: "Sportswear & Performance",
    tagline: "Breathable Speed. Technical Training Sets",
    description:
      "Moisture-wicking tracksuits, compression fits, running tees, and hoodies tailored for men, women, and kids."
  },
  Jordan: {
    shoesVideo: "/videos/2.mp4",
    sportswearVideo: "/videos/men-sportswear-alt.mp4",
    title: "Jordan Heritage Series",
    tagline: "Iconic Flight. Court Precision Meets Luxury",
    description: "Legendary court sneakers and modern streetwear crafted with heritage leather details."
  },
  NikeSKIMS: {
    shoesVideo: "/videos/women-shoes-alt.mp4",
    sportswearVideo: "/videos/women-sportswear-alt.mp4",
    title: "NikeSKIMS Modern Active",
    tagline: "Seamless Form. Sculpted Support in Action",
    description: "Exclusive body-contouring sportswear and lightweight lifestyle footwear."
  },
  Sport: {
    shoesVideo: "/videos/men-sportswear-alt.mp4",
    sportswearVideo: "/videos/1.mp4",
    title: "Pro Athletic & Training",
    tagline: "Competitive Edge. Engineered For Every Activity",
    description: "High-traction running shoes, gym training gear, and sport-specific apparel."
  },
  All: {
    shoesVideo: "/videos/men-shoes.mp4",
    sportswearVideo: "/videos/women-sportswear.mp4",
    title: "Complete Store Collection",
    tagline: "Footwear Mastery & Performance Sportswear",
    description: "Browse our entire catalog of curated sneakers, boots, apparel, and training sets."
  }
};

const audienceAliases = {
  Men: ["men", "mens", "male", "man"],
  Women: ["women", "womens", "female", "woman"],
  Kids: ["kids", "kid", "children", "child", "boys", "girls", "baby"],
  Jordan: ["jordan"],
  NikeSKIMS: ["nikeskims", "skims"],
  Sport: ["sport"],
  Sportswear: ["sportswear", "hoodie", "track suit", "t-shirt", "shorts", "leggings", "jacket"]
};

const productBelongsToAudience = (product, targetAudience) => {
  if (targetAudience === "All") return true;
  const searchText = [product.audience, product.category, product.name, product.sportswearType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  return (audienceAliases[targetAudience] || [targetAudience.toLowerCase()]).some((alias) =>
    searchText.includes(alias)
  );
};

const isSportswearItem = (product) => {
  return (
    product.audience === "Sportswear" ||
    Boolean(product.sportswearType) ||
    Boolean(product.sport) ||
    ["sportswear", "apparel", "clothing", "hoodie", "track suit", "t-shirt", "shorts", "jacket", "leggings"].some(
      (kw) =>
        (product.category || "").toLowerCase().includes(kw) ||
        (product.name || "").toLowerCase().includes(kw)
    )
  );
};

function Shop() {
  const { formatCurrency } = useStoreSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("500");
  const [itemTypeFilter, setItemTypeFilter] = useState("All"); // All | Shoes | Sportswear
  const [size, setSize] = useState("All");
  const [sport, setSport] = useState("All");
  const [sportswearType, setSportswearType] = useState("All");
  const [fit, setFit] = useState("All");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [wishlist, setWishlist] = useState(readWishlist);
  const [sortBy, setSortBy] = useState("featured");

  // Playlist index for rotating all videos
  const [allVideoIndex, setAllVideoIndex] = useState(0);

  useEffect(() => {
    const loadProducts = () =>
      getProducts()
        .then((response) => setProducts(response.data))
        .catch(() => setProducts([]));

    loadProducts();
    window.addEventListener("focus", loadProducts);
    window.addEventListener("storage", loadProducts);
    const refreshTimer = window.setInterval(loadProducts, 5000);

    return () => {
      window.removeEventListener("focus", loadProducts);
      window.removeEventListener("storage", loadProducts);
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const loadCategories = () => getCategories().then(({ data }) => setCatalogCategories(data.map((item) => item.name))).catch(() => setCatalogCategories([]));
    loadCategories();
    window.addEventListener("focus", loadCategories);
    const refreshTimer = window.setInterval(loadCategories, 5000);
    return () => { window.removeEventListener("focus", loadCategories); window.clearInterval(refreshTimer); };
  }, []);

  const audience = searchParams.get("audience") || "All";

  useEffect(() => {
    if (!searchParams.has("focusSearch")) return;
    searchInputRef.current?.focus({ preventScroll: true });
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams]);

  const audiences = ["All", "Men", "Women", "Kids", "Jordan", "NikeSKIMS", "Sport", "Sportswear"];
  const categories = ["All", ...new Set([...catalogCategories, ...products.map((product) => product.category).filter(Boolean)])];

  // Video config for current section
  const isAllAudience = audience === "All";
  const activePlaylistItem = allVideosPlaylist[allVideoIndex];

  const currentVideoConfig = audienceVideoConfig[audience] || audienceVideoConfig.All;
  const isSportswearAudience = audience === "Sportswear" || audience === "Sport";
  const currentVideoSrc = isAllAudience
    ? activePlaylistItem.src
    : isSportswearAudience
    ? currentVideoConfig.sportswearVideo
    : currentVideoConfig.shoesVideo;

  const currentHeroTitle = isAllAudience ? activePlaylistItem.title : currentVideoConfig.title;
  const currentHeroTagline = isAllAudience ? activePlaylistItem.tagline : currentVideoConfig.tagline;
  const currentHeroDesc = isAllAudience ? activePlaylistItem.description : currentVideoConfig.description;

  const sportswearProducts = useMemo(
    () => products.filter((p) => isSportswearItem(p)),
    [products]
  );
  const sportswearSizes = [
    "All",
    ...new Set(sportswearProducts.flatMap((product) => product.sizes || []).filter(Boolean))
  ];
  const sports = ["All", ...new Set(sportswearProducts.map((product) => product.sport).filter(Boolean))];
  const sportswearTypes = [
    "All",
    ...new Set(sportswearProducts.map((product) => product.sportswearType).filter(Boolean))
  ];
  const fits = ["All", ...new Set(sportswearProducts.map((product) => product.fit).filter(Boolean))];
  const sportswearFiltersActive = audience === "Sportswear" || itemTypeFilter === "Sportswear";

  // Main filtered products
  const visible = products.filter((product) => {
    const searchableText = [
      product.name,
      product.description,
      product.category,
      product.audience,
      product.color,
      product.sport,
      product.sportswearType,
      product.fit,
      ...(product.sizes || [])
    ].filter(Boolean).join(" ").toLowerCase();
    const queryTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matchesQuery = queryTerms.every((term) => searchableText.includes(term));
    const matchesCategory = category === "All" || product.category === category;
    const matchesAudience = productBelongsToAudience(product, audience);
    const isApparel = isSportswearItem(product);

    if (itemTypeFilter === "Shoes" && isApparel) return false;
    if (itemTypeFilter === "Sportswear" && !isApparel) return false;

    const matchesSportswearOptions =
      !sportswearFiltersActive ||
      ((size === "All" || product.sizes?.includes(size)) &&
        (sport === "All" || product.sport === sport) &&
        (sportswearType === "All" || product.sportswearType === sportswearType) &&
        (fit === "All" || product.fit === fit) &&
        (!inStockOnly || Number(product.stock) > 0));

    return (
      matchesQuery &&
      matchesCategory &&
      matchesAudience &&
      matchesSportswearOptions &&
      Number(product.price || 0) <= Number(maxPrice)
    );
  }).sort((productA, productB) => {
    if (sortBy === "price-low") return Number(productA.price) - Number(productB.price);
    if (sortBy === "price-high") return Number(productB.price) - Number(productA.price);
    if (sortBy === "name") return productA.name.localeCompare(productB.name);
    return 0;
  });

  // Cross-Suggestions & Recommendations logic
  const suggestedShoes =
    audience === "Sportswear"
      ? products.filter((p) => !isSportswearItem(p)).slice(0, 4)
      : products
          .filter((p) => !isSportswearItem(p) && productBelongsToAudience(p, audience))
          .slice(0, 4);

  const matchedAudienceSportswear = products.filter(
    (p) => isSportswearItem(p) && productBelongsToAudience(p, audience)
  );
  const suggestedSportswear =
    audience === "Sportswear"
      ? products.filter((p) => isSportswearItem(p)).slice(0, 4)
      : matchedAudienceSportswear.length > 0
      ? matchedAudienceSportswear.slice(0, 4)
      : sportswearProducts.slice(0, 4);

  const toggleWishlist = (product) => {
    const isSaved = wishlist.some((item) => productKey(item) === productKey(product));
    const next = isSaved
      ? wishlist.filter((item) => productKey(item) !== productKey(product))
      : [...wishlist, product];
    setWishlist(next);
    writeWishlist(next);
    notifyStoreToast(isSaved ? `Removed ${product.name} from your wishlist.` : `Added ${product.name} to your wishlist.`);
  };

  const openProductDetails = (product) => navigate(`/product/${product._id}`);

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setMaxPrice("500");
    setItemTypeFilter("All");
    setSize("All");
    setSport("All");
    setSportswearType("All");
    setFit("All");
    setInStockOnly(false);
    setSortBy("featured");
  };

  const selectAudience = (next) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === "All") nextParams.delete("audience");
    else nextParams.set("audience", next);
    setSearchParams(nextParams);
  };

  return (
    <main className="shop-page">

      {/* ========================================================
          BACKGROUND VIDEO ANIMATION HERO BANNER
          (Men, Women, Kids shoes & Sportswear background animation)
          ======================================================== */}
      <section className="shop-video-hero" aria-label="Audience Motion Showcase">
        <video
          key={isAllAudience ? `all-${allVideoIndex}` : `${audience}-${currentVideoSrc}`}
          className="shop-hero-video-bg"
          autoPlay
          muted
          loop={!isAllAudience}
          playsInline
          preload="metadata"
          onEnded={() => {
            if (isAllAudience) {
              setAllVideoIndex((prev) => (prev + 1) % allVideosPlaylist.length);
            }
          }}
        >
          <source src={currentVideoSrc} type="video/mp4" />
          <source src={currentVideoSrc} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>

        {/* Cinematic Gradient Overlays */}
        <div className="shop-video-overlay" />

        {/* Hero Content on top of background video */}
        <div className="shop-video-content">
          <h1 className="shop-video-title">{currentHeroTitle}</h1>
          <p className="shop-video-tagline">{currentHeroTagline}</p>
          <p className="shop-video-desc">{currentHeroDesc}</p>

        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="shop-toolbar">
        <label className="shop-search">
          <Search size={17} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${audience === "All" ? "all catalog" : `${audience.toLowerCase()} shoes & gear`}`}
          />
        </label>

        <label>
          <span>Store section</span>
          <select value={audience} onChange={(event) => selectAudience(event.target.value)}>
            {audiences.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Product type</span>
          <select value={itemTypeFilter} onChange={(e) => setItemTypeFilter(e.target.value)}>
            <option value="All">All Items (Shoes & Apparel)</option>
            <option value="Shoes">Footwear & Shoes Only</option>
            <option value="Sportswear">Sportswear Apparel Only</option>
          </select>
        </label>

        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Max price</span>
          <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
            <option value="150">{formatCurrency(150)}</option>
            <option value="300">{formatCurrency(300)}</option>
            <option value="500">{formatCurrency(500)}</option>
            <option value="10000">Any price</option>
          </select>
        </label>

        <SlidersHorizontal size={18} className="toolbar-icon-indicator" />
      </section>

      {/* Sportswear Specific Filter Strip */}
      {sportswearFiltersActive && (
        <section className="sportswear-shop-filters" aria-label="Sportswear filters">
          <div>
            <p className="eyebrow">Sportswear Specs</p>
            <h2>Performance & Fit Filter</h2>
          </div>
          <label>
            <span>Activity</span>
            <select value={sport} onChange={(event) => setSport(event.target.value)}>
              {sports.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Product type</span>
            <select
              value={sportswearType}
              onChange={(event) => setSportswearType(event.target.value)}
            >
              {sportswearTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Fit</span>
            <select value={fit} onChange={(event) => setFit(event.target.value)}>
              {fits.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Size</span>
            <select value={size} onChange={(event) => setSize(event.target.value)}>
              {sportswearSizes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="stock-filter">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
            />{" "}
            In stock only
          </label>
        </section>
      )}

      {/* Main Results Header */}
      <div className="shop-results-heading">
        <div>
          <p className="shop-result-count">
            {visible.length} {visible.length === 1 ? "item" : "items"} available
          </p>
          <span>{query ? `Search results for “${query}”` : `${audience} catalog selection`}</span>
        </div>
        <div className="shop-results-tools">
          <label className="shop-sort-control">
            <ArrowUpDown size={15} />
            <span className="visually-hidden">Sort products</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products">
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to high</option>
              <option value="price-high">Price: High to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
          <button type="button" className="shop-reset-button" onClick={resetFilters}>
            <RotateCcw size={15} />
            <span>Reset filters</span>
          </button>
        </div>
      </div>

      {/* Main Products Grid */}
      <section className="shop-grid">
        {visible.map((product) => {
          const isWishlisted = wishlist.some((item) => productKey(item) === productKey(product));
          const isApparel = isSportswearItem(product);

          return (
            <article className="shop-card" key={productKey(product)}>
              <div className="shop-card-image">
                <Link to={`/product/${product._id}`}>
                  <img
                    src={product.image || fallbackImage}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = fallbackImage;
                    }}
                  />
                </Link>

                <div className="shop-card-badges">
                  {isApparel ? (
                    <span className="badge-sportswear-tag">Sportswear</span>
                  ) : (
                    <span className="badge-shoes-tag">Footwear</span>
                  )}
                </div>

                <button
                  type="button"
                  className={`shop-card-wish-btn ${isWishlisted ? "is-active" : ""}`}
                  aria-label={`Save ${product.name} to wishlist`}
                  onClick={() => toggleWishlist(product)}
                >
                  <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="shop-card-meta">
                <div>
                  <h3>
                    <Link to={`/product/${product._id}`}>{product.name}</Link>
                  </h3>
                  <p>{product.sportswearType || product.category || "Khan collection"}</p>

                  {isApparel && (
                    <p className="sportswear-card-details">
                      {[product.sport, product.fit, product.material].filter(Boolean).join(" · ") ||
                        "Athletic Gear"}
                    </p>
                  )}

                  <span
                    className={Number(product.stock) > 0 ? "shop-stock" : "shop-stock is-sold-out"}
                  >
                    {Number(product.stock) > 0 ? `${product.stock} in stock` : "Sold out"}
                  </span>
                </div>
                <strong>{formatCurrency(product.price)}</strong>
              </div>

              <div className="shop-card-actions-bar">
                <button
                  type="button"
                  className="shop-quick-bag-btn"
                  onClick={() => openProductDetails(product)}
                >
                  <ShoppingBag size={14} />
                  <span>Add to Bag</span>
                </button>
                <Link to={`/product/${product._id}`} className="shop-quick-view-link">
                  Details →
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {!visible.length && <p className="empty-state">No products match those filters.</p>}

      {/* ========================================================
          SUGGESTIONS & CROSS-RECOMMENDATIONS SYSTEM
          ("when a user clicks on men, kids, women, or sportswear,
            suggest other shoes and sportwears for them")
          ======================================================== */}
      <section className="shop-suggestions-container" aria-label="You May Also Like">
        <div className="suggestions-main-header">
          <div className="suggestions-title-group">
            <span className="eyebrow">Personalized For You</span>
            <h2>You May Also Like</h2>
            <p>
              Hand-picked complementary styles based on your active section to help complete your
              wardrobe.
            </p>
          </div>
        </div>

        {/* Suggestion Section 1: Other Shoes */}
        {suggestedShoes.length > 0 && (
          <div className="suggestion-block">
            <div className="suggestion-block-header">
              <div>
                <span className="suggestion-tag">Shoe Picks</span>
                <h3>
                  {audience === "Sportswear"
                    ? "Performance Shoes To Match Your Sportswear"
                    : `Featured ${audience === "All" ? "" : audience} Shoes & Sneakers`}
                </h3>
              </div>
              <Link to="/shop" className="suggestion-view-all">
                Browse All Shoes →
              </Link>
            </div>

            <div className="suggestion-grid">
              {suggestedShoes.map((shoe) => (
                <article className="suggestion-card" key={`sug-shoe-${productKey(shoe)}`}>
                  <div className="suggestion-card-img-wrap">
                    <Link to={`/product/${shoe._id}`}>
                      <img
                        src={shoe.image || fallbackImage}
                        alt={shoe.name}
                        onError={(e) => {
                          e.currentTarget.src = fallbackImage;
                        }}
                      />
                    </Link>
                    <button
                      type="button"
                      className="suggestion-wish-btn"
                      onClick={() => toggleWishlist(shoe)}
                      title="Save to Wishlist"
                    >
                      <Heart
                        size={15}
                        fill={
                          wishlist.some((item) => productKey(item) === productKey(shoe))
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="suggestion-card-body">
                    <span className="suggestion-cat">{shoe.category || "Sneakers"}</span>
                    <h4>
                      <Link to={`/product/${shoe._id}`}>{shoe.name}</Link>
                    </h4>
                    <div className="suggestion-price-row">
                      <strong>{formatCurrency(shoe.price)}</strong>
                      <button
                        type="button"
                        className="suggestion-add-btn"
                        onClick={() => openProductDetails(shoe)}
                        title="Add to Bag"
                      >
                        + Bag
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion Section 2: Other Sportswear */}
        {suggestedSportswear.length > 0 && (
          <div className="suggestion-block">
            <div className="suggestion-block-header">
              <div>
                <span className="suggestion-tag gold">Apparel & Gear</span>
                <h3>
                  {audience === "Sportswear"
                    ? "Essential Sportswear Training Sets"
                    : `Complete The Look: ${audience === "All" ? "" : audience} Sportswear`}
                </h3>
              </div>
              <button
                type="button"
                className="suggestion-view-all text-button"
                onClick={() => selectAudience("Sportswear")}
              >
                Explore Full Sportswear →
              </button>
            </div>

            <div className="suggestion-grid">
              {suggestedSportswear.map((apparel) => (
                <article className="suggestion-card" key={`sug-app-${productKey(apparel)}`}>
                  <div className="suggestion-card-img-wrap">
                    <Link to={`/product/${apparel._id}`}>
                      <img
                        src={apparel.image || fallbackImage}
                        alt={apparel.name}
                        onError={(e) => {
                          e.currentTarget.src = fallbackImage;
                        }}
                      />
                    </Link>
                    <span className="suggestion-badge-pill">
                      {apparel.sportswearType || "Sportswear"}
                    </span>
                    <button
                      type="button"
                      className="suggestion-wish-btn"
                      onClick={() => toggleWishlist(apparel)}
                      title="Save to Wishlist"
                    >
                      <Heart
                        size={15}
                        fill={
                          wishlist.some((item) => productKey(item) === productKey(apparel))
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="suggestion-card-body">
                    <span className="suggestion-cat">
                      {[apparel.sport, apparel.fit].filter(Boolean).join(" · ") || "Activewear"}
                    </span>
                    <h4>
                      <Link to={`/product/${apparel._id}`}>{apparel.name}</Link>
                    </h4>
                    <div className="suggestion-price-row">
                      <strong>{formatCurrency(apparel.price)}</strong>
                      <button
                        type="button"
                        className="suggestion-add-btn"
                        onClick={() => openProductDetails(apparel)}
                        title="Add to Bag"
                      >
                        + Bag
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Shop;
