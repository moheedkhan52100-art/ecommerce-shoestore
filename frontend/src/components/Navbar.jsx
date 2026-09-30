import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ExternalLink, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const navigate = useNavigate();

  const admin = JSON.parse(
    localStorage.getItem("admin") || "null"
  );

  const handleLogout = () => {
    // Remove login information
    localStorage.removeItem("token");
    localStorage.removeItem("admin");

    // Go back to login page
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">

      <div className="navbar-left">
        <h2>Khan Admin</h2>
      </div>

      <div className="navbar-right">

        <ThemeToggle />

        <Link className="admin-store-link" to="/" title="Open storefront">
          <ExternalLink size={16} />
          <span>View store</span>
        </Link>

        <span className="admin-name">
          {admin?.name || "Admin"}
        </span>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </div>

    </nav>
  );
}

export default Navbar;  