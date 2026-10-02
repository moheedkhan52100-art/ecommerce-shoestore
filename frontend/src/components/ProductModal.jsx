import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, Check, Plus, AlertCircle, Loader2 } from "lucide-react";
import { createProduct, getProduct, updateProduct } from "../services/productService";
import { getCategories as fetchCategories, notifyAdminActivityChanged } from "../services/adminService";
import { useStoreSettings } from "../context/storeSettings";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  audience: "",
  color: "",
  sport: "",
  sportswearType: "",
  fit: "",
  material: "",
  stock: "",
  image: "",
  modelUrl: ""
};

function ProductModal({ isOpen, onClose, mode = "add", productId = null, onSuccess }) {
  const { settings } = useStoreSettings();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [modelFile, setModelFile] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [sizeInput, setSizeInput] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCategories().then(({ data }) => setCategories(data.map((item) => item.name))).catch(() => setCategories([]));
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, onClose]);

  // Load product if editing
  useEffect(() => {
    if (!isOpen || !isEdit || !productId) return;

    let active = true;

    getProduct(productId)
      .then((response) => {
        if (!active) return;
        const data = response.data;
        setForm({
          name: data.name || "",
          description: data.description || "",
          price: data.price ?? "",
          category: data.category || "",
          audience: data.audience || "",
          color: data.color || "",
          sport: data.sport || "",
          sportswearType: data.sportswearType || "",
          fit: data.fit || "",
          material: data.material || "",
          stock: data.stock ?? "",
          image: data.image || "",
          modelUrl: data.modelUrl || ""
        });
        setSizes(data.sizes || []);
        setImagePreview(data.image || "");
        setImageFile(null);
        setImageFiles([]);
        setModelFile(null);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "Failed to load product details.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, isEdit, productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addSize = () => {
    const size = sizeInput.trim();
    if (size && !sizes.includes(size)) {
      setSizes((prev) => [...prev, size]);
    }
    setSizeInput("");
  };

  const togglePresetSize = (preset) => {
    if (sizes.includes(preset)) {
      setSizes(sizes.filter((s) => s !== preset));
    } else {
      setSizes([...sizes, preset]);
    }
  };

  const addStandardSizes = () => {
    const defaultList =
      form.audience === "Sportswear"
        ? ["XS", "S", "M", "L", "XL", "2XL"]
        : ["38", "39", "40", "41", "42", "43", "44"];
    const merged = Array.from(new Set([...sizes, ...defaultList]));
    setSizes(merged);
  };

  const handleImageDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageFile = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) {
      setImageFile(files[0]);
      setImageFiles(files);
      setImagePreview(URL.createObjectURL(files[0]));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        imageFile,
        imageFiles,
        modelFile,
        sizes,
        price: Number(form.price),
        stock: Number(form.stock)
      };

      let response;
      if (isEdit) {
        response = await updateProduct(productId, payload);
      } else {
        response = await createProduct(payload);
      }

      localStorage.setItem("khan-products-updated", Date.now().toString());
      notifyAdminActivityChanged();

      if (onSuccess) {
        onSuccess(response.data, isEdit ? "update" : "create");
      }
      onClose();
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          (submitError.request
            ? "Unable to connect to the server. Please check backend connection."
            : `Unable to ${isEdit ? "update" : "create"} product.`)
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="product-modal-overlay" onClick={onClose}>
        <motion.div
          className="product-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          {/* Modal Header */}
          <header className="product-modal-header">
            <div>
              <p className="eyebrow">{isEdit ? "Edit Catalog Item" : "New Inventory"}</p>
              <h2 id="product-modal-title">
                {isEdit ? (form.name ? `Edit: ${form.name}` : "Edit Product") : "Add New Product"}
              </h2>
            </div>
            <button
              type="button"
              className="product-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </header>

          {/* Modal Content */}
          <div className="product-modal-body">
            {loading ? (
              <div className="product-modal-loading">
                <Loader2 className="spinner" size={32} />
                <p>Loading product information...</p>
              </div>
            ) : (
              <form className="modal-product-form" onSubmit={handleSubmit} id="productModalForm">
                {error && (
                  <div className="product-modal-error" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="modal-form-grid">
                  <label className="form-full">
                    <span>Product Name *</span>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Air Max Fusion 90"
                      required
                    />
                  </label>

                  <label className="form-full">
                    <span>Description *</span>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Detailed product story, materials, and benefits..."
                      required
                      rows="3"
                    />
                  </label>

                  <label>
                    <span>Price ({settings.currency}) *</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="189.99"
                      required
                    />
                  </label>

                  <label>
                    <span>Stock Quantity *</span>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="25"
                      required
                    />
                  </label>

                  <label>
                    <span>Category *</span>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select a category</option>
                      {[...new Set([...categories, ...(form.category && !categories.includes(form.category) ? [form.category] : [])])].map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </label>

                  <label>
                    <span>Store Section (Audience)</span>
                    <select name="audience" value={form.audience} onChange={handleChange}>
                      <option value="">All sections (General)</option>
                      {["Men", "Women", "Kids", "Jordan", "NikeSKIMS", "Sport", "Sportswear"].map(
                        (item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                {/* Sizing Section */}
                <div className="size-manager modal-size-manager">
                  <label htmlFor="modal-product-size">
                    Available Sizes {form.audience === "Sportswear" ? "(Apparel / Clothing)" : "(Footwear / Shoes)"}
                  </label>
                  <div className="size-presets">
                    <span className="size-presets-label">Quick presets:</span>
                    {(form.audience === "Sportswear"
                      ? ["XS", "S", "M", "L", "XL", "2XL", "3XL"]
                      : ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
                    ).map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        className={`size-preset-chip ${sizes.includes(preset) ? "is-selected" : ""}`}
                        onClick={() => togglePresetSize(preset)}
                      >
                        {preset} {sizes.includes(preset) ? <Check size={12} /> : <Plus size={12} />}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="size-preset-all-btn"
                      onClick={addStandardSizes}
                    >
                      + Add standard set
                    </button>
                  </div>
                  <div className="size-manager-input">
                    <input
                      id="modal-product-size"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder={form.audience === "Sportswear" ? "e.g. M, L, XL" : "e.g. 42"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSize();
                        }
                      }}
                    />
                    <button type="button" onClick={addSize}>
                      Add size
                    </button>
                  </div>
                  <div className="size-manager-list">
                    {sizes.map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setSizes(sizes.filter((item) => item !== size))}
                      >
                        {size} <span aria-hidden="true">×</span>
                      </button>
                    ))}
                    {sizes.length === 0 && (
                      <small className="size-hint">
                        No sizes selected yet. Use quick presets above or enter custom sizes.
                      </small>
                    )}
                  </div>
                </div>

                {/* Sportswear specifics */}
                {form.audience === "Sportswear" && (
                  <fieldset className="sportswear-options modal-sportswear">
                    <legend>Sportswear Details</legend>
                    <p>Activity, fit, and material specification</p>
                    <div className="modal-form-grid">
                      <label>
                        Activity
                        <select name="sport" value={form.sport} onChange={handleChange} required>
                          <option value="">Select activity</option>
                          {["Running", "Training", "Football", "Basketball", "Yoga", "Outdoor"].map(
                            (item) => (
                              <option key={item}>{item}</option>
                            )
                          )}
                        </select>
                      </label>
                      <label>
                        Product type
                        <select
                          name="sportswearType"
                          value={form.sportswearType}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select type</option>
                          {[
                            "T-shirt",
                            "Track suit",
                            "Hoodie",
                            "Jacket",
                            "Shorts",
                            "Leggings"
                          ].map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Fit
                        <select name="fit" value={form.fit} onChange={handleChange} required>
                          <option value="">Select fit</option>
                          {["Slim", "Regular", "Relaxed", "Compression"].map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Material
                        <select
                          name="material"
                          value={form.material}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select material</option>
                          {["Polyester", "Cotton blend", "Fleece", "Performance knit"].map(
                            (item) => (
                              <option key={item}>{item}</option>
                            )
                          )}
                        </select>
                      </label>
                    </div>
                  </fieldset>
                )}

                <div className="modal-form-grid">
                  <label>
                    <span>Color</span>
                    <input
                      name="color"
                      value={form.color}
                      onChange={handleChange}
                      placeholder="e.g. Midnight Navy / Gold"
                    />
                  </label>

                  <label>
                    <span>Direct Image URL</span>
                    <input
                      name="image"
                      type="url"
                      value={form.image}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </label>
                </div>

                {/* Image Dropzone & File picker */}
                <div className="modal-media-section">
                  <label className="form-full">
                    <span>{isEdit ? "Replace / Upload Product Images" : "Upload Product Images"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={handleImageFile}
                    />
                  </label>

                  <div
                    className="image-dropzone modal-dropzone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleImageDrop}
                  >
                    <UploadCloud size={28} />
                    <span>Drag and drop image file here or browse above</span>
                    {imagePreview && (
                      <div className="modal-image-preview">
                        <img src={imagePreview} alt="Product preview" />
                        <small>Preview</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3D Model Option */}
                {form.audience === "Sportswear" ? (
                  <div className="sportswear-model-note">
                    <p>ℹ️ 3D Model is disabled for Sportswear apparel (available for Footwear/Sneakers).</p>
                  </div>
                ) : (
                  <div className="modal-form-grid">
                    <label>
                      <span>3D Model URL (.glb / .gltf)</span>
                      <input
                        name="modelUrl"
                        type="url"
                        value={form.modelUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/shoe.glb"
                      />
                    </label>
                    <label>
                      <span>{isEdit ? "Replace 3D Model File" : "Upload 3D Model File (.glb)"}</span>
                      <input
                        type="file"
                        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                        onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Modal Footer */}
          <footer className="product-modal-footer">
            <button
              type="button"
              className="secondary-link modal-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="productModalForm"
              className="primary-button modal-submit-btn"
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>{isEdit ? "Saving Changes..." : "Creating Product..."}</span>
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Product"
              )}
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProductModal;
