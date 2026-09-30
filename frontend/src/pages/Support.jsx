import { useState } from "react";
import { Link } from "react-router-dom";

function Support() {
  const [sent, setSent] = useState(false);
  return <main className="support-page"><Link className="detail-back-link" to="/">Back to storefront</Link><section className="support-layout"><div><p className="eyebrow">We are here to help</p><h1>Questions, handled with care.</h1><p>Reach out about sizing, delivery, returns, or anything else about your Khan order.</p><div className="support-details"><span>hello@khan.store</span><span>Mon to Fri, 9am to 6pm</span></div></div><form className="support-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><input placeholder="Your name" required /><input type="email" placeholder="Email address" required /><select defaultValue="order"><option value="order">Order support</option><option value="sizing">Sizing help</option><option value="returns">Returns</option></select><textarea placeholder="How can we help?" rows="6" required /><button className="primary-button" type="submit">{sent ? "Message sent" : "Send message"}</button></form></section></main>;
}
export default Support;
