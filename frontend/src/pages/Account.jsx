import { Link, useNavigate } from "react-router-dom";

function Account() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const wishlist = JSON.parse(localStorage.getItem("khan-wishlist") || "[]");
  const cart = JSON.parse(localStorage.getItem("khan-cart") || "[]");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
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

      <Link className="account-back-link" to="/">Back to Khan storefront</Link>
    </main>
  );
}

export default Account;
