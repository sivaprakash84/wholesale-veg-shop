import { useCart } from "../context/CartContext";
import { useLanguage } from "../i18n/LanguageContext";
import { BACKEND_URL } from "../api/apiConfig";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { t, language } = useLanguage();

  const weightPerUnitKg = Number(
    product.weightPerUnitKg || 1
  );

  // Show Tamil product name when Tamil is selected
  const productName =
    language === "ta"
      ? product.nameTa || product.name
      : product.name;

  // Unit translation
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

      moodai: {
        en: "Bundle",
        ta: "மூட்டை",
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

      box: {
        en: "Box",
        ta: "பெட்டி",
      },

      boxes: {
        en: "Boxes",
        ta: "பெட்டிகள்",
      },

      bag: {
        en: "Bag",
        ta: "பை",
      },

      bags: {
        en: "Bags",
        ta: "பைகள்",
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
    };

    return (
      unitLabels[normalizedUnit]?.[language] ||
      unit
    );
  };

  return (
    <div className="product-card">

      <img
  src={
  !product.image
    ? ""
    : product.image.startsWith("http")
      ? product.image
      : product.image.startsWith("/")
        ? product.image
        : `${BACKEND_URL}/${product.image.replace(/^\/+/, "")}`
}
  alt={productName}
  className="product-image"
  loading="lazy"
  onError={(event) => {
    event.currentTarget.style.display = "none";
  }}
/>

      <div className="product-info">

        <h3>
          {productName}
        </h3>

        <p className="product-price">
          ₹{product.price} / {getUnitLabel(product.unit)}
        </p>

        <p className="product-weight">
          1 {getUnitLabel(product.unit)} ={" "}
          {weightPerUnitKg} {getUnitLabel("kg")}
        </p>

        <p className="stock">
          {t("available")}:{" "}
          {product.stock} {getUnitLabel(product.unit)}
        </p>

        <button
          className="add-button"
          onClick={() => addToCart(product)}
          disabled={
            !product.isAvailable ||
            Number(product.stock || 0) <= 0
          }
        >
          🛒 {t("addToCart")}
        </button>

      </div>

    </div>
  );
}

export default ProductCard;