import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Mail, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminOrders } from "../services/adminService";
import { getProducts } from "../services/productService";

const adminPages = [
  { label: "Dashboard", path: "/admin" },
  { label: "Products", path: "/products" },
  { label: "Orders", path: "/admin/manage?tab=orders" },
  { label: "Customers", path: "/admin/manage?tab=users" },
  { label: "Categories", path: "/admin/manage?tab=categories" },
  { label: "Activity Logs", path: "/admin/manage?tab=logs" },
  { label: "Settings", path: "/admin/manage?tab=settings" }
];

function AdminHeader({ title = "Dashboard", eyebrow = "Overview", children }) {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const [openPanel, setOpenPanel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [notificationData, setNotificationData] = useState(null);
  const [notificationError, setNotificationError] = useState("");
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const adminName = admin.name || "Admin User";
  const adminEmail = admin.email || "admin@khan.store";

  // Generate initials for avatar
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  const matchingPages = adminPages.filter((page) =>
    page.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const matchingProducts = products
    .filter((product) =>
      [product.name, product.category, product.audience]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    )
    .slice(0, 5);
  const pendingOrders = (notificationData?.orders || []).filter((order) => order.status === "Pending");
  const lowStockProducts = (notificationData?.products || []).filter((product) => Number(product.stock) <= 5);
  const notificationLoading = openPanel === "notifications" && !notificationData && !notificationError;

  useEffect(() => {
    if (!openPanel) return undefined;

    const closePanel = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpenPanel("");
      if (event.key === "Escape") setOpenPanel("");
    };

    document.addEventListener("pointerdown", closePanel);
    document.addEventListener("keydown", closePanel);
    return () => {
      document.removeEventListener("pointerdown", closePanel);
      document.removeEventListener("keydown", closePanel);
    };
  }, [openPanel]);

  useEffect(() => {
    if (openPanel !== "search" || products.length > 0) return undefined;
    let active = true;
    getProducts()
      .then((response) => {
        if (active) setProducts(response.data || []);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, [openPanel, products.length]);

  useEffect(() => {
    if (openPanel !== "notifications" || notificationData) return undefined;
    let active = true;
    Promise.all([getAdminOrders(), getProducts()])
      .then(([ordersResponse, productsResponse]) => {
        if (active) {
          setNotificationData({
            orders: ordersResponse.data || [],
            products: productsResponse.data || []
          });
        }
      })
      .catch(() => {
        if (active) setNotificationError("Unable to load admin notifications.");
      });
    return () => {
      active = false;
    };
  }, [openPanel, notificationData]);

  const togglePanel = (panel) => {
    setOpenPanel((current) => current === panel ? "" : panel);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (matchingPages.length > 0) {
      navigate(matchingPages[0].path);
    } else if (matchingProducts.length > 0) {
      navigate(`/products/edit/${matchingProducts[0]._id}`);
    }
    setOpenPanel("");
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login", { replace: true });
  };

  return (
    <header className="reference-header" ref={headerRef}>
      <div className="reference-header-left">
        {eyebrow && <span className="reference-eyebrow">{eyebrow}</span>}
        <h1 className="reference-page-title">{title}</h1>
      </div>

      <div className="reference-header-right">
        {children}

        <div className="header-icon-buttons">
          <a
            className="header-icon-btn"
            href="mailto:support@khan.store?subject=Admin%20message"
            title="Email support"
            aria-label="Email support"
          >
            <Mail size={18} />
          </a>
          <div className="admin-header-control">
            <button
              type="button"
              className="header-icon-btn"
              title="Search admin pages and products"
              aria-label="Search admin pages and products"
              aria-expanded={openPanel === "search"}
              onClick={() => togglePanel("search")}
            >
              <Search size={18} />
            </button>
            {openPanel === "search" && (
              <div className="admin-popover admin-search-panel">
                <form onSubmit={handleSearchSubmit}>
                  <label className="admin-search-field">
                    <Search size={16} />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search pages or products"
                      aria-label="Search admin pages or products"
                    />
                  </label>
                </form>
                <div className="admin-search-results">
                  {matchingPages.length > 0 && (
                    <section>
                      <span className="admin-popover-label">Pages</span>
                      {matchingPages.slice(0, 4).map((page) => (
                        <Link key={page.path} to={page.path} onClick={() => setOpenPanel("")}>{page.label}</Link>
                      ))}
                    </section>
                  )}
                  {searchQuery.trim() && matchingProducts.length > 0 && (
                    <section>
                      <span className="admin-popover-label">Products</span>
                      {matchingProducts.map((product) => (
                        <Link key={product._id} to={`/products/edit/${product._id}`} onClick={() => setOpenPanel("")}>
                          <span>{product.name}</span>
                          <small>{product.category || "Product"}</small>
                        </Link>
                      ))}
                    </section>
                  )}
                  {searchQuery.trim() && matchingPages.length === 0 && matchingProducts.length === 0 && (
                    <p className="admin-popover-empty">No matching pages or products.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="admin-header-control">
            <button
              type="button"
              className="header-icon-btn"
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={openPanel === "notifications"}
              onClick={() => togglePanel("notifications")}
            >
              <Bell size={18} />
              {notificationData && (pendingOrders.length + lowStockProducts.length > 0) && (
                <span className="header-icon-badge">{pendingOrders.length + lowStockProducts.length}</span>
              )}
            </button>
            {openPanel === "notifications" && (
              <div className="admin-popover admin-notifications-panel">
                <h2>Notifications</h2>
                {notificationLoading ? (
                  <p className="admin-popover-empty">Checking store activity...</p>
                ) : notificationError ? (
                  <p className="admin-popover-empty" role="alert">{notificationError}</p>
                ) : (
                  <>
                    {pendingOrders.length > 0 && (
                      <Link to="/admin/manage?tab=orders" onClick={() => setOpenPanel("")}>
                        <strong>{pendingOrders.length} pending {pendingOrders.length === 1 ? "order" : "orders"}</strong>
                        <small>Review orders awaiting action</small>
                      </Link>
                    )}
                    {lowStockProducts.length > 0 && (
                      <Link to="/products" onClick={() => setOpenPanel("")}>
                        <strong>{lowStockProducts.length} low-stock {lowStockProducts.length === 1 ? "product" : "products"}</strong>
                        <small>Products with 5 units or fewer</small>
                      </Link>
                    )}
                    {pendingOrders.length === 0 && lowStockProducts.length === 0 && (
                      <p className="admin-popover-empty">You&apos;re all caught up.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="admin-header-control">
          <button
            type="button"
            className="admin-profile-chip"
            title={`${adminName} (${adminEmail})`}
            aria-expanded={openPanel === "profile"}
            onClick={() => togglePanel("profile")}
          >
            <span className="admin-avatar-circle">{initials}</span>
            <span className="admin-profile-text">
              <span className="admin-profile-name">{adminName}</span>
              <span className="admin-profile-email">{adminEmail}</span>
            </span>
            <ChevronDown size={14} />
          </button>
          {openPanel === "profile" && (
            <div className="admin-popover admin-profile-menu">
              <p>Signed in as <strong>{adminEmail}</strong></p>
              <Link to="/admin/manage?tab=settings" onClick={() => setOpenPanel("")}>Admin settings</Link>
              <button type="button" onClick={handleSignOut}><LogOut size={15} /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
