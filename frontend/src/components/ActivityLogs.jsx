import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Trash2,
  RefreshCw,
  Search,
  PlusCircle,
  Edit3,
  Trash,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  FolderPlus,
  LogIn,
  Layers,
  Clock
} from "lucide-react";
import {
  ADMIN_ACTIVITY_CHANGED_EVENT,
  getAdminLogs,
  clearAdminLogs
} from "../services/adminService";

const actionMeta = {
  CREATE_PRODUCT: { label: "Product Created", icon: PlusCircle, color: "badge-green" },
  UPDATE_PRODUCT: { label: "Product Updated", icon: Edit3, color: "badge-amber" },
  DELETE_PRODUCT: { label: "Product Deleted", icon: Trash, color: "badge-red" },
  IMPORT_PRODUCTS: { label: "Products Imported", icon: Layers, color: "badge-green" },
  CREATE_CATEGORY: { label: "Category Created", icon: FolderPlus, color: "badge-blue" },
  UPDATE_CATEGORY: { label: "Category Updated", icon: Edit3, color: "badge-amber" },
  DELETE_CATEGORY: { label: "Category Deleted", icon: Trash, color: "badge-red" },
  UPDATE_ORDER_STATUS: { label: "Order Status", icon: ShoppingBag, color: "badge-purple" },
  BLOCK_USER: { label: "User Blocked", icon: ShieldAlert, color: "badge-red" },
  UNBLOCK_USER: { label: "User Unblocked", icon: ShieldCheck, color: "badge-green" },
  ADMIN_LOGIN: { label: "Admin Sign-in", icon: LogIn, color: "badge-indigo" },
  CLEAR_LOGS: { label: "Logs Cleared", icon: Trash2, color: "badge-gray" }
};

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 5) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatFullDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function ActivityLogs({ isCompact = false, limit = 100 }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [isClearing, setIsClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminLogs({
        targetType: targetType !== "ALL" ? targetType : undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        search: search.trim() || undefined,
        limit
      });
      setLogs(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retrieve activity logs.");
    } finally {
      setLoading(false);
    }
  }, [targetType, actionFilter, search, limit]);

  useEffect(() => {
    let active = true;
    getAdminLogs({
      targetType: targetType !== "ALL" ? targetType : undefined,
      action: actionFilter !== "ALL" ? actionFilter : undefined,
      search: search.trim() || undefined,
      limit
    })
      .then((res) => {
        if (active) {
          setLogs(res.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || "Unable to retrieve activity logs.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [targetType, actionFilter, search, limit]);

  useEffect(() => {
    window.addEventListener(ADMIN_ACTIVITY_CHANGED_EVENT, fetchLogs);
    return () => window.removeEventListener(ADMIN_ACTIVITY_CHANGED_EVENT, fetchLogs);
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all activity logs? This action cannot be undone.")) {
      return;
    }
    setIsClearing(true);
    try {
      await clearAdminLogs();
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear logs.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className={`activity-logs-container ${isCompact ? "is-compact" : ""}`}>
      {/* Header & Controls */}
      <div className="logs-header">
        <div className="logs-header-left">
          <div className="logs-title-row">
            <Activity className="logs-icon" size={20} />
            <h2>Admin Activity Logs</h2>
          </div>
          <p>Real-time audit records of product changes, category updates, and admin actions.</p>
        </div>

        <div className="logs-actions">
          <button
            type="button"
            className="secondary-link logs-btn"
            onClick={fetchLogs}
            disabled={loading}
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          {!isCompact && logs.length > 0 && (
            <button
              type="button"
              className="logs-clear-btn"
              onClick={handleClearLogs}
              disabled={isClearing}
              title="Clear all log history"
            >
              <Trash2 size={14} />
              <span>Clear logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {!isCompact && (
        <div className="logs-filter-bar">
          <div className="logs-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search logs by description, admin or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="logs-search-clear"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="logs-type-tabs">
            <label className="logs-action-filter">
              <span className="visually-hidden">Filter by action</span>
              <select
                className="logs-action-select"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                aria-label="Filter activity by action"
              >
                <option value="ALL">All actions</option>
                {Object.entries(actionMeta).map(([action, meta]) => (
                  <option key={action} value={action}>{meta.label}</option>
                ))}
              </select>
            </label>
            {["ALL", "Product", "Category", "Order", "User", "Auth"].map((type) => (
              <button
                key={type}
                type="button"
                className={`logs-tab-chip ${targetType === type ? "is-active" : ""}`}
                onClick={() => setTargetType(type)}
              >
                {type === "ALL" ? "All Activity" : type}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      {/* Logs Stream */}
      <div className="logs-list-wrap">
        {loading && logs.length === 0 ? (
          <div className="logs-loading">
            <RefreshCw className="spin" size={24} />
            <p>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="logs-empty">
            <Clock size={32} />
            <p>No activity logs found {search ? "matching your query." : "yet. Any store changes will appear here."}</p>
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log) => {
              const meta = actionMeta[log.action] || {
                label: log.action || "Action",
                icon: Activity,
                color: "badge-gray"
              };
              const IconComponent = meta.icon;

              return (
                <div className="log-row" key={log._id}>
                  <div className={`log-badge ${meta.color}`}>
                    <IconComponent size={14} />
                    <span>{meta.label}</span>
                  </div>

                  <div className="log-content">
                    <p className="log-description">{log.description}</p>
                    <div className="log-meta">
                      <span className="log-actor">By: {log.adminEmail || "Admin"}</span>
                      <span className="log-target-tag">{log.targetType || "System"}</span>
                    </div>
                  </div>

                  <div className="log-timestamp" title={formatFullDate(log.createdAt)}>
                    <Clock size={12} />
                    <span>{formatTimeAgo(log.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityLogs;
