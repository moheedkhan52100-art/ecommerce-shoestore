import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Phone,
  MessageSquare,
  X,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Package,
  ShoppingBag
} from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getAdminOrders,
  getAdminUsers,
  getCategories,
  updateOrderStatus,
  updateStoreSettings,
  updateUserBlocked
} from "../services/adminService";
import ActivityLogs from "../components/ActivityLogs";
import AdminHeader from "../components/AdminHeader";
import { useStoreSettings } from "../context/storeSettings";

const defaultShoeImage =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";

function AdminManagement() {
  const { settings, applySettings, formatCurrency } = useStoreSettings();
  const [searchParams] = useSearchParams();
  const validTabs = ["orders", "users", "categories", "logs", "settings"];
  const currentTab = searchParams.get("tab");
  const tab = validTabs.includes(currentTab) ? currentTab : "orders";

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currencyDraft, setCurrencyDraft] = useState(null);
  const currency = currencyDraft ?? settings.currency;

  // Orders UI state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDraft, setStatusDraft] = useState(null);
  const selectedStatus = statusDraft && selectedOrder && statusDraft.orderId === selectedOrder._id
    ? statusDraft.status
    : selectedOrder?.status || "Pending";

  useEffect(() => {
    let active = true;
    Promise.all([getAdminOrders(), getAdminUsers(), getCategories()])
      .then(([ordersResponse, usersResponse, categoriesResponse]) => {
        if (!active) return;
        setOrders(ordersResponse.data);
        setUsers(usersResponse.data);
        setCategories(categoriesResponse.data);
        if (ordersResponse.data?.length > 0) {
          setSelectedOrder((prev) => prev || ordersResponse.data[0]);
        }
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.response?.data?.message || "Unable to load admin data.");
      });
    return () => {
      active = false;
    };
  }, []);

  const saveSettings = async () => {
    try {
      const { data } = await updateStoreSettings({ currency });
      applySettings(data);
      setCurrencyDraft(null);
      setSuccessMessage("Settings saved successfully.");
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Unable to save settings.");
    }
  };

  const changeStatus = async (id, status) => {
    try {
      const response = await updateOrderStatus(id, status);
      setOrders((current) =>
        current.map((order) => (order._id === id ? response.data : order))
      );
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder(response.data);
      }
      setStatusDraft((current) => current?.orderId === id ? null : current);
      setSuccessMessage(`Order status updated to "${status}".`);
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (actionError) {
      setError(actionError.response?.data?.message || "Unable to update order.");
    }
  };

  const toggleBlocked = async (user) => {
    try {
      const response = await updateUserBlocked(user._id, !user.blocked);
      setUsers((current) =>
        current.map((item) => (item._id === user._id ? response.data : item))
      );
      setSuccessMessage(`User "${user.name}" ${user.blocked ? "unblocked" : "blocked"}.`);
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (actionError) {
      setError(actionError.response?.data?.message || "Unable to update user.");
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    if (!newCategory.trim()) return;
    try {
      const response = await createCategory(newCategory.trim());
      setCategories((current) => [...current, response.data]);
      setNewCategory("");
      setSuccessMessage(`Category "${response.data.name}" added.`);
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (actionError) {
      setError(actionError.response?.data?.message || "Unable to create category.");
    }
  };

  const removeCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      setCategories((current) => current.filter((category) => category._id !== id));
      setSuccessMessage("Category deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (actionError) {
      setError(actionError.response?.data?.message || "Unable to delete category.");
    }
  };

  const tabTitles = {
    orders: { title: "Orders", eyebrow: "Fulfilment & Tracking" },
    users: { title: "Customers", eyebrow: "User Accounts" },
    categories: { title: "Categories", eyebrow: "Catalog Structure" },
    logs: { title: "Activity Logs", eyebrow: "Real-time Audit Trail" },
    settings: { title: "Settings", eyebrow: "Store Configuration" }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (orderSearch.trim()) {
        const query = orderSearch.toLowerCase();
        const matchesId = order._id.toLowerCase().includes(query);
        const matchesEmail = order.email?.toLowerCase().includes(query);
        const matchesName = (order.customer?.name || "").toLowerCase().includes(query);
        return matchesId || matchesEmail || matchesName;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "highest") return (b.total || 0) - (a.total || 0);
      if (sortBy === "lowest") return (a.total || 0) - (b.total || 0);
      return 0;
    });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Paid":
      case "Completed":
        return "status-pill-paid";
      case "Delivered":
        return "status-pill-delivered";
      case "Shipped":
        return "status-pill-shipped";
      case "Pending":
      default:
        return "status-pill-pending";
    }
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDateFull = (dateStr) => {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="reference-content-wrap">
      {/* Top Header */}
      <AdminHeader
        title={tabTitles[tab]?.title || "Store Management"}
        eyebrow={tabTitles[tab]?.eyebrow || "Operations"}
      />

      {successMessage && <div className="toast-success">{successMessage}</div>}
      {error && <div className="toast-error">{error}</div>}

      {/* ORDERS TAB (Layout matching reference image exactly!) */}
      {tab === "orders" && (
        <div className="orders-workspace">
          {/* Main Orders Table Area */}
          <div className="orders-main-pane">
            {/* Toolbar Filter Row */}
            <div className="orders-toolbar">
              <div className="orders-toolbar-filters">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="toolbar-select"
                >
                  <option value="ALL">Any status</option>
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Paid">Paid</option>
                </select>

                <input
                  type="text"
                  placeholder="Search customer, ID, email..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="toolbar-search-input"
                />
              </div>

              <div className="orders-toolbar-sort">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="toolbar-select sort-select"
                >
                  <option value="newest">Sort by Date (Newest)</option>
                  <option value="oldest">Sort by Date (Oldest)</option>
                  <option value="highest">Sort by Amount (Highest)</option>
                  <option value="lowest">Sort by Amount (Lowest)</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="reference-table-card">
              <div className="admin-table-scroll orders-table-scroll">
                <table className="reference-orders-table">
                <thead>
                  <tr>
                    <th className="col-checkbox">
                      <input type="checkbox" readOnly />
                    </th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th className="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty-cell">
                        <ShoppingBag size={24} />
                        <p>No orders found matching your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrder?._id === order._id;
                      const customerName =
                        order.customer?.name ||
                        order.name ||
                        order.email?.split("@")[0] ||
                        "Valued Customer";
                      const customerInitial = customerName[0]?.toUpperCase() || "C";
                      const orderCode = `#${order._id.slice(-6).toUpperCase()}`;

                      return (
                        <tr
                          key={order._id}
                          className={`order-row ${isSelected ? "is-selected" : ""}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="col-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setSelectedOrder(order)}
                            />
                          </td>
                          <td className="col-order-id">
                            <span className="order-id-badge">{orderCode}</span>
                          </td>
                          <td className="col-customer">
                            <div className="customer-cell">
                              <div className="customer-avatar">
                                <span>{customerInitial}</span>
                              </div>
                              <span className="customer-name">{customerName}</span>
                            </div>
                          </td>
                          <td className="col-status">
                            <span className={`status-pill ${getStatusBadgeClass(order.status)}`}>
                              {order.status || "Pending"}
                            </span>
                          </td>
                          <td className="col-total">
                            <strong>{formatCurrency(order.total || 0)}</strong>
                          </td>
                          <td className="col-date">
                            <span>{formatDateShort(order.createdAt)}</span>
                          </td>
                          <td className="col-actions">
                            <button
                              type="button"
                              className="order-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                            >
                              ···
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Inspector Side Card (matching reference image!) */}
          {selectedOrder && (
            <aside className="order-inspector-card">
              {/* Header */}
              <div className="inspector-header">
                <div>
                  <h3>Order #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
                  <div className="inspector-status-row">
                    <span className={`status-pill ${getStatusBadgeClass(selectedOrder.status)}`}>
                      {selectedOrder.status || "Pending"}
                    </span>
                    <small className="inspector-time">{formatDateFull(selectedOrder.createdAt)}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="inspector-close-btn"
                  onClick={() => setSelectedOrder(null)}
                  title="Close Inspector"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Customer Avatar & Contacts */}
              <div className="inspector-customer-section">
                <div className="inspector-avatar-circle">
                  <span>
                    {(selectedOrder.customer?.name || selectedOrder.email || "C")[0].toUpperCase()}
                  </span>
                </div>
                <h4>
                  {selectedOrder.customer?.name ||
                    selectedOrder.name ||
                    selectedOrder.email?.split("@")[0] ||
                    "Customer"}
                </h4>
                <p className="inspector-email">{selectedOrder.email}</p>

                <div className="inspector-contact-icons">
                  <a
                    href={`mailto:${selectedOrder.email}`}
                    className="contact-icon-btn"
                    title="Send Email"
                  >
                    <Mail size={16} />
                  </a>
                  <button type="button" className="contact-icon-btn" title="Phone Customer">
                    <Phone size={16} />
                  </button>
                  <button type="button" className="contact-icon-btn" title="Chat Customer">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>

              {/* Order Items List */}
              <div className="inspector-items-section">
                <span className="inspector-section-label">Order items</span>
                <div className="inspector-items-list">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div className="inspector-item-row" key={idx}>
                        <img
                          src={item.image || item.product?.image || defaultShoeImage}
                          alt={item.name || item.product?.name || "Product"}
                          onError={(e) => {
                            e.currentTarget.src = defaultShoeImage;
                          }}
                        />
                        <div className="inspector-item-info">
                          <strong>{item.name || item.product?.name || `Item #${idx + 1}`}</strong>
                          <span>
                            {item.quantity ? `${item.quantity}x ` : ""}
                            {formatCurrency(item.price || 0)}
                            {item.size ? ` · Size ${item.size}` : ""}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="inspector-item-row">
                      <img src={defaultShoeImage} alt="Product package" />
                      <div className="inspector-item-info">
                        <strong>Standard Store Package</strong>
                        <span>1x {formatCurrency(selectedOrder.total || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total & Status Actions */}
              <div className="inspector-footer">
                <div className="inspector-total-row">
                  <span>Total</span>
                  <strong>{formatCurrency(selectedOrder.total || 0)}</strong>
                </div>

                <div className="inspector-actions-row">
                  <select
                    className="inspector-status-select"
                    aria-label="Order status"
                    value={selectedStatus}
                    onChange={(event) => setStatusDraft({ orderId: selectedOrder._id, status: event.target.value })}
                  >
                    <option value="Pending">Status: Pending</option>
                    <option value="Shipped">Status: Shipped</option>
                    <option value="Delivered">Status: Delivered</option>
                    <option value="Paid">Status: Paid</option>
                  </select>

                  <button
                    type="button"
                    className="inspector-action-btn primary"
                    disabled={!statusDraft || statusDraft.orderId !== selectedOrder._id || statusDraft.status === selectedOrder.status}
                    onClick={() => changeStatus(selectedOrder._id, statusDraft.status)}
                  >
                    {statusDraft?.orderId === selectedOrder._id ? `Update → ${statusDraft.status}` : "Choose a status"}
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* CUSTOMERS / USERS TAB */}
      {tab === "users" && (
        <div className="reference-card-section">
          <div className="reference-table-card">
            <div className="table-header-strip">
              <div>
                <span className="reference-eyebrow">Customer Registry</span>
                <h2>Registered Accounts ({users.length})</h2>
              </div>
            </div>

            <div className="admin-table-scroll customers-table-scroll">
              <table className="reference-orders-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="col-customer">
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          <span>{user.name?.[0]?.toUpperCase() || "U"}</span>
                        </div>
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          user.blocked ? "status-pill-pending" : "status-pill-paid"
                        }`}
                      >
                        {user.blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted">{formatDateShort(user.createdAt)}</span>
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className={`secondary-link ${
                          user.blocked ? "unblock-btn" : "block-btn"
                        }`}
                        onClick={() => toggleBlocked(user)}
                      >
                        {user.blocked ? (
                          <>
                            <UserCheck size={14} style={{ marginRight: 4 }} />
                            Unblock
                          </>
                        ) : (
                          <>
                            <UserX size={14} style={{ marginRight: 4 }} />
                            Block
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {tab === "categories" && (
        <div className="reference-card-section">
          <div className="reference-table-card">
            <div className="table-header-strip">
              <div>
                <span className="reference-eyebrow">Product Structure</span>
                <h2>Categories ({categories.length})</h2>
              </div>
              <form className="category-inline-form" onSubmit={addCategory}>
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name..."
                  required
                />
                <button type="submit" className="primary-button">
                  <Plus size={16} style={{ marginRight: 4 }} />
                  Add Category
                </button>
              </form>
            </div>

            <div className="categories-grid-modern">
              {categories.map((cat) => (
                <div className="category-card-modern" key={cat._id}>
                  <div className="category-icon-box">
                    <Package size={20} />
                  </div>
                  <div className="category-meta">
                    <strong>{cat.name}</strong>
                    <small>Catalog Tag</small>
                  </div>
                  <button
                    type="button"
                    className="category-delete-btn"
                    onClick={() => removeCategory(cat._id)}
                    title={`Delete ${cat.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY LOGS TAB */}
      {tab === "logs" && (
        <div className="reference-card-section">
          <div className="reference-table-card">
            <ActivityLogs />
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && (
        <div className="reference-card-section">
          <div className="reference-table-card settings-box">
            <div className="table-header-strip">
              <div>
                <span className="reference-eyebrow">Store Configuration</span>
                <h2>Admin Settings</h2>
              </div>
            </div>

            <div className="settings-fields-grid">
              <label>
                <span>Store Profile Name</span>
                <input defaultValue="KHAN E-Commerce" />
              </label>

              <label>
                <span>Support Email</span>
                <input defaultValue="support@khan.store" type="email" />
              </label>

              <label>
                <span>Currency Display</span>
                <select value={currency} onChange={(event) => setCurrencyDraft(event.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </label>

              <label>
                <span>Default Fulfillment SLA</span>
                <input defaultValue="2-3 Business Days" />
              </label>
            </div>

            <div className="settings-action-footer">
              <button
                type="button"
                className="primary-button"
                onClick={saveSettings}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManagement;
