import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";

function PaymentUpload() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const orderId = location.state?.orderId;
  const amount = location.state?.amount;

  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("pleaseUploadImage"));
      setScreenshot(null);
      setPreview("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t("screenshotLessThan5MB"));
      setScreenshot(null);
      setPreview("");
      return;
    }

    setError("");
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!screenshot) {
      setError(t("uploadTransactionScreenshot"));
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(t("loginBeforePayment"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Get Firebase authentication token
      const token =
        await currentUser.getIdToken();

      // Create multipart form data
      const formData = new FormData();

      formData.append(
        "screenshot",
        screenshot
      );

      formData.append(
        "orderId",
        orderId
      );

      formData.append(
        "amount",
        amount
      );

      console.log(
        "Submitting payment..."
      );

      const response = await axios.post(
        "https://wholesale-veg-shop.onrender.com/api/payment-settings/submit",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Payment submission response:",
        response.data
      );

      setSuccess(true);

    } catch (error) {
      console.error(
        "Payment Upload Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          t("failedToSubmitPayment")
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // INVALID REQUEST
  // =====================================================

  if (!orderId || !amount) {
    return (
      <div className="page-container">

        <div className="no-products">

          <h2>
            {t("invalidPaymentRequest")}
          </h2>

          <p>
            {t("completeOrderBeforePayment")}
          </p>

          <button
            className="place-order-button"
            onClick={() =>
              navigate("/products")
            }
          >
            {t("browseVegetables")}
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // PAYMENT SUBMITTED
  // =====================================================

  if (success) {
    return (
      <div className="success-page">

        <div className="success-card">

          <div className="success-icon">
            ✅
          </div>

          <p className="section-label">
            {t("paymentSubmitted")}
          </p>

          <h1>
            {t("paymentSubmittedSuccessfully")}
          </h1>

          <p>
            {t("paymentScreenshotSubmitted")}
          </p>

          <div className="order-id-box">

            <span>
              {t("orderId")}
            </span>

            <strong>
              {orderId}
            </strong>

          </div>

          <div className="payment-info">

            💳

            <div>

              <strong>
                {t("paymentStatus")}
              </strong>

              <p>
                {t("pendingPaymentVerification")}
              </p>

            </div>

          </div>

          <button
            className="hero-button"
            onClick={() =>
              navigate("/my-orders")
            }
          >
            {t("viewMyOrders")} →
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // UPLOAD PAGE
  // =====================================================

  return (
    <div className="page-container">

      <div className="page-header">

        <p className="section-label">
          {t("paymentConfirmation")}
        </p>

        <h1>
          {t("submitYourPayment")}
        </h1>

        <p>
          {t("uploadScreenshotAfterPayment")}
        </p>

      </div>


      <div
        className="checkout-section"
        style={{
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >

        <h2>
          🧾 {t("transactionDetails")}
        </h2>


        <div className="summary-row">

          <span>
            {t("orderId")}
          </span>

          <strong>
            {orderId}
          </strong>

        </div>


        <div className="summary-row">

          <span>
            {t("amountPaid")}
          </span>

          <strong>
            ₹{Number(amount).toFixed(2)}
          </strong>

        </div>


        <form onSubmit={handleSubmit}>

          <label>
            {t("transactionScreenshot")} *
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />


          <p
            style={{
              fontSize: "13px",
              marginTop: "8px",
              color: "#777",
            }}
          >
            {t("supportedImageFormats")}
            <br />
            {t("maximumFileSize")}
          </p>


          {preview && (
            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
              }}
            >

              <p>
                <strong>
                  {t("screenshotPreview")}
                </strong>
              </p>

              <img
                src={preview}
                alt={t("transactionScreenshot")}
                style={{
                  maxWidth: "100%",
                  width: "350px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                }}
              />

            </div>
          )}


          {error && (
            <div
              className="admin-error"
              style={{
                marginTop: "20px",
              }}
            >
              ⚠️ {error}
            </div>
          )}


          <button
            type="submit"
            className="place-order-button"
            disabled={loading}
            style={{
              marginTop: "25px",
            }}
          >
            {loading
              ? t("submitting")
              : `📤 ${t("submitPayment")}`}
          </button>

        </form>

      </div>

    </div>
  );
}

export default PaymentUpload;