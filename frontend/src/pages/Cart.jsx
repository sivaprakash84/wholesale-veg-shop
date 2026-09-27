import { Link } from "react-router-dom";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../i18n/LanguageContext";

function Cart() {
  const {
    cart,
    cartTotal,
    cartTotalWeight,
    cartUnitCount,
  } = useCart();

  const { t } = useLanguage();

  // Delivery charge is calculated later during checkout
  const finalTotal = cartTotal;

  // ===============================
  // EMPTY CART
  // ===============================
  if (cart.length === 0) {
    return (
      <div className="empty-cart">

        <div className="empty-cart-icon">
          🛒
        </div>

        <h1>
          {t("emptyCart")}
        </h1>

        <p>
          {t("emptyCartMessage")}
        </p>

        <Link
          to="/products"
          className="hero-button"
        >
          {t("browseVegetables")}
        </Link>

      </div>
    );
  }

  return (
    <div className="page-container">

      {/* ================================= */}
      {/* PAGE HEADER */}
      {/* ================================= */}

      <div className="page-header">

        <p className="section-label">
          {t("yourOrder")}
        </p>

        <h1>
          {t("shoppingCart")}
        </h1>

        <p>
          {t("reviewVegetables")}
        </p>

      </div>


      <div className="cart-layout">

        {/* ================================= */}
        {/* CART ITEMS */}
        {/* ================================= */}

        <div className="cart-items">

          {cart.map((item) => (
            <CartItem
              key={item._id || item.id}
              item={item}
            />
          ))}

        </div>


        {/* ================================= */}
        {/* ORDER SUMMARY */}
        {/* ================================= */}

        <div className="cart-summary">

          <h2>
            {t("orderSummary")}
          </h2>


          {/* DIFFERENT PRODUCTS */}

          <div className="summary-row">

            <span>
              {t("products")}
            </span>

            <strong>
              {cart.length}
            </strong>

          </div>


          {/* TOTAL SELLING UNITS */}

          <div className="summary-row">

            <span>
              {t("totalUnits")}
            </span>

            <strong>
              {cartUnitCount}
            </strong>

          </div>


          {/* TOTAL WEIGHT */}

          <div className="summary-row">

            <span>
              {t("totalWeight")}
            </span>

            <strong>
              {cartTotalWeight} kg
            </strong>

          </div>


          {/* SUBTOTAL */}

          <div className="summary-row">

            <span>
              {t("subtotal")}
            </span>

            <strong>
              ₹{cartTotal}
            </strong>

          </div>


          <hr />


          {/* TOTAL */}

          <div className="summary-total">

            <span>
              {t("total")}
            </span>

            <strong>
              ₹{finalTotal}
            </strong>

          </div>


          {/* CHECKOUT */}

          <Link
            to="/checkout"
            className="checkout-button"
          >
            {t("proceedToCheckout")} →
          </Link>


          {/* CONTINUE SHOPPING */}

          <Link
            to="/products"
            className="continue-shopping"
          >
            ← {t("continueShopping")}
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Cart;