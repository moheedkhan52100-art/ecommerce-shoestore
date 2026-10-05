import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductReview, getMyOrders } from "../services/productService";
import { useStoreSettings } from "../context/storeSettings";
import ReviewStars from "../components/ReviewStars";

function Account() {
  const navigate = useNavigate();
  const { formatCurrency } = useStoreSettings();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const wishlist = JSON.parse(localStorage.getItem("khan-wishlist") || "[]");
  const cart = JSON.parse(localStorage.getItem("khan-cart") || "[]");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewRatings, setReviewRatings] = useState({});
  const [reviewStates, setReviewStates] = useState({});

  useEffect(() => {
    let active = true;
    getMyOrders()
      .then((response) => {
        if (active) setOrders(response.data);
      })
      .catch((error) => {
        if (active) {
          setOrdersError(error.response?.data?.message || "Unable to load your orders. Please try again.");
        }
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const updateReviewDraft = (key, value) => {
    setReviewDrafts((current) => ({ ...current, [key]: value }));
  };

  const updateReviewRating = (key, value) => {
    setReviewRatings((current) => ({ ...current, [key]: value }));
  };

  const submitReview = async (event, orderId, item) => {
    event.preventDefault();
    const key = `${orderId}-${item.product}`;
    const text = (reviewDrafts[key] || "").trim();
    const rating = reviewRatings[key] || 0;
    if (!text || !rating || !item.product) {
      setReviewStates((current) => ({
        ...current,
        [key]: { error: !text ? "Enter a review before posting." : "Select a star rating." }
      }));
      return;
    }

    setReviewStates((current) => ({ ...current, [key]: { submitting: true } }));
    try {
      await createProductReview(item.product, text, rating);
      setReviewDrafts((current) => ({ ...current, [key]: "" }));
      setReviewRatings((current) => ({ ...current, [key]: 0 }));
      setReviewStates((current) => ({ ...current, [key]: { submitted: true } }));
    } catch (error) {
      setReviewStates((current) => ({
        ...current,
        [key]: { error: error.response?.data?.message || "Unable to post your review. Please try again." }
      }));
    }
  };

  return (
    <main className="account-page">
      <header className="account-page-header">
        <div>
          <p className="eyebrow">Khan account</p>
          <h1>My account</h1>
          <p>Welcome back, {user?.name || "Khan customer"}.</p>
        </div>
        <button className="account-logout" type="button" onClick={handleLogout}>Logout</button>
      </header>

      <section className="account-grid">
        <article className="account-panel account-profile">
          <p className="eyebrow">Profile</p>
          <h2>{user?.name || "Khan customer"}</h2>
          <p>{user?.email || "No email available"}</p>
          <span>Member account</span>
        </article>

        <article className="account-panel">
          <p className="eyebrow">Saved items</p>
          <strong className="account-stat">{wishlist.length}</strong>
          <p>Wishlist pieces</p>
          <Link className="account-text-link" to="/">Browse collection</Link>
        </article>

        <article className="account-panel">
          <p className="eyebrow">Your bag</p>
          <strong className="account-stat">{cart.length}</strong>
          <p>Items ready to review</p>
          <Link className="account-text-link" to="/">Continue shopping</Link>
        </article>
      </section>

      <section className="account-orders" aria-labelledby="account-orders-title">
        <div className="account-orders-heading">
          <div>
            <p className="eyebrow">Order history</p>
            <h2 id="account-orders-title">Your orders</h2>
          </div>
          <Link className="account-text-link" to="/shop">Continue shopping</Link>
        </div>
        {ordersLoading && <p className="account-orders-message">Loading your orders...</p>}
        {ordersError && <p className="form-error" role="alert">{ordersError}</p>}
        {!ordersLoading && !ordersError && !orders.length && (
          <p className="account-orders-message">You have not placed any orders yet.</p>
        )}
        {orders.map((order) => (
          <article className="account-order-card" key={order._id}>
            <header className="account-order-heading">
              <div>
                <strong>Order #{String(order._id).slice(-6).toUpperCase()}</strong>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <span className={`account-order-status status-${order.status?.toLowerCase()}`}>{order.status}</span>
            </header>
            <div className="account-order-items">
              {order.items.map((item, index) => {
                const productId = typeof item.product === "object" ? item.product?._id : item.product;
                const reviewKey = `${order._id}-${productId}`;
                const reviewState = reviewStates[reviewKey] || {};
                return (
                  <div className="account-order-item" key={`${productId || item.name}-${index}`}>
                    <img src={item.image} alt={item.name} />
                    <div className="account-order-product">
                      <strong>{item.name}</strong>
                      <span>
                        {item.size ? `Size ${item.size} · ` : ""}
                        Qty {item.quantity} · {formatCurrency(item.price * item.quantity)}
                      </span>
                      {reviewState.submitted ? (
                        <p className="account-review-success" role="status">Thanks for sharing your review.</p>
                      ) : productId ? (
                        <form
                          className="account-review-form"
                          onSubmit={(event) => submitReview(event, order._id, { ...item, product: productId })}
                        >
                          <ReviewStars
                            value={reviewRatings[reviewKey] || 0}
                            onChange={(value) => updateReviewRating(reviewKey, value)}
                            disabled={reviewState.submitting}
                            label={`Rate ${item.name}`}
                          />
                          <input
                            value={reviewDrafts[reviewKey] || ""}
                            onChange={(event) => updateReviewDraft(reviewKey, event.target.value)}
                            placeholder="Review this product"
                            aria-label={`Review ${item.name}`}
                            maxLength={1000}
                            disabled={reviewState.submitting}
                          />
                          <button type="submit" disabled={reviewState.submitting || !(reviewDrafts[reviewKey] || "").trim() || !reviewRatings[reviewKey]}>
                            {reviewState.submitting ? "Posting..." : "Post review"}
                          </button>
                          {reviewState.error && <span className="form-error" role="alert">{reviewState.error}</span>}
                        </form>
                      ) : (
                        <span className="account-orders-message">Review unavailable for this item.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <footer className="account-order-footer">
              <span>{order.paymentMethod === "cash" ? "Cash on delivery" : "Card payment"}</span>
              <strong>Total {formatCurrency(order.total)}</strong>
            </footer>
          </article>
        ))}
      </section>

      <Link className="account-back-link" to="/">Back to Khan storefront</Link>
    </main>
  );
}

export default Account;
