import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  signInWithPopup,
} from "firebase/auth";

import {
  auth,
  googleProvider,
} from "../firebase";

import "./AdminLogin.css";
import sadLogo from "../assets/sad-logo.png";

function AdminLogin() {

  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleGoogleLogin = async () => {

    setError("");
    setLoading(true);

    try {

      // ============================================
      // GOOGLE LOGIN
      // ============================================

      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      const user =
        result.user;


      // ============================================
      // GET FIREBASE ID TOKEN
      // ============================================

      const idToken =
        await user.getIdToken();


      // ============================================
      // SEND TOKEN TO BACKEND
      // ============================================

      const response =
        await axios.post(
          "http://localhost:5000/api/auth/admin/google-login",
          {
            idToken,
          }
        );


      // ============================================
      // SAVE ADMIN JWT
      // ============================================

      const {
        token,
        admin,
      } = response.data;


      localStorage.setItem(
        "adminToken",
        token
      );


      localStorage.setItem(
        "adminUser",
        JSON.stringify(admin)
      );


      console.log(
        "Admin Google login successful"
      );

      console.log(
        "Admin:",
        admin
      );


      // ============================================
      // GO TO ADMIN DASHBOARD
      // ============================================

      navigate("/admin");

    } catch (err) {

      console.error(
        "Admin Google Login Error:",
        err
      );


      // Firebase popup cancelled
      if (
        err.code ===
        "auth/popup-closed-by-user"
      ) {

        setError(
          "Google login was cancelled."
        );

      } else {

        setError(
          err.response?.data?.message ||
          "Unable to login as admin."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="admin-login-page">

      <div className="admin-login-box">

        <div className="admin-login-icon">
          🔐
        </div>


        <div className="admin-login-brand">
  <img
    src={sadLogo}
    alt="SAD 72 Logo"
    className="admin-login-brand-logo"
  />

  <div className="admin-login-brand-name">
    <span>SAD Prakash Wholesale</span>
    <span>Vegetable Shop</span>
  </div>
</div>


        <h1>
          Admin Login
        </h1>


        <p className="admin-login-subtitle">
          Login with your authorized Google
          account to manage your wholesale
          vegetable shop.
        </p>


        {error && (

          <div className="admin-login-error">
            ⚠️ {error}
          </div>

        )}


        <button
          type="button"
          className="admin-google-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >

          {loading ? (

            "Signing in..."

          ) : (

            <>
              <span className="google-icon">
                G
              </span>

              Continue with Google
            </>

          )}

        </button>


        <p className="admin-login-note">
          Only the authorized admin Google
          account can access this dashboard.
        </p>

      </div>

    </div>

  );

}


export default AdminLogin;