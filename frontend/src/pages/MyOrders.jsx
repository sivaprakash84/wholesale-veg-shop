import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import { auth } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./MyOrders.css";

function MyOrders() {
  const navigate = useNavigate();

  const { user, loading: authLoading } =
    useCustomerAuth();

  const { t, language } =
    useLanguage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const currentUser = auth.currentUser;

        if (!currentUser) {
          setError(
            t("customerAuthenticationRequired")
          );
          setLoading(false);
          return;
        }

        const token =
          await currentUser.getIdToken();

        const response = await axios.get(
          "https://wholesale-veg-shop.onrender.com/api/orders/customer",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setOrders(response.data);
      } catch (error) {
        console.error(
          "My Orders Error:",
          error
        );

        setError(
          error.response?.data?.message ||
            t("unableToLoadOrders")
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, authLoading, t]);

  if (authLoading || loading) {
    return (
      <div className="page-container">
        <div className="no-products">
          <h2>
            {t("loadingYourOrders")}
          </h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="no-products">
          <h2>
            🔐 {t("pleaseLogin")}
          </h2>

          <p>
            {t("loginToViewPreviousOrders")}
          </p>
        </div>
      </div>
    );
  }

  const trackingSteps = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Out for Delivery",
    "Delivered",
  ];

  const getTrackingStepLabel = (step) => {
    const labels = {
      Pending: t("pending"),
      Confirmed: t("confirmed"),
      Preparing: t("preparing"),
      "Out for Delivery":
        t("outForDelivery"),
      Delivered: t("delivered"),
    };

    return labels[step] || step;
  };

  const getCurrentStep = (status) => {
    return trackingSteps.indexOf(status);
  };

  const getPaymentStatusClass = (status) => {
    if (status === "Paid") {
      return "payment-paid";
    }

    if (status === "Failed") {
      return "payment-failed";
    }

    return "payment-pending";
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      Paid: t("paid"),
      Failed: t("failed"),
      Pending: t("pending"),
    };

    return (
      labels[status] ||
      t("pending")
    );
  };

  const getPaymentMethodLabel = (method) => {
    if (!method) {
      return t("notSelected");
    }

    const labels = {
      UPI: "UPI",
      Cash: t("cash"),
      "Cash on Delivery":
        t("cashOnDelivery"),
      "Not Selected":
        t("notSelected"),
    };

    return labels[method] || method;
  };

  return (
    <div className="page-container">

      <div className="page-header">

        <p className="section-label">
          {t("customerAccount")}
        </p>

        <h1>
          {t("myOrders")}
        </h1>

        <p>
          {t("viewPreviousWholesaleOrders")}
        </p>

      </div>

      {error && (
        <div className="admin-error">
          ⚠️ {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="no-products">

          <div>📦</div>

          <h2>
            {t("noOrdersYet")}
          </h2>

          <p>
            {t("completedOrdersAppearHere")}
          </p>

        </div>
      ) : (
        <div className="customer-orders">

          {orders.map((order) => {

            const currentStep =
              getCurrentStep(
                order.orderStatus
              );

            const isCancelled =
              order.orderStatus ===
              "Cancelled";

            return (
              <div
                className="customer-order-card"
                key={order._id}
              >

                {/* ORDER HEADER */}
                <div className="customer-order-header">

                  <div>

                    <p>
                      {t("orderIdLabel")}
                    </p>

                    <h2>
                      {order.orderId}
                    </h2>

                    <span>
                      {new Date(
                        order.orderedAt
                      ).toLocaleString("en-IN")}
                    </span>

                  </div>

                  <div
                    className={`customer-order-status ${
                      isCancelled
                        ? "status-cancelled"
                        : ""
                    }`}
                  >
                    {isCancelled
                      ? t("cancelled")
                      : getTrackingStepLabel(
                          order.orderStatus
                        )}
                  </div>

                </div>

                {/* ORDER ITEMS */}
                <div className="customer-order-items">

                  {order.items.map(
                    (item, index) => {

                      /*
                       * PRODUCT NAME LANGUAGE
                       *
                       * English:
                       * Brinjal
                       *
                       * Tamil:
                       * கத்திரிக்காய்
                       *
                       * If Tamil name is not available,
                       * English name is used as fallback.
                       */
                      const productName =
                        language === "ta"
                          ? item.nameTa ||
                            item.name
                          : item.name;

                      return (
                        <div
                          key={index}
                          className="customer-order-item"
                        >

                          <span>
                            {productName}
                          </span>

                          <span>
                            × {item.quantity}
                          </span>

                          <strong>
                            ₹{item.total}
                          </strong>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* ORDER TRACKING */}
                {isCancelled ? (
                  <div className="order-tracking cancelled-tracking">

                    <div className="tracking-cancelled-icon">
                      ❌
                    </div>

                    <div>

                      <strong>
                        {t("orderCancelled")}
                      </strong>

                      <p>
                        {t(
                          "orderCancelledMessage"
                        )}
                      </p>

                    </div>

                  </div>
                ) : (
                  <div className="order-tracking">

                    {trackingSteps.map(
                      (step, index) => {

                        const isCompleted =
                          index <=
                          currentStep;

                        const isCurrent =
                          index ===
                          currentStep;

                        return (
                          <div
                            className="tracking-wrapper"
                            key={step}
                          >

                            <div
                              className={`tracking-step ${
                                isCompleted
                                  ? "completed"
                                  : ""
                              } ${
                                isCurrent
                                  ? "current"
                                  : ""
                              }`}
                            >

                              <div className="tracking-circle">
                                {isCompleted
                                  ? "✓"
                                  : index + 1}
                              </div>

                              <p>
                                {getTrackingStepLabel(
                                  step
                                )}
                              </p>

                            </div>

                            {index <
                              trackingSteps.length -
                                1 && (
                              <div
                                className={`tracking-line ${
                                  index <
                                  currentStep
                                    ? "completed"
                                    : ""
                                }`}
                              ></div>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

                {/* PAYMENT INFORMATION */}
                <div className="customer-payment-info">

                  <div className="payment-info-row">

                    <span>
                      {t("paymentMethod")}
                    </span>

                    <strong>
                      {getPaymentMethodLabel(
                        order.paymentMethod
                      )}
                    </strong>

                  </div>

                  <div className="payment-info-row">

                    <span>
                      {t("paymentStatus")}
                    </span>

                    <strong
                      className={getPaymentStatusClass(
                        order.paymentStatus
                      )}
                    >
                      {getPaymentStatusLabel(
                        order.paymentStatus
                      )}
                    </strong>

                  </div>

                </div>

                {/* ORDER TOTAL */}
                <div className="customer-order-total">

                  <span>
                    {t("total")}: ₹
                    {order.total}
                  </span>

                  <button
                    className="invoice-button"
                    onClick={() =>
                      navigate(`/invoice/${order.orderId}`, {
  state: {
    order: order,
  },
})
                    }
                  >
                    🧾{" "}
                    {t("viewInvoice")}
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default MyOrders;