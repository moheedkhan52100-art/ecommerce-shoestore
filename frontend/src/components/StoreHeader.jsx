import { useEffect, useState } from "react";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { readCart, readWishlist } from "../services/storeService";
import ThemeToggle from "./ThemeToggle";

function StoreHeader({ shopNavigation = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(() => readCart().length);
  const [wishlistCount, setWishlistCount] = useState(() => readWishlist().length);
  const selectedAudience = new URLSearchParams(location.search).get("audience") || "All";
  const accountTarget = localStorage.getItem("admin")
    ? "/admin"
    : localStorage.getItem("user")
    ? "/user/account"
    : "/user/login";

  useEffect(() => {
    const refreshCounts = () => {
      setCartCount(readCart().length);
      setWishlistCount(readWishlist().length);
    };

    refreshCounts();
    window.addEventListener("store-data-updated", refreshCounts);
    window.addEventListener("storage", refreshCounts);
    return () => {
      window.removeEventListener("store-data-updated", refreshCounts);
      window.removeEventListener("storage", refreshCounts);
    };
  }, [location.pathname, location.search]);

  return (
    <header className={`store-header${shopNavigation ? " shop-store-header" : ""}`}>
      <Link className="brand-lockup" to="/">
        <span className="brand-mark">K</span>
        <span>KHAN</span>
      </Link>

      <nav className={`store-nav${shopNavigation ? " is-shop-nav" : ""}`} aria-label="Store navigation">
        <Link to="/">Home</Link>
        {shopNavigation ? (
          ["All", "Men", "Women", "Kids", "Jordan", "NikeSKIMS", "Sport", "Sportswear"].map((item) => (
            <Link
              key={item}
              className={selectedAudience === item ? "is-active" : ""}
              to={item === "All" ? "/shop" : `/shop?audience=${encodeURIComponent(item)}`}
              aria-current={selectedAudience === item ? "page" : undefined}
            >
              {item}
            </Link>
          ))
        ) : (
          <>
            <Link to="/shop">Shop</Link>
            {["Men", "Women", "Kids", "Jordan", "NikeSKIMS", "Sport", "Sportswear"].map((item) => (
              <Link key={item} to={`/shop?audience=${encodeURIComponent(item)}`}>
                {item}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="store-actions" aria-label="Store actions">
        <button
          type="button"
          aria-label="Search products"
          title="Search products"
          onClick={() => {
            const params = new URLSearchParams(location.pathname === "/shop" ? location.search : "");
            params.set("focusSearch", String(Date.now()));
            navigate(`/shop?${params.toString()}`);
          }}
        >
          <Search size={18} />
        </button>
        <Link to={accountTarget} aria-label="Account" title="Account">
          <UserRound size={18} />
        </Link>
        <Link to="/wishlist" aria-label={`Wishlist, ${wishlistCount} items`} title="Wishlist">
          <Heart size={18} />
          <span className="action-count">{wishlistCount}</span>
        </Link>
        <Link to="/cart" aria-label={`Shopping bag, ${cartCount} items`} title="Shopping bag">
          <ShoppingBag size={18} />
          <span className="action-count">{cartCount}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

export default StoreHeader;
