import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, TrendingUp, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getProducts } from "../services/productService";
import { getAdminOrders } from "../services/adminService";
import ProductModal from "../components/ProductModal";
import ActivityLogs from "../components/ActivityLogs";
import AdminHeader from "../components/AdminHeader";

const defaultShoeImage =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const loadDashboardData = () => {
    getProducts()
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Unable to load dashboard products", error));
    getAdminOrders()
      .then((response) => setOrders(response.data))
      .catch((error) => console.error("Unable to load dashboard orders", error));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleProductCreated = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    setToast(`Product "${newProduct.name}" created successfully!`);
    setTimeout(() => setToast(""), 4000);
  };

  const lowStockCount = products.filter((product) => product.stock <= 5).length;
  const categoryCount = new Set(products.map((product) => product.category).filter(Boolean)).size;
  const featuredProducts = products.slice(0, 6);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const ordersThisYear = orders.filter(
    (order) => new Date(order.createdAt).getFullYear() === currentYear
  );
  const revenueData = monthNames.map((month, index) => ({
    month,
    revenue: ordersThisYear
      .filter((order) => new Date(order.createdAt).getMonth() === index)
      .reduce((total, order) => total + Number(order.total || 0), 0)
  }));
  const totalRevenue = revenueData.reduce((total, entry) => total + entry.revenue, 0);
  const pendingOrderCount = orders.filter((order) => order.status === "Pending").length;
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="reference-content-wrap">
      {/* Top Header matching reference */}
      <AdminHeader title="Dashboard" eyebrow="Store Operations">
        <button
          type="button"
          className="primary-button header-add-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} style={{ marginRight: 6 }} />
          Add Product
        </button>
      </AdminHeader>

      {toast && <div className="toast-success">{toast}</div>}

      {/* Top 4 KPI Stat Cards */}
      <section className="kpi-stats-grid">
        <div className="kpi-stat-card">
          <div className="kpi-icon-wrap kpi-gold">
            <TrendingUp size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">Annual Revenue</span>
            <strong className="kpi-value">{formatCurrency(totalRevenue)}</strong>
            <small className="kpi-sub">Total earned this year</small>
          </div>
        </div>

        <div className="kpi-stat-card">
          <div className="kpi-icon-wrap kpi-blue">
            <ShoppingBag size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">Total Orders</span>
            <strong className="kpi-value">{orders.length}</strong>
            <small className="kpi-sub">{pendingOrderCount} pending dispatch</small>
          </div>
        </div>

        <div className="kpi-stat-card">
          <div className="kpi-icon-wrap kpi-green">
            <Package size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">Active Catalog</span>
            <strong className="kpi-value">{products.length}</strong>
            <small className="kpi-sub">{categoryCount} categories</small>
          </div>
        </div>

        <div className="kpi-stat-card">
          <div className="kpi-icon-wrap kpi-amber">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">Low Stock Items</span>
            <strong className="kpi-value">{lowStockCount}</strong>
            <small className="kpi-sub">{lowStockCount > 0 ? "Reorder needed" : "Healthy stock"}</small>
          </div>
        </div>
      </section>

      {/* Analytics & Overview Section */}
      <section className="dashboard-analytics-grid">
        <motion.div
          className="reference-table-card dashboard-chart-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="table-header-strip">
            <div>
              <span className="reference-eyebrow">Performance Trend</span>
              <h2>Revenue Analytics ({currentYear})</h2>
            </div>
            <strong className="chart-revenue-badge">{formatCurrency(totalRevenue)}</strong>
          </div>

          {totalRevenue > 0 ? (
            <div className="dashboard-chart-inner">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenueData} margin={{ top: 12, right: 18, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted)" tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="var(--muted)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCurrency(val)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel-strong)",
                      border: "1px solid var(--line)",
                      color: "var(--ink)",
                      borderRadius: "10px"
                    }}
                    formatter={(val) => [formatCurrency(val), "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--bronze, #e9a51a)"
                    strokeWidth={3}
                    dot={{ fill: "var(--bronze, #e9a51a)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty-state">No sales recorded yet this year.</div>
          )}
        </motion.div>

        <div className="reference-table-card dashboard-alerts-card">
          <div className="table-header-strip">
            <div>
              <span className="reference-eyebrow">Attention</span>
              <h2>Store Quick Overview</h2>
            </div>
          </div>

          <div className="dashboard-alert-list">
            <div className="alert-item-row">
              <span>Pending Orders</span>
              <strong className="alert-count-pill">{pendingOrderCount}</strong>
            </div>

            {products
              .filter((p) => p.stock <= 5)
              .slice(0, 4)
              .map((p) => (
                <div className="alert-item-row" key={p._id}>
                  <span className="text-truncate">{p.name}</span>
                  <strong className="low-stock-pill">{p.stock} left</strong>
                </div>
              ))}

            {lowStockCount === 0 && (
              <p className="empty-notice">All catalog items are comfortably stocked.</p>
            )}
          </div>

          <div className="dashboard-quick-add-cta">
            <button
              type="button"
              className="primary-button w-full"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} style={{ marginRight: 6 }} />
              Add New Product (In-Page)
            </button>
          </div>
        </div>
      </section>

      {/* Activity Logs Stream */}
      <section className="reference-card-section">
        <div className="reference-table-card">
          <div className="table-header-strip">
            <div>
              <span className="reference-eyebrow">Real-Time Audit</span>
              <h2>Recent Activity Logs</h2>
            </div>
            <Link className="secondary-link" to="/admin/manage?tab=logs">
              <span>View full log history</span>
              <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </Link>
          </div>
          <ActivityLogs isCompact={true} limit={6} />
        </div>
      </section>

      {/* Standout Products Gallery */}
      <section className="reference-card-section">
        <div className="reference-table-card">
          <div className="table-header-strip">
            <div>
              <span className="reference-eyebrow">Catalog Standouts</span>
              <h2>Featured Products</h2>
            </div>
            <Link className="secondary-link" to="/products">
              View Catalog →
            </Link>
          </div>

          <div className="featured-mini-grid">
            {featuredProducts.map((product) => (
              <article className="featured-mini-card" key={product._id}>
                <img
                  src={product.image || defaultShoeImage}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.src = defaultShoeImage;
                  }}
                />
                <div className="featured-mini-copy">
                  <strong className="text-truncate">{product.name}</strong>
                  <span>
                    ${Number(product.price).toFixed(2)} · {product.category || "General"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* In-page Product Modal for Dashboard quick add */}
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="add"
        onSuccess={handleProductCreated}
      />
    </div>
  );
}

export default Dashboard;
