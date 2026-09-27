import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";

import { auth, googleProvider } from "../firebase";
import { useCustomerAuth } from "./CustomerAuthContext";
import { useLanguage } from "../i18n/LanguageContext";

function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useCustomerAuth();
  const { t } = useLanguage();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      console.log(
        "Google login successful:",
        result.user
      );

      const redirectTo =
        location.state?.from || "/products";

      navigate(redirectTo, {
        replace: true,
      });

    } catch (error) {
      console.error(
        "GOOGLE LOGIN ERROR:",
        error
      );

      setError(
        error.message ||
          t("googleLoginFailed")
      );

    } finally {
      setLoading(false);
    }
  };

  // Already logged in
  if (user) {
    return (
      <div className="customer-login-page">
        <div className="customer-login-card">

          <div className="customer-login-icon">
            👤
          </div>

          <h1>
            {t("alreadyLoggedIn")}
          </h1>

          <p>
            {user.email}
          </p>

          <button
            className="customer-login-button"
            onClick={() =>
              navigate("/products")
            }
          >
            {t("continueShopping")}
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="customer-login-page">

      <div className="customer-login-card">

        <div className="customer-login-icon">
          🥬
        </div>

        <p className="section-label">
          {t("wholesaleVegetableShop")}
        </p>

        <h1>
          {t("customerLogin")}
        </h1>

        <p className="customer-login-description">
          {t("customerLoginDescription")}
        </p>

        {error && (
          <div className="admin-error">
            ⚠️ {error}
          </div>
        )}

        <button
          className="google-login-button"
          onClick={loginWithGoogle}
          disabled={loading}
        >
          {loading
            ? t("signingIn")
            : `🔵 ${t("continueWithGoogle")}`}
        </button>

        <p className="login-note">
          {t("googleAccountCustomerOnly")}
        </p>

      </div>

    </div>
  );
}

export default CustomerLogin;