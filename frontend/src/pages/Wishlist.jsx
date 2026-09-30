import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { addProductWithinStock, productKey, readCart, readWishlist, writeCart, writeWishlist } from "../services/storeService";

function Wishlist() {
  const [items, setItems] = useState(readWishlist);
  const [shared, setShared] = useState(false);
  const [notice, setNotice] = useState("");
  const remove = (product) => { const next = items.filter((item) => productKey(item) !== productKey(product)); setItems(next); writeWishlist(next); };
  const moveToBag = (product) => { const result = addProductWithinStock(readCart(), product); if (result.message) { setNotice(result.message); return; } writeCart(result.cart); setNotice(""); remove(product); };
  const shareWishlist = async () => { const url = window.location.href; if (navigator.share) await navigator.share({ title: "My Khan wishlist", url }); else if (navigator.clipboard) { await navigator.clipboard.writeText(url); setShared(true); } };
  return <main className="commerce-page wishlist-page"><header className="commerce-header"><div><p className="eyebrow">Saved for later</p><h1>Wishlist</h1></div><div className="page-actions"><button className="secondary-link" type="button" onClick={shareWishlist}>{shared ? "Link copied" : "Share wishlist"}</button><Link className="secondary-link" to="/shop">Browse collection</Link></div></header>{notice && <p className="form-error" role="alert">{notice}</p>}{items.length ? <section className="shop-grid">{items.map((product) => <article className="shop-card" key={productKey(product)}><div className="shop-card-image"><img src={product.image} alt={product.name} /><button className="wishlist-remove-btn" type="button" aria-label="Remove from wishlist" onClick={() => remove(product)}><Trash2 size={17} /></button></div><div className="shop-card-meta"><div><h3>{product.name}</h3><p>${product.price}</p></div><button className="icon-action" type="button" aria-label="Move to bag" onClick={() => moveToBag(product)}><ShoppingBag size={17} /></button></div></article>)}</section> : <div className="empty-state"><Heart size={22} /><p>Your wishlist is empty.</p><Link className="primary-link" to="/shop">Explore shoes</Link></div>}</main>;
}
export default Wishlist;
