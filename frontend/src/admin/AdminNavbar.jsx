import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import sadLogo from "../assets/sad-logo.png";

function AdminNavbar() {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("");

  const profileRef = useRef(null);

  /* =========================
     LOAD ADMIN + PROFILE IMAGE
  ========================= */

  useEffect(() => {
    const storedAdmin =
      localStorage.getItem("adminUser");

    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
      } catch (error) {
        console.error(
          "Failed to read admin user:",
          error
        );
      }
    }

    const savedImage =
      localStorage.getItem("adminProfileImage");

    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  /* =========================
     LISTEN FOR PROFILE IMAGE
     CHANGES
  ========================= */

  useEffect(() => {
    const handleProfileUpdate = () => {
      const updatedImage =
        localStorage.getItem(
          "adminProfileImage"
        ) || "";

      setProfileImage(updatedImage);
    };

    window.addEventListener(
      "adminProfileUpdated",
      handleProfileUpdate
    );

    return () => {
      window.removeEventListener(
        "adminProfileUpdated",
        handleProfileUpdate
      );
    };
  }, []);

  /* =========================
     CLOSE DROPDOWN OUTSIDE
  ========================= */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    setAdminUser(null);
    setProfileOpen(false);

    navigate("/admin-login");
  };

  /* =========================
     ADMIN INFORMATION
  ========================= */

  const adminName =
    adminUser?.name ||
    adminUser?.email?.split("@")[0] ||
    "Admin";

  const adminEmail =
    adminUser?.email || "";

  /*
    Custom profile image has priority.
    Google photo is the fallback.
  */

  const adminPhoto =
    profileImage ||
    adminUser?.photo ||
    "";

  return (
    <header className="admin-navbar">

      {/* =========================
          LEFT SIDE
      ========================= */}

      <div className="admin-navbar-left">

        {/* LOGO */}

        <Link
          to="/admin"
          className="admin-navbar-brand"
        >
          <img
            src={sadLogo}
            alt="SAD 72 Logo"
            className="sad-navbar-logo"
            style={{
              width: "48px",
              height: "48px",
              minWidth: "48px",
              minHeight: "48px",
              maxWidth: "48px",
              maxHeight: "48px",
              objectFit: "contain",
              display: "block",
            }}
          />

          <div>
            <strong>
              SAD Prakash Wholesale Vegetable Shop
            </strong>

            <span>
              ADMIN
            </span>
          </div>
        </Link>


        {/* =========================
            ADMIN NAVIGATION
        ========================= */}

        <nav className="admin-navigation">

          <Link
            to="/admin"
            className="admin-nav-link"
          >
            Dashboard
          </Link>

          <Link
            to="/admin/products"
            className="admin-nav-link"
          >
            Products
          </Link>

          <Link
            to="/admin/orders"
            className="admin-nav-link"
          >
            Orders
          </Link>

          <Link
            to="/admin/delivery-settings"
            className="admin-nav-link"
          >
            Delivery Settings
          </Link>

        </nav>

      </div>


      {/* =========================
          RIGHT SIDE
      ========================= */}

      <div className="admin-navbar-right">

        <div
          className="admin-profile-container"
          ref={profileRef}
        >

          {/* =========================
              PROFILE BUTTON
          ========================= */}

          <button
            type="button"
            className="admin-profile-button"
            onClick={() =>
              setProfileOpen(
                !profileOpen
              )
            }
          >

            {adminPhoto ? (

              <img
                src={adminPhoto}
                alt="Admin"
                className="admin-profile-image"
              />

            ) : (

              <div className="admin-profile-placeholder">
                {adminName
                  .charAt(0)
                  .toUpperCase()}
              </div>

            )}

            <div className="admin-profile-text">

              <strong>
                {adminName}
              </strong>

              <span>
                Administrator
              </span>

            </div>

            <span
              className={`admin-profile-arrow ${
                profileOpen
                  ? "admin-profile-arrow-open"
                  : ""
              }`}
            >
              ▼
            </span>

          </button>


          {/* =========================
              DROPDOWN
          ========================= */}

          {profileOpen && (

            <div className="admin-profile-dropdown">

              {/* USER INFORMATION */}

              <div className="admin-dropdown-header">

                {adminPhoto ? (

                  <img
                    src={adminPhoto}
                    alt="Admin"
                    className="admin-dropdown-image"
                  />

                ) : (

                  <div className="admin-dropdown-placeholder">
                    {adminName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                )}

                <div>

                  <strong>
                    {adminName}
                  </strong>

                  <span>
                    {adminEmail}
                  </span>

                </div>

              </div>


              <div className="admin-dropdown-divider" />


              {/* ADMIN PROFILE */}

              <Link
                to="/admin/profile"
                className="admin-dropdown-item"
                onClick={() =>
                  setProfileOpen(false)
                }
              >

                <span>
                  👤
                </span>

                <div>

                  <strong>
                    Admin Profile
                  </strong>

                  <small>
                    Account & shop information
                  </small>

                </div>

              </Link>


              {/* DELIVERY SETTINGS */}

              <Link
                to="/admin/delivery-settings"
                className="admin-dropdown-item"
                onClick={() =>
                  setProfileOpen(false)
                }
              >

                <span>
                  🚚
                </span>

                <div>

                  <strong>
                    Delivery Settings
                  </strong>

                  <small>
                    Vehicles & delivery charges
                  </small>

                </div>

              </Link>


              <div className="admin-dropdown-divider" />


              {/* LOGOUT */}

              <button
                type="button"
                className="admin-dropdown-logout"
                onClick={handleLogout}
              >

                <span>
                  🚪
                </span>

                <div>

                  <strong>
                    Logout
                  </strong>

                  <small>
                    Sign out of admin account
                  </small>

                </div>

              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}

export default AdminNavbar;