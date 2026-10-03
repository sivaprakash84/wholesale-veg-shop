import { useEffect, useState } from "react";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";

const getAuthConfig = () => {
  const token = localStorage.getItem("adminToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const API_URL = "https://wholesale-veg-shop.onrender.com/api/products";

function AdminProducts() {
  const { language } = useLanguage();

  const emptyProduct = {
    name: "",
    nameTa: "",
    category: "Vegetables",
    price: "",
    pricePerKg: "",
    unit: "kg",
    weightPerUnitKg: "1",
    stock: "",
    image: "",
    description: "",
    isAvailable: true,
  };

  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ================================
  // LOAD PRODUCTS
  // ================================

  const loadProducts = async () => {
    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load products.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ================================
  // HANDLE INPUT
  // ================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================================
  // CALCULATE UNIT PRICE
  // ================================

  const calculateUnitPrice = () => {
    const pricePerKg = Number(product.pricePerKg);
    const weightPerUnitKg = Number(product.weightPerUnitKg);

    if (
      !Number.isNaN(pricePerKg) &&
      !Number.isNaN(weightPerUnitKg) &&
      pricePerKg >= 0 &&
      weightPerUnitKg > 0
    ) {
      return Math.round(pricePerKg * weightPerUnitKg);
    }

    return 0;
  };

  // ================================
  // ADD / UPDATE PRODUCT
  // ================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setError("");

      // English name
      if (!product.name.trim()) {
        setError("Please enter the vegetable name in English.");
        setLoading(false);
        return;
      }

      // Tamil name
      if (!product.nameTa.trim()) {
        setError("Please enter the vegetable name in Tamil.");
        setLoading(false);
        return;
      }

      if (product.pricePerKg === "") {
        setError("Please enter the price per kg.");
        setLoading(false);
        return;
      }

      if (product.weightPerUnitKg === "") {
        setError("Please enter the weight per selling unit.");
        setLoading(false);
        return;
      }

      if (product.stock === "") {
        setError("Please enter the stock.");
        setLoading(false);
        return;
      }

      const pricePerKg = Number(product.pricePerKg);
      const weightPerUnitKg = Number(product.weightPerUnitKg);
      const stock = Number(product.stock);

      if (pricePerKg < 0) {
        setError("Price per kg cannot be negative.");
        setLoading(false);
        return;
      }

      if (weightPerUnitKg <= 0) {
        setError("Weight per unit must be greater than 0.");
        setLoading(false);
        return;
      }

      if (stock < 0) {
        setError("Stock cannot be negative.");
        setLoading(false);
        return;
      }

      // Price for one selling unit
      const calculatedPrice = Math.round(
        pricePerKg * weightPerUnitKg
      );

      // ================================
      // DATA SENT TO MONGODB
      // ================================

      const productData = {
        name: product.name.trim(),

        // Tamil name
        nameTa: product.nameTa.trim(),

        category: product.category,

        // Selling unit price
        price: calculatedPrice,

        // Internal/admin price per kg
        pricePerKg: pricePerKg,

        // Selling unit
        // Bundle is used instead of Moodai
       unit: product.unit.trim(),

        weightPerUnitKg: weightPerUnitKg,

        stock: stock,

        image: product.image.trim(),

        description: product.description.trim(),

        isAvailable: product.isAvailable,
      };

      console.log("PRODUCT DATA BEING SENT:", productData);

      // ================================
      // UPDATE EXISTING PRODUCT
      // ================================

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          productData,
          getAuthConfig()
        );

        setMessage("Product updated successfully.");
      }

      // ================================
      // ADD NEW PRODUCT
      // ================================

      else {
        await axios.post(
          API_URL,
          productData,
          getAuthConfig()
        );

        setMessage("Product added successfully.");
      }

      setProduct(emptyProduct);
      setEditingId(null);

      await loadProducts();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Something went wrong while saving the product."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // EDIT PRODUCT
  // ================================

  const handleEdit = (item) => {
    setEditingId(item._id);

    setProduct({
      name: item.name || "",

      // Existing products may not have Tamil name
      nameTa: item.nameTa || "",

      category: item.category || "Vegetables",

      pricePerKg:
        item.pricePerKg !== undefined
          ? item.pricePerKg
          : item.weightPerUnitKg
          ? Number(item.price || 0) /
            Number(item.weightPerUnitKg)
          : item.price || "",

      price: item.price || "",

      // Convert old Moodai value to Bundle
      unit: item.unit || "kg",

      weightPerUnitKg:
        item.weightPerUnitKg !== undefined
          ? item.weightPerUnitKg
          : 1,

      stock: item.stock ?? "",

      image: item.image || "",

      description: item.description || "",

      isAvailable:
        item.isAvailable !== undefined
          ? item.isAvailable
          : true,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================================
  // DELETE PRODUCT
  // ================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vegetable?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMessage("Product deleted successfully.");

      await loadProducts();
    } catch (err) {
      console.error(err);
      setError("Unable to delete product.");
    }
  };

  // ================================
  // CANCEL EDIT
  // ================================

  const cancelEdit = () => {
    setEditingId(null);
    setProduct(emptyProduct);
    setMessage("");
    setError("");
  };

  // ================================
  // ENABLE / DISABLE
  // ================================

  const toggleAvailability = async (item) => {
    try {
      setMessage("");
      setError("");

      await axios.put(
        `${API_URL}/${item._id}`,
        {
          ...item,
          isAvailable: !item.isAvailable,
        },
        getAuthConfig()
      );

      await loadProducts();
    } catch (err) {
      console.error(err);
      setError("Unable to update availability.");
    }
  };

  const unitPrice = calculateUnitPrice();

  // ================================
  // UNIT LABEL
  // ================================

  const getUnitLabel = (unit) => {
    if (!unit) {
      return "-";
    }

    const normalizedUnit = unit
      .toString()
      .trim()
      .toLowerCase();

    const unitLabels = {
      kg: {
        en: "kg",
        ta: "கிலோ",
      },

      bundle: {
        en: "Bundle",
        ta: "மூட்டை",
      },

      piece: {
        en: "Piece",
        ta: "துண்டு",
      },

      pieces: {
        en: "Pieces",
        ta: "துண்டுகள்",
      },

      bag: {
        en: "Bag",
        ta: "பை",
      },

      bags: {
        en: "Bags",
        ta: "பைகள்",
      },

      box: {
        en: "Box",
        ta: "பெட்டி",
      },

      boxes: {
        en: "Boxes",
        ta: "பெட்டிகள்",
      },

      bunch: {
        en: "Bunch",
        ta: "கொத்து",
      },

      bunches: {
        en: "Bunches",
        ta: "கொத்துகள்",
      },

      litre: {
        en: "Litre",
        ta: "லிட்டர்",
      },

      litres: {
        en: "Litres",
        ta: "லிட்டர்கள்",
      },

      crate: {
        en: "Crate",
        ta: "பெட்டி",
      },
    };

    return (
      unitLabels[normalizedUnit]?.[language] ||
      unit
    );
  };

  // ================================
  // UI
  // ================================

  return (
    <div className="admin-container">

      {/* HEADER */}

      <div className="admin-page-header">
        <div>
          <p className="section-label">
            SHOP ADMIN
          </p>

          <h1>
            Product Management
          </h1>

          <p>
            Add vegetables and manage wholesale
            price, selling unit, weight, stock
            and availability.
          </p>
        </div>
      </div>

      {/* SUCCESS */}

      {message && (
        <div className="admin-success">
          ✅ {message}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="admin-error">
          ⚠️ {error}
        </div>
      )}

      {/* ================================
          PRODUCT FORM
      ================================= */}

      <div className="admin-form-card">

        <h2>
          {editingId
            ? "✏️ Edit Vegetable"
            : "➕ Add New Vegetable"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="admin-form-grid">

            {/* ENGLISH NAME */}

            <div className="form-group">
              <label>
                Vegetable Name (English)
              </label>

              <input
                type="text"
                name="name"
                placeholder="Example: Tomato"
                value={product.name}
                onChange={handleChange}
              />
            </div>

            {/* TAMIL NAME */}

            <div className="form-group">
              <label>
                Vegetable Name (Tamil)
              </label>

              <input
                type="text"
                name="nameTa"
                placeholder="Example: தக்காளி"
                value={product.nameTa}
                onChange={handleChange}
              />

              <small>
                This name will be shown when customers select Tamil.
              </small>
            </div>

            {/* CATEGORY */}

            <div className="form-group">
              <label>
                Category
              </label>

              <select
                name="category"
                value={product.category}
                onChange={handleChange}
              >
                <option value="Vegetables">
                  Vegetables
                </option>

                <option value="Fruits">
                  Fruits
                </option>

                <option value="Pulses">
                  Pulses
                </option>

                <option value="Leafy Vegetables">
                  Leafy Vegetables
                </option>

                <option value="Others">
                  Others
                </option>
              </select>
            </div>

            {/* PRICE PER KG */}

            <div className="form-group">
              <label>
                Wholesale Price / kg (₹)
              </label>

              <input
                type="number"
                name="pricePerKg"
                min="0"
                step="0.01"
                placeholder="Example: 27"
                value={product.pricePerKg}
                onChange={handleChange}
              />

              <small>
                Admin price per kg.
              </small>
            </div>

            {/* SELLING UNIT */}

            <div className="form-group">
              <label>
                Selling Unit
              </label>

              <select
                name="unit"
                value={product.unit}
                onChange={handleChange}
              >
                <option value="kg">
                  kg
                </option>

                <option value="Bundle">
                  Bundle
                </option>

                <option value="Bag">
                  Bag
                </option>

                <option value="Box">
                  Box
                </option>

                <option value="Crate">
                  Crate
                </option>

                <option value="Piece">
                  Piece
                </option>
              </select>
            </div>

            {/* WEIGHT PER UNIT */}

            <div className="form-group">
              <label>
                Weight per {getUnitLabel(product.unit)} (kg)
              </label>

              <input
                type="number"
                name="weightPerUnitKg"
                min="0.001"
                step="0.001"
                placeholder="Example: 55"
                value={product.weightPerUnitKg}
                onChange={handleChange}
              />

              <small>
                Example: 1 Bundle = 55 kg
              </small>
            </div>

            {/* CALCULATED PRICE */}

            <div className="form-group">
              <label>
                Price per {getUnitLabel(product.unit)} (₹)
              </label>

              <input
                type="number"
                value={unitPrice}
                readOnly
              />

              <small>
                Automatically calculated from ₹/kg.
              </small>
            </div>

            {/* STOCK */}

            <div className="form-group">
              <label>
                Stock ({getUnitLabel(product.unit)})
              </label>

              <input
                type="number"
                name="stock"
                min="0"
                step="1"
                placeholder="Example: 100"
                value={product.stock}
                onChange={handleChange}
              />
            </div>

            {/* IMAGE */}

            <div className="form-group">
              <label>
                Image URL
              </label>

              <input
                type="text"
                name="image"
                placeholder="https://..."
                value={product.image}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* PRICE PREVIEW */}

          {product.pricePerKg !== "" &&
            product.weightPerUnitKg !== "" &&
            Number(product.weightPerUnitKg) > 0 && (

              <div
                style={{
                  marginTop: "20px",
                  padding: "16px 18px",
                  borderRadius: "12px",
                  background: "#f5f7f5",
                  border: "1px solid #e1e5e1",
                }}
              >
                <strong>
                  Customer Price Preview
                </strong>

                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    ₹
                    {Number(
                      product.pricePerKg
                    ).toFixed(2)}
                    {" / kg"}
                  </span>

                  <span>
                    1 {getUnitLabel(product.unit)} ={" "}
                    {Number(
                      product.weightPerUnitKg
                    )} kg
                  </span>

                  <strong>
                    ₹{unitPrice} / {getUnitLabel(product.unit)}
                  </strong>
                </div>
              </div>
            )}

          {/* DESCRIPTION */}

          <div
            className="form-group"
            style={{
              marginTop: "20px",
            }}
          >
            <label>
              Description
            </label>

            <textarea
              name="description"
              placeholder="Fresh wholesale tomato..."
              value={product.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* AVAILABILITY */}

          <label className="availability-check">

            <input
              type="checkbox"
              name="isAvailable"
              checked={product.isAvailable}
              onChange={handleChange}
            />

            Product is available for customers

          </label>

          {/* BUTTONS */}

          <div className="admin-form-buttons">

            <button
              type="submit"
              className="admin-primary-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Vegetable"
                : "Add Vegetable"}
            </button>

            {editingId && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={cancelEdit}
              >
                Cancel Edit
              </button>
            )}

          </div>

        </form>
      </div>

      {/* ================================
          PRODUCT LIST
      ================================= */}

      <div className="admin-list-card">

        <div className="admin-list-header">

          <div>
            <h2>
              🥕 Current Vegetables
            </h2>

            <p>
              {products.length} products in database
            </p>
          </div>

        </div>

        <div className="admin-product-table">

          {products.length === 0 ? (

            <div className="admin-empty">
              No vegetables found.
            </div>

          ) : (

            products.map((item) => {

              const itemPricePerKg =
                item.pricePerKg !== undefined
                  ? Number(item.pricePerKg)
                  : item.weightPerUnitKg
                  ? Number(item.price || 0) /
                    Number(item.weightPerUnitKg)
                  : 0;

              const itemWeight =
                item.weightPerUnitKg || 1;

              return (

                <div
                  className="admin-product-row"
                  key={item._id}
                >

                  {/* IMAGE */}

                  <div className="admin-product-image">

                    {item.image ? (

                      <img
                        src={item.image}
                        alt={item.name}
                      />

                    ) : (

                      <span>
                        🥬
                      </span>

                    )}

                  </div>

                  {/* PRODUCT INFO */}

                  <div className="admin-product-info">

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      Tamil:{" "}
                      {item.nameTa || "Not added"}
                    </p>

                    <p>
                      ₹
                      {Number(
                        item.price || 0
                      ).toFixed(0)}
                      {" / "}
                      {getUnitLabel(item.unit || "kg")}
                    </p>

                    <small>
                      ₹
                      {itemPricePerKg.toFixed(2)}
                      {" / kg"}
                    </small>

                    <small>
                      1 {getUnitLabel(item.unit || "unit")} ={" "}
                      {itemWeight} {getUnitLabel("kg")}
                    </small>

                  </div>

                  {/* STOCK */}

                  <div className="admin-stock">

                    <strong>
                      {item.stock}
                    </strong>

                    <span>
                      {getUnitLabel(item.unit || "unit")} stock
                    </span>

                  </div>

                  {/* AVAILABILITY */}

                  <div>

                    {item.isAvailable ? (

                      <span className="status-available">
                        Available
                      </span>

                    ) : (

                      <span className="status-unavailable">
                        Unavailable
                      </span>

                    )}

                  </div>

                  {/* ACTIONS */}

                  <div className="admin-actions">

                    <button
                      className="admin-edit-button"
                      onClick={() =>
                        handleEdit(item)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="admin-toggle-button"
                      onClick={() =>
                        toggleAvailability(item)
                      }
                    >
                      {item.isAvailable
                        ? "Disable"
                        : "Enable"}
                    </button>

                    <button
                      className="admin-delete-button"
                      onClick={() =>
                        handleDelete(item._id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              );
            })

          )}

        </div>
      </div>

    </div>
  );
}

export default AdminProducts;