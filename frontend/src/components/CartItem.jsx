import { useCart } from "../context/CartContext";
import { useLanguage } from "../i18n/LanguageContext";

function CartItem({ item }) {
  const {
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  const { t, language } = useLanguage();

  const productId = item._id || item.id;

  const weightPerUnitKg = Number(
    item.weightPerUnitKg || 1
  );

  const itemTotalWeight =
    weightPerUnitKg * Number(item.quantity || 0);

  const itemTotalPrice =
    Number(item.price || 0) *
    Number(item.quantity || 0);

  const productName =
    language === "ta"
      ? item.nameTa || item.name
      : item.name;

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
    <div className="cart-item">

      <img
        src={item.image}
        alt={productName}
      />

      <div className="cart-item-info">

        <h3>
          {productName}
        </h3>

        <p className="cart-item-price">
          ₹{item.price} / {getUnitLabel(item.unit)}
        </p>

        <p className="cart-item-weight">
          1 {getUnitLabel(item.unit)} ={" "}
          {weightPerUnitKg} {getUnitLabel("kg")}
        </p>

        <div className="quantity-controls">

          <button
            onClick={() =>
              decreaseQuantity(productId)
            }
          >
            −
          </button>

          <span>
            {item.quantity}
          </span>

          <button
            onClick={() =>
              increaseQuantity(productId)
            }
          >
            +
          </button>

        </div>

        <p className="cart-item-total-weight">
          {t("totalWeight")}:{" "}
          <strong>
            {itemTotalWeight} {getUnitLabel("kg")}
          </strong>
        </p>

      </div>

      <div className="cart-item-total">

        <strong>
          ₹{itemTotalPrice}
        </strong>

        <button
          className="remove-button"
          onClick={() =>
            removeFromCart(productId)
          }
        >
          {t("remove")}
        </button>

      </div>

    </div>
  );
}

export default CartItem;