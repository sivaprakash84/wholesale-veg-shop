import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminLogin() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);
      setError("");

      const response = await axios.post(
        "https://wholesale-veg-shop.onrender.com/api/auth/admin/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "adminToken",
        response.data.token
      );

      localStorage.setItem(
        "adminEmail",
        response.data.admin.email
      );

      navigate("/admin");

    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="admin-login-page">

      <div className="admin-login-card">

        <div className="admin-login-icon">
          🔐
        </div>

        <p className="section-label">
          SHOP ADMIN
        </p>

        <h1>Admin Login</h1>

        <p className="admin-login-description">
          Login to manage your wholesale vegetable shop.
        </p>

        {error && (
          <div className="admin-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>
              Admin Email
            </label>

            <input
              type="email"
              placeholder="admin@wholesaleveg.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>

        </form>

      </div>

    </div>

  );
}

export default AdminLogin;