import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  FolderTree,
  Activity,
  Settings,
  LogOut,
  ExternalLink,
  Zap
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login", { replace: true });
  };

  const isCurrent = (path, tabParam) => {
    if (tabParam) {
      const search = new URLSearchParams(location.search);
      return location.pathname === path && search.get("tab") === tabParam;
    }
    if (path === "/admin") {
      return location.pathname === "/admin" && !location.search;
    }
    if (path === "/products") {
      return location.pathname.startsWith("/products");
    }
    return location.pathname === path;
  };

  const navItems = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: isCurrent("/admin")
    },
    {
      to: "/admin/manage?tab=orders",
      label: "Orders",
      icon: ShoppingBag,
      active: isCurrent("/admin/manage", "orders")
    },
    {
      to: "/products",
      label: "Products",
      icon: Package,
      active: isCurrent("/products")
    },
    {
      to: "/admin/manage?tab=users",
      label: "Customers",
      icon: Users,
      active: isCurrent("/admin/manage", "users")
    },
    {
      to: "/admin/manage?tab=categories",
      label: "Categories",
      icon: FolderTree,
      active: isCurrent("/admin/manage", "categories")
    },
    {
      to: "/admin/manage?tab=logs",
      label: "Activity Logs",
      icon: Activity,
      active: isCurrent("/admin/manage", "logs")
    },
    {
      to: "/admin/manage?tab=settings",
      label: "Settings",
      icon: Settings,
      active: isCurrent("/admin/manage", "settings")
    }
  ];

  return (
    <aside className="reference-sidebar" aria-label="Admin Navigation">
      {/* Brand Logo Header */}
      <div className="reference-brand">
        <div className="reference-logo-icon">
          <Zap size={20} />
        </div>
        <div className="reference-brand-text">
          <span className="brand-main">Khan Admin</span>
          <span className="brand-sub">Store Operations</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="reference-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={`reference-nav-item ${item.active ? "is-active" : ""}`}
            >
              <Icon size={19} className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="reference-sidebar-footer">
        <div className="sidebar-tools-row">
          <NavLink to="/" className="sidebar-store-btn" title="Open Public Storefront">
            <ExternalLink size={16} />
            <span>View store</span>
          </NavLink>
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="reference-logout-btn"
          onClick={handleLogout}
          title="Sign out of Admin Panel"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
