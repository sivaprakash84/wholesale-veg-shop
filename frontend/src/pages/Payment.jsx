import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orderId = location.state?.orderId;
  const amount = location.state?.amount;

  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          "https://wholesale-veg-shop.onrender.com/api/payment-settings"
        );

        setPaymentSettings(response.data);
      } catch (error) {
        console.error("Payment Settings Error:", error);

        setError(
          error.response?.data?.message ||
            t("unableToLoadPaymentDetails")
        );
      } finally {
        setLoading(false);
      }
    };

    loadPaymentSettings();
  }, [t]);

  if (!orderId || !amount) {
    return (
      <div className="page-container">
        <div className="no-products">
          <h2>{t("invalidPaymentRequest")}</h2>

          <p>
            {t("placeOrderBeforePayment")}
          </p>

          <button
            className="place-order-button"
            onClick={() => navigate("/products")}
          >
            {t("continueShopping")}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="no-products">
          <h2>{t("loadingPaymentDetails")}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">

      <div className="page-header">
        <p className="section-label">
          {t("orderPayment")}
        </p>

        <h1>{t("completeYourPayment")}</h1>

        <p>
          {t("scanQrExactAmount")}
        </p>
      </div>

      {error && (
        <div className="admin-error">
          ⚠️ {error}
        </div>
      )}

      {paymentSettings && (
        <div
          className="checkout-section"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >

          <h2>💳 {t("paymentDetails")}</h2>

          <p>
            <strong>{t("orderId")}:</strong> {orderId}
          </p>

          <div
            style={{
              margin: "20px 0",
              padding: "20px",
              background: "#f8f8f8",
              borderRadius: "12px",
            }}
          >
            <p>{t("amountToPay")}</p>

            <h1>
              ₹{Number(amount).toFixed(2)}
            </h1>
          </div>


          {paymentSettings.qrImage ? (
            <div>
              <p>
                <strong>{t("scanQrToPay")}</strong>
              </p>

              <img
                src={`https://wholesale-veg-shop.onrender.com${paymentSettings.qrImage}`}
                alt={t("paymentQrCode")}
                style={{
                  width: "300px",
                  maxWidth: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "10px",
                  background: "#fff",
                }}
              />
            </div>
          ) : (
            <div className="admin-error">
              ⚠️ {t("paymentQrNotConfigured")}
            </div>
          )}


          {paymentSettings.paymentName && (
            <p style={{ marginTop: "20px" }}>
              <strong>
                {t("payTo")}:
              </strong>{" "}
              {paymentSettings.paymentName}
            </p>
          )}


          {paymentSettings.upiId && (
            <p>
              <strong>
                {t("upiId")}:
              </strong>{" "}
              {paymentSettings.upiId}
            </p>
          )}


          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              background: "#fff8e1",
              borderRadius: "10px",
            }}
          >
            <strong>{t("important")}</strong>

            <p style={{ marginBottom: 0 }}>
              {t("payExactAmount")}{" "}
              ₹{Number(amount).toFixed(2)}{" "}
              {t("keepScreenshotReady")}
            </p>
          </div>


          <button
            className="place-order-button"
            style={{ marginTop: "25px" }}
            onClick={() =>
              navigate("/payment-upload", {
                state: {
                  orderId,
                  amount,
                },
              })
            }
          >
            {t("iHavePaid")} →
          </button>

        </div>
      )}

    </div>
  );
}

export default Payment;