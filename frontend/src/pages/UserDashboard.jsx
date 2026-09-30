import { Link, useNavigate } from "react-router-dom";

function UserDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login", { replace: true });
  };

  return (
    <main className="user-dashboard">
      <header className="user-dashboard-header">
        <div>
          <p className="eyebrow">Customer area</p>
          <h1>Welcome, {user?.name || "User"}</h1>
          <p>Browse the latest products from your account.</p>
        </div>
        <button className="secondary-link user-logout" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="user-dashboard-panel">
        <p className="eyebrow">Your account</p>
        <h2>Shop with confidence</h2>
        <p>Your user account is ready. Explore the catalog and find your next favorite product.</p>
        <Link className="primary-link" to="/products">Browse products</Link>
      </section>
    </main>
  );
}

export default UserDashboard;
