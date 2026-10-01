import { useState } from "react";
import { Link } from "react-router-dom";
import { cartTotal, createOrder, getCartStockMessage, groupedCart, readCart, writeCart } from "../services/storeService";

function Checkout() {
  const cart = readCart();
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState({ name: "", address: "", city: "", postalCode: "" });
  const update = (event) => setDetails({ ...details, [event.target.name]: event.target.value });
  const placeOrder = async (event) => {
    event.preventDefault();
    setError("");
    const stockMessage = getCartStockMessage(cart);
    if (stockMessage) {
      setError(stockMessage);
      return;
    }
    try {
      await createOrder({
        email: details.email,
        items: groupedCart(cart).map(({ product, quantity }) => ({ product: product._id, name: product.name, image: product.image, quantity, price: Number(product.price), size: product.selectedSize })),
        total: cartTotal(cart),
        shipping: details,
        paymentMethod: "cash"
      });
      writeCart([]);
      setPlaced(true);
    } catch (orderError) { setError(orderError.message); }
  };

  if (placed) return <main className="confirmation-page"><p className="eyebrow">Thank you</p><h1>Your order is confirmed.</h1><p>Your order has been received and is being prepared.</p><Link className="primary-link" to="/shop">Keep shopping</Link></main>;

  return <main className="commerce-page"><header className="commerce-header"><div><p className="eyebrow">Almost yours</p><h1>Checkout</h1></div><Link className="secondary-link" to="/cart">Back to bag</Link></header><section className="commerce-layout"><form className="checkout-page-form" onSubmit={placeOrder}><h2>Shipping details</h2><div className="form-grid"><input name="name" placeholder="Full name" value={details.name} onChange={update} required /><input className="form-wide" name="address" placeholder="Street address" value={details.address} onChange={update} required /><input name="city" placeholder="City" value={details.city} onChange={update} required /><input name="postalCode" placeholder="Postal code" value={details.postalCode} onChange={update} required /></div><h2>Payment</h2><div className="payment-tabs"><label><input type="radio" name="paymentMethod" defaultChecked readOnly /> Cash on delivery</label></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" type="submit" disabled={!cart.length}>Place order</button></form><aside className="order-summary"><p className="eyebrow">Order summary</p>{groupedCart(cart).map(({ product, quantity }) => <div className="summary-line" key={product._id}><span>{product.name} × {quantity}</span><strong>${(Number(product.price) * quantity).toFixed(2)}</strong></div>)}<hr /><div className="summary-total"><span>Total</span><strong>${cartTotal(cart).toFixed(2)}</strong></div></aside></section></main>;
}
export default Checkout;
