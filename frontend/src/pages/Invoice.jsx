import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import "./Invoice.css";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import { auth } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import sadLogo from "../assets/sad-logo.png";

function Invoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams();

  const { user, loading: authLoading } = useCustomerAuth();
  const { t, language } = useLanguage();

  const [order, setOrder] = useState(
    location.state?.order || null
  );

  const [loading, setLoading] = useState(
    !location.state?.order
  );

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

  const [error, setError] = useState("");

  // --------------------------------------------------
  // GET ORDER
  // --------------------------------------------------

  useEffect(() => {
    const fetchOrder = async () => {
      // If order was already passed through state,
      // no need to fetch it again.
      if (location.state?.order) {
        setOrder(location.state.order);
        setLoading(false);
        return;
      }

      if (authLoading) {
        return;
      }

      if (!user) {
        setLoading(false);
        setError(t("loginToViewInvoice"));
        return;
      }

      if (!orderId) {
        setLoading(false);
        setError(t("orderIdMissing"));
        return;
      }

      try {
        setLoading(true);
        setError("");

        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error(
            t("customerAuthenticationRequired")
          );
        }

        const token = await currentUser.getIdToken();

        const response = await axios.get(
          `http://localhost:5000/api/orders/customer/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const fetchedOrder =
          response.data?.order || response.data;

        if (!fetchedOrder) {
          throw new Error(t("orderNotFound"));
        }

        setOrder(fetchedOrder);
      } catch (err) {
        console.error(
          "Invoice fetch error:",
          err.response?.data || err.message
        );

        setError(
          err.response?.data?.message ||
            t("unableToLoadInvoice")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [
    orderId,
    user,
    authLoading,
    location.state,
    t,
  ]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading || authLoading) {
    return (
      <div className="invoice-error-page">
        <div className="invoice-error-box">
          <h2>{t("loadingInvoice")}</h2>

          <p>
            {t("loadingOrderDetails")}
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR / NO ORDER
  // --------------------------------------------------

  if (!order) {
    return (
      <div className="invoice-error-page">
        <div className="invoice-error-box">

          <h2>
            {error || t("invoiceNotFound")}
          </h2>

          <p>
            {t("openInvoiceFromMyOrders")}
          </p>

          <button
            onClick={() => navigate("/my-orders")}
          >
            ← {t("backToMyOrders")}
          </button>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ORDER DATA
  // --------------------------------------------------

  const items = order.items || [];

  const subtotal = Number(
    order.subtotal || 0
  );

  const deliveryCharge = Number(
    order.deliveryCharge || 0
  );

  const grandTotal = Number(
    order.total || 0
  );

  const orderDate = order.orderedAt
    ? new Date(order.orderedAt)
    : new Date();

  const formattedDate =
    orderDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formattedTime =
    orderDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // --------------------------------------------------
  // PRINT
  // --------------------------------------------------

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodLabel = (method) => {
    if (!method) {
      return t("notSelected");
    }

    const labels = {
      UPI: "UPI",
      Cash: t("cash"),
      "Cash on Delivery": t("cashOnDelivery"),
      "Not Selected": t("notSelected"),
    };

    return labels[method] || method;
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      Paid: t("paid"),
      Failed: t("failed"),
      Pending: t("pending"),
    };

    return labels[status] || t("pending");
  };

  const getOrderStatusLabel = (status) => {
    const labels = {
      Pending: t("pending"),
      Confirmed: t("confirmed"),
      Preparing: t("preparing"),
      "Out for Delivery": t("outForDelivery"),
      Delivered: t("delivered"),
      Cancelled: t("cancelled"),
    };

    return labels[status] || status || t("pending");
  };

  return (
    <div className="invoice-page">

      {/* ==================================================
          ACTION BUTTONS
      ================================================== */}

      <div className="invoice-actions">

        <button
          className="invoice-back-btn"
          onClick={() => navigate("/my-orders")}
        >
          ← {t("back")}
        </button>

        <button
          className="invoice-print-btn"
          onClick={handlePrint}
        >
          🖨 {t("printSavePdf")}
        </button>

      </div>


      {/* ==================================================
          INVOICE PAPER
      ================================================== */}

      <div className="invoice-paper">
<img
  src={sadLogo}
  alt=""
  className="invoice-watermark"
  aria-hidden="true"
/>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="invoice-header">

          <div className="invoice-brand">
            <span>SAD PRAKASH</span>
          </div>

          <div className="invoice-business">
            WHOLESALE VEGETABLE SHOP
          </div>

          <div className="invoice-tagline">
            FRESH • QUALITY • WHOLESALE
          </div>

          <div className="invoice-contact">
            Phone: +91 9488379484
            &nbsp;&nbsp; | &nbsp;&nbsp;
            WhatsApp: +91 9488379484
            &nbsp;&nbsp; | &nbsp;&nbsp;
            Tenkasi, Tamil Nadu
          </div>

        </div>


        {/* ==================================================
            TITLE
        ================================================== */}

        <div className="invoice-title">
          {t("vegetables")}
        </div>


        {/* ==================================================
            BILL DETAILS
        ================================================== */}

        <div className="bill-details">

          <div className="bill-detail">
            <strong>{t("billNo")}</strong>

            <span>
              {order.orderId}
            </span>
          </div>

          <div className="bill-detail">
            <strong>{t("date")}</strong>

            <span>
              {formattedDate}
            </span>
          </div>

          <div className="bill-detail">
            <strong>{t("time")}</strong>

            <span>
              {formattedTime}
            </span>
          </div>

        </div>


        {/* ==================================================
            CUSTOMER DETAILS
        ================================================== */}

        <div className="customer-details">

          <div className="customer-row">

            <div className="customer-field">
              <strong>{t("name")}</strong>

              <span>
                {order.customer?.name || "-"}
              </span>
            </div>

            <div className="customer-field">
              <strong>{t("mobile")}</strong>

              <span>
                {order.customer?.phone || "-"}
              </span>
            </div>

          </div>


          <div className="customer-row">

            <div className="customer-field full-width">
              <strong>
                {t("shopBusiness")}
              </strong>

              <span>
                {order.customer?.shopName || "-"}
              </span>
            </div>

          </div>


          <div className="customer-row">

            <div className="customer-field full-width">
              <strong>{t("address")}</strong>

              <span>
                {order.customer?.address || "-"}
              </span>
            </div>

          </div>


          <div className="customer-row">

            <div className="customer-field">
              <strong>{t("pincode")}</strong>

              <span>
                {order.customer?.pincode || "-"}
              </span>
            </div>

            <div className="customer-field">
              <strong>{t("payment")}</strong>

              <span>
                {getPaymentMethodLabel(
                  order.paymentMethod
                )}
              </span>
            </div>

          </div>

        </div>


        {/* ==================================================
            PRODUCT TABLE
        ================================================== */}

        <table className="invoice-table">

          <thead>

            <tr>

              <th className="col-number">
                {t("srNo")}
              </th>

              <th className="col-product">
                {t("product")}
              </th>

              <th className="col-qty">
                {t("qty")}
              </th>

              <th className="col-unit">
                {t("unit")}
              </th>

              <th className="col-rate">
                {t("rate")}
              </th>

              <th className="col-amount">
                {t("amount")}
              </th>

            </tr>

          </thead>


          <tbody>

            {items.map((item, index) => {

              const quantity =
                Number(item.quantity || 0);

              const rate =
                Number(item.price || 0);

              const amount =
                Number(
                  item.total ??
                  quantity * rate
                );

              return (
                <tr key={index}>

                  <td>
                    {index + 1}
                  </td>

                  <td className="product-name">
  {language === "ta"
    ? item.nameTa || item.name
    : item.name}
</td>

                  <td>
                    {quantity}
                  </td>

                  <td>
  {getUnitLabel(item.unit)}
</td>

                  <td className="money">
                    ₹{rate.toFixed(2)}
                  </td>

                  <td className="money amount">
                    ₹{amount.toFixed(2)}
                  </td>

                </tr>
              );
            })}


            {/* --------------------------------------------
                EMPTY ROWS
            -------------------------------------------- */}

            {Array.from({
              length: Math.max(
                0,
                12 - items.length
              ),
            }).map((_, index) => (

              <tr
                key={`empty-${index}`}
                className="empty-product-row"
              >

                <td>
                  {items.length + index + 1}
                </td>

                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>

              </tr>

            ))}

          </tbody>

        </table>


        {/* ==================================================
            TOTAL SECTION
        ================================================== */}

        <div className="invoice-total-section">


          {/* LEFT */}

          <div className="total-left">

            <div className="grand-total-label">
              {t("grandTotal")}
            </div>

            <div className="payment-status-box">

              <span>
                {t("paymentStatus")}
              </span>

              <strong
                className={
                  order.paymentStatus === "Paid"
                    ? "status-paid"
                    : order.paymentStatus === "Failed"
                    ? "status-failed"
                    : "status-pending"
                }
              >
                {getPaymentStatusLabel(
                  order.paymentStatus
                )}
              </strong>

            </div>

          </div>


          {/* RIGHT */}

          <div className="total-right">

            <div className="total-row">

              <span>
                {t("subtotal")}
              </span>

              <strong>
                ₹{subtotal.toFixed(2)}
              </strong>

            </div>


            <div className="total-row">

              <span>
                {t("deliveryCharge")}
              </span>

              <strong>

                {deliveryCharge === 0
                  ? t("free")
                  : `₹${deliveryCharge.toFixed(2)}`}

              </strong>

            </div>


            <div className="grand-total-row">

              <span>
                {t("grandTotal")}
              </span>

              <strong>
                ₹{grandTotal.toFixed(2)}
              </strong>

            </div>

          </div>

        </div>


        {/* ==================================================
            PAYMENT + ORDER STATUS
        ================================================== */}

        <div className="status-section">

          <div className="status-column">

            <h3>
              {t("paymentInformation")}
            </h3>

            <p>
              {t("method")}:
              <strong>
                {" "}
                {getPaymentMethodLabel(
                  order.paymentMethod
                )}
              </strong>
            </p>

            <p>
              {t("status")}:
              <strong
                className={
                  order.paymentStatus === "Paid"
                    ? "status-paid"
                    : order.paymentStatus === "Failed"
                    ? "status-failed"
                    : "status-pending"
                }
              >
                {" "}
                {getPaymentStatusLabel(
                  order.paymentStatus
                )}
              </strong>
            </p>

          </div>


          <div className="status-column">

            <h3>
              {t("orderStatus")}
            </h3>

            <p className="order-status">
              {getOrderStatusLabel(
                order.orderStatus
              )}
            </p>

          </div>

        </div>


        {/* ==================================================
            TERMS + THANK YOU
        ================================================== */}

        <div className="invoice-bottom">

          <div className="terms-section">

            <h3>
              {t("termsConditions")}
            </h3>

            <ol>

              <li>
                {t("termOne")}
              </li>

              <li>
                {t("termTwo")}
              </li>

              <li>
                {t("termThree")}
              </li>

              <li>
                {t("termFour")}
              </li>

            </ol>

          </div>


          <div className="thank-you-section">

            <h2>
              {t("thankYou")}
            </h2>

            <p>
              {t("thankYouMessage")}
            </p>

            <strong>
              FRESH • QUALITY • WHOLESALE
            </strong>

          </div>

        </div>


        {/* ==================================================
            FOOTER
        ================================================== */}

      </div>

    </div>
  );
}

export default Invoice;