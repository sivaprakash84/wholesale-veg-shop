import { useState } from "react";
import axios from "axios";

function AdminPaymentSettings() {
  const [qrImage, setQrImage] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleQrChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setQrImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const formData = new FormData();

      if (qrImage) {
        formData.append("qrImage", qrImage);
      }

      formData.append("upiId", upiId);
      formData.append("paymentName", paymentName);

      // Get admin token from existing admin login storage
      const token = localStorage.getItem("adminToken");

      const response = await axios.put(
        "http://localhost:5000/api/payment-settings",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message ||
          "Payment settings saved successfully."
      );

    } catch (error) {
      console.error(
        "Payment Settings Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save payment settings."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">

      <div className="page-header">
        <p className="section-label">
          ADMIN SETTINGS
        </p>

        <h1>Payment Settings</h1>

        <p>
          Set the default QR code customers will use
          for payment.
        </p>
      </div>

      {message && (
        <div className="admin-success">
          ✅ {message}
        </div>
      )}

      {error && (
        <div className="admin-error">
          ⚠️ {error}
        </div>
      )}

      <div className="checkout-section">

        <h2>💳 Default Payment QR</h2>

        <form onSubmit={handleSubmit}>

          <label>
            Payment QR Code *
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleQrChange}
            required
          />

          {preview && (
            <div style={{ marginTop: "20px" }}>
              <p>QR Preview</p>

              <img
                src={preview}
                alt="Payment QR Preview"
                style={{
                  width: "250px",
                  maxWidth: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>
          )}

          <label>
            UPI ID
          </label>

          <input
            type="text"
            placeholder="example@upi"
            value={upiId}
            onChange={(e) =>
              setUpiId(e.target.value)
            }
          />

          <label>
            Payment Name
          </label>

          <input
            type="text"
            placeholder="Example: SAD Prakash Wholesale Vegetable Shop Wholesale"
            value={paymentName}
            onChange={(e) =>
              setPaymentName(e.target.value)
            }
          />

          <button
            type="submit"
            className="place-order-button"
            disabled={loading}
          >
            {loading
              ? "SAVING..."
              : "💾 SAVE PAYMENT SETTINGS"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default AdminPaymentSettings;