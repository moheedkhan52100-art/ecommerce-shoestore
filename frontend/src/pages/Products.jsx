import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Plus,
  Upload,
  Edit,
  Trash2,
  Search,
  Package
} from "lucide-react";
import { createProduct, deleteProduct, getProducts } from "../services/productService";
import { createAdminLog } from "../services/adminService";
import ProductModal from "../components/ProductModal";
import AdminHeader from "../components/AdminHeader";
import { useStoreSettings } from "../context/storeSettings";

const defaultShoeImage =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80";

function Products({ initialModal = null }) {
  const { formatCurrency } = useStoreSettings();
  const { id: paramId } = useParams();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkMessage, setBulkMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedAudience, setSelectedAudience] = useState("ALL");

  // In-page modal state for adding and editing products
  const [modalState, setModalState] = useState(() => {
    if (initialModal === "add" || location.pathname === "/products/add") {
      return { isOpen: true, mode: "add", productId: null };
    }
    if ((initialModal === "edit" || location.pathname.startsWith("/products/edit")) && paramId) {
      return { isOpen: true, mode: "edit", productId: paramId };
    }
    return { isOpen: false, mode: "add", productId: null };
  });

  useEffect(() => {
    let active = true;
    getProducts()
      .then((res) => {
        if (active) {
          setProducts(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const openAddModal = () => {
    setModalState({
      isOpen: true,
      mode: "add",
      productId: null
    });
  };

  const openEditModal = (productId) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      productId
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleModalSuccess = (savedProduct, actionType) => {
    if (actionType === "create") {
      setProducts((current) => [savedProduct, ...current]);
      setBulkMessage(`Product "${savedProduct.name}" created successfully.`);
    } else {
      setProducts((current) =>
        current.map((item) => (item._id === savedProduct._id ? savedProduct : item))
      );
      setBulkMessage(`Product "${savedProduct.name}" updated successfully.`);
    }
    setTimeout(() => setBulkMessage(""), 4000);
  };

  const importCsv = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const [, ...rows] = String(reader.result).split(/\r?\n/).filter(Boolean);
        const created = await Promise.all(
          rows.map((row) => {
            const [name, description, price, stock, category, color, image] = row.split(",");
            return createProduct({
              name,
              description,
              price: Number(price),
              stock: Number(stock),
              category,
              color,
              image
            });
          })
        );
        const newProducts = created.map((response) => response.data);
        setProducts((current) => [...newProducts, ...current]);
        setBulkMessage(`${created.length} products imported successfully.`);

        // Log bulk import to admin audit logs
        const adminData = JSON.parse(localStorage.getItem("admin") || "{}");
        await createAdminLog({
          adminEmail: adminData.email || "Admin",
          action: "IMPORT_PRODUCTS",
          description: `Bulk imported ${created.length} products via CSV upload`,
          targetType: "Product",
          metadata: { count: created.length }
        });
      } catch (err) {
        setActionError("Failed to import CSV products: " + (err.message || "Invalid format."));
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try {
      await deleteProduct(product._id);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      setBulkMessage(`Product "${product.name}" deleted.`);
      setTimeout(() => setBulkMessage(""), 4000);
    } catch (deleteError) {
      setActionError(deleteError.response?.data?.message || "Unable to delete product.");
    }
  };

  // Distinct categories & audiences for filters
  const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const allAudiences = ["Men", "Women", "Kids", "Jordan", "NikeSKIMS", "Sport", "Sportswear"];

  const filteredProducts = products.filter((product) => {
    if (selectedCategory !== "ALL" && product.category !== selectedCategory) return false;
    if (selectedAudience !== "ALL" && product.audience !== selectedAudience) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesName = product.name?.toLowerCase().includes(q);
      const matchesCat = product.category?.toLowerCase().includes(q);
      const matchesDesc = product.description?.toLowerCase().includes(q);
      return matchesName || matchesCat || matchesDesc;
    }
    return true;
  });

  return (
    <div className="reference-content-wrap">
      {/* Top Header */}
      <AdminHeader title="Products" eyebrow="Catalog & Inventory">
        <div className="header-action-group">
          <label className="secondary-link file-button header-csv-btn">
            <Upload size={14} style={{ marginRight: 6 }} />
            Bulk CSV
            <input type="file" accept=".csv" onChange={importCsv} />
          </label>
          <button
            type="button"
            className="primary-button header-add-btn"
            onClick={openAddModal}
          >
            <Plus size={16} style={{ marginRight: 6 }} />
            Add Product
          </button>
        </div>
      </AdminHeader>

      {bulkMessage && <div className="toast-success">{bulkMessage}</div>}
      {actionError && <div className="toast-error">{actionError}</div>}

      {/* Catalog Filter Bar */}
      <div className="products-filter-strip">
        <div className="products-filter-left">
          <div className="catalog-search-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search products by name, tag, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="toolbar-select"
          >
            <option value="ALL">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="toolbar-select"
          >
            <option value="ALL">All Sections</option>
            {allAudiences.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="products-count-badge">
          <span>{filteredProducts.length} items active</span>
        </div>
      </div>

      {/* Main Catalog Inventory Table */}
      <div className="reference-card-section">
        <div className="reference-table-card">
          <div className="table-header-strip">
            <div>
              <span className="reference-eyebrow">Inventory View</span>
              <h2>Product Catalog ({filteredProducts.length})</h2>
            </div>
            <button
              type="button"
              className="secondary-link quick-add-trigger"
              onClick={openAddModal}
            >
              <Plus size={14} style={{ marginRight: 4 }} />
              New Product
            </button>
          </div>

          {loading ? (
            <div className="table-loading-state">
              <Package className="spin" size={28} />
              <p>Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="table-empty-notice">
              <Package size={36} />
              <p>No products found matching your active filters.</p>
              <button
                type="button"
                className="primary-button"
                onClick={openAddModal}
                style={{ marginTop: 12 }}
              >
                <Plus size={16} style={{ marginRight: 6 }} />
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="admin-table-scroll product-table-scroll">
              <table className="reference-orders-table product-management-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Section</th>
                    <th>Sizes</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    return (
                      <tr key={product._id} className="product-item-row">
                      <td className="col-product-info">
                        <div className="product-cell-wrap">
                          <img
                            src={product.image || defaultShoeImage}
                            alt={product.name}
                            className="product-table-thumb"
                            onError={(e) => {
                              e.currentTarget.src = defaultShoeImage;
                            }}
                          />
                          <div className="product-title-column">
                            <strong className="product-title-text">{product.name}</strong>
                            <span className="product-desc-snippet">
                              {product.description || "No description"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag-pill">
                          {product.category || "General"}
                        </span>
                      </td>
                      <td>
                        <span className="audience-tag-pill">
                          {product.audience || "All"}
                        </span>
                      </td>
                        <td>
                          <div className="product-sizes-chipset" aria-label="Available sizes">
                            {product.sizes && product.sizes.length > 0 ? (
                              product.sizes.map((size) => (
                                <span key={size} className="size-micro-chip">
                                  {size}
                                </span>
                              ))
                            ) : (
                              <span className="size-micro-chip">Std</span>
                            )}
                          </div>
                        </td>
                      <td>
                        <strong className="product-table-price">
                          {formatCurrency(product.price)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`stock-indicator ${
                            product.stock <= 5 ? "is-low" : "is-healthy"
                          }`}
                        >
                          {product.stock} in stock
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="row-action-btns">
                          <button
                            type="button"
                            className="table-action-btn edit"
                            onClick={() => openEditModal(product._id)}
                            title="Edit Product (In-Page)"
                          >
                            <Edit size={15} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete"
                            onClick={() => handleDelete(product)}
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* In-page Product Modal with Blurred Backdrop */}
      <ProductModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        mode={modalState.mode}
        productId={modalState.productId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default Products;
