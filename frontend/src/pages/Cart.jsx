import { Minus, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { addProductWithinStock, cartTotal, getCartStockMessage, groupedCart, productKey, readCart, writeCart } from "../services/storeService";
import { useStoreSettings } from "../context/storeSettings";

function Cart() {
  const { formatCurrency } = useStoreSettings();
  const navigate = useNavigate();
  const [cart, setCart] = useState(readCart);
  const [notice, setNotice] = useState("");
  const items = groupedCart(cart);
  const update = (product, change) => {
    const index = cart.findIndex((item) => productKey(item) === productKey(product));
    if (index < 0) return;
    if (change > 0) {
      const result = addProductWithinStock(cart, product);
      if (result.message) {
        setNotice(result.message);
        return;
      }
      setNotice("");
      setCart(result.cart);
      writeCart(result.cart);
      return;
    }
    const next = [...cart];
    next.splice(index, 1);
    setNotice("");
    setCart(next); writeCart(next);
  };
  const stockMessage = getCartStockMessage(cart);
  return <main className="commerce-page"><header className="commerce-header"><div><p className="eyebrow">Your selection</p><h1>Shopping bag</h1></div><Link className="secondary-link" to="/shop">Continue shopping</Link></header>{notice && <p className="form-error" role="alert">{notice}</p>}{stockMessage && <p className="form-error" role="alert">{stockMessage}</p>}<section className="commerce-layout"><div className="commerce-list">{items.length ? items.map(({ product, quantity }) => <article className="commerce-item" key={productKey(product)}><img src={product.image} alt={product.name} /><div><h2>{product.name}</h2><p>{product.category || "Khan collection"}{product.selectedSize ? ` · Size ${product.selectedSize}` : ""}</p><strong>{formatCurrency(product.price)}</strong></div><div className="quantity-controls"><button type="button" aria-label="Decrease quantity" onClick={() => update(product, -1)}><Minus size={14} /></button><span>{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => update(product, 1)}><Plus size={14} /></button></div><button className="icon-action" type="button" aria-label="Remove item" onClick={() => { const next = cart.filter((item) => productKey(item) !== productKey(product)); setCart(next); writeCart(next); }}><Trash2 size={17} /></button></article>) : <p className="empty-state">Your bag is waiting for something good.</p>}</div><aside className="order-summary"><p className="eyebrow">Order summary</p><h2>Ready when you are.</h2><div><span>Subtotal</span><strong>{formatCurrency(cartTotal(cart))}</strong></div><div><span>Shipping</span><span>{items.length ? "Complimentary" : formatCurrency(0)}</span></div><hr /><div className="summary-total"><span>Total</span><strong>{formatCurrency(cartTotal(cart))}</strong></div><button className="primary-button" type="button" disabled={!items.length || Boolean(stockMessage)} onClick={() => navigate("/checkout")}>Checkout</button></aside></section></main>;
}
export default Cart;
