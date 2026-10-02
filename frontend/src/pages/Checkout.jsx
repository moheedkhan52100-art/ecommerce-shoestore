import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Wallet } from "lucide-react";
import { cartTotal, createOrder, getCartStockMessage, groupedCart, readCart, writeCart } from "../services/storeService";
import { useStoreSettings } from "../context/storeSettings";

function Checkout() {
  const { formatCurrency } = useStoreSettings();
  const cart = readCart();
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState({ name: "", address: "", city: "", postalCode: "", cardName: "", cardNumber: "", expiry: "", cvv: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash");
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
        shipping: { name: details.name, address: details.address, city: details.city, postalCode: details.postalCode },
        paymentMethod
      });
      writeCart([]);
      setPlaced(true);
    } catch (orderError) { setError(orderError.message); }
  };

  if (placed) return <main className="confirmation-page"><p className="eyebrow">Thank you</p><h1>Your order is confirmed.</h1><p>Your order has been received and is being prepared.</p><Link className="primary-link" to="/shop">Keep shopping</Link></main>;

  return <main className="commerce-page"><header className="commerce-header"><div><p className="eyebrow">Almost yours</p><h1>Checkout</h1></div><Link className="secondary-link" to="/cart">Back to bag</Link></header><section className="commerce-layout"><form className="checkout-page-form" onSubmit={placeOrder}><h2>Shipping details</h2><div className="form-grid"><input name="name" placeholder="Full name" value={details.name} onChange={update} required /><input className="form-wide" name="address" placeholder="Street address" value={details.address} onChange={update} required /><input name="city" placeholder="City" value={details.city} onChange={update} required /><input name="postalCode" placeholder="Postal code" value={details.postalCode} onChange={update} required /></div><h2>Payment</h2><div className="payment-tabs"><label className={paymentMethod === "cash" ? "is-active" : ""}><input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} /><Wallet size={17} /> Cash on delivery</label><label className={paymentMethod === "card" ? "is-active" : ""}><input type="radio" name="paymentMethod" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} /><CreditCard size={17} /> Card payment</label></div>{paymentMethod === "card" && <div className="form-grid"><input className="form-wide" name="cardName" placeholder="Cardholder name" value={details.cardName} onChange={update} required /><input className="form-wide" name="cardNumber" inputMode="numeric" placeholder="Card number" value={details.cardNumber} onChange={update} minLength="12" required /><input name="expiry" placeholder="MM / YY" value={details.expiry} onChange={update} required /><input name="cvv" type="password" inputMode="numeric" placeholder="CVV" value={details.cvv} onChange={update} minLength="3" required /></div>}{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" type="submit" disabled={!cart.length}>Place order</button></form><aside className="order-summary"><p className="eyebrow">Order summary</p>{groupedCart(cart).map(({ product, quantity }) => <div className="summary-line" key={product._id}><span>{product.name} × {quantity}</span><strong>{formatCurrency(Number(product.price) * quantity)}</strong></div>)}<hr /><div className="summary-total"><span>Total</span><strong>{formatCurrency(cartTotal(cart))}</strong></div></aside></section></main>;
}
export default Checkout;
