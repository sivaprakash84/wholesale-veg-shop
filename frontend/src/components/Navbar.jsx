import "./Navbar.css";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useCustomerAuth,
} from "../auth/CustomerAuthContext";

import {
  useCart,
} from "../context/CartContext";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import {
  languages,
} from "../i18n/languages";

import sadLogo from "../assets/sad-logo.png";

function Navbar() {

  const navigate = useNavigate();

  const {
    user,
    loading,
    logout,
  } = useCustomerAuth();

  const {
    cartCount,
  } = useCart();

  const {
    language,
    setLanguage,
    t,
  } = useLanguage();


  // =====================================
  // PROFILE DROPDOWN
  // =====================================

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);


  // =====================================
  // LANGUAGE DROPDOWN
  // =====================================

  const [
    languageOpen,
    setLanguageOpen,
  ] = useState(false);


  // =====================================
  // CUSTOMER PROFILE IMAGE
  // =====================================

  const [
    profileImage,
    setProfileImage,
  ] = useState("");


  const profileRef =
    useRef(null);

  const languageRef =
    useRef(null);


  // =====================================
  // CURRENT LANGUAGE
  // =====================================

  const currentLanguage =
    languages.find(
      (item) =>
        item.code === language
    ) || languages[0];


  // =====================================
  // LOAD CUSTOMER PROFILE IMAGE
  // =====================================

  useEffect(() => {

    const savedImage =
      localStorage.getItem(
        "customerProfileImage"
      ) || "";

    setProfileImage(
      savedImage
    );


    const handleProfileUpdate =
      () => {

        const updatedImage =
          localStorage.getItem(
            "customerProfileImage"
          ) || "";

        setProfileImage(
          updatedImage
        );

      };


    window.addEventListener(
      "customerProfileUpdated",
      handleProfileUpdate
    );


    return () => {

      window.removeEventListener(
        "customerProfileUpdated",
        handleProfileUpdate
      );

    };

  }, []);


  // =====================================
  // CLOSE DROPDOWNS
  // WHEN CLICKING OUTSIDE
  // =====================================

  useEffect(() => {

    const handleClickOutside =
      (event) => {

        if (
          profileRef.current &&
          !profileRef.current.contains(
            event.target
          )
        ) {

          setProfileOpen(
            false
          );

        }


        if (
          languageRef.current &&
          !languageRef.current.contains(
            event.target
          )
        ) {

          setLanguageOpen(
            false
          );

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


  // =====================================
  // LANGUAGE CHANGE
  // =====================================

  const handleLanguageChange =
    (languageCode) => {

      setLanguage(
        languageCode
      );

      setLanguageOpen(
        false
      );

    };


  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout =
    async () => {

      try {

        setProfileOpen(
          false
        );

        await logout();

        navigate("/");

      } catch (error) {

        console.error(
          "Logout failed:",
          error
        );

      }

    };


  // =====================================
  // PROFILE
  // =====================================

  const handleProfile =
    () => {

      setProfileOpen(
        false
      );

      navigate(
        "/profile"
      );

    };


  // =====================================
  // RETURN NAVBAR
  // =====================================

  return (

    <nav className="navbar">

      <div className="navbar-container">


        {/* =================================
            LOGO
        ================================= */}

        <Link
          to="/"
          className="navbar-logo"
        >

          <img
            src={sadLogo}
            alt="SAD 72 Logo"
            className="sad-navbar-logo"
          />

          <span className="navbar-shop-name">
            SAD Prakash Wholesale
            Vegetable Shop
          </span>

        </Link>


        {/* =================================
            NAVIGATION
        ================================= */}

        <div className="navbar-links">


          {/* =================================
              HOME
          ================================= */}

          <Link
            to="/"
            className="nav-link"
          >

            <span className="nav-icon">
              ⌂
            </span>

            <span>
              {t("home")}
            </span>

          </Link>


          {/* =================================
              VEGETABLES
          ================================= */}

          <Link
            to="/products"
            className="nav-link"
          >

            <span className="nav-icon">
              🥕
            </span>

            <span>
              {t("products")}
            </span>

          </Link>


          {/* =================================
              CART
          ================================= */}

          <Link
            to="/cart"
            className="nav-link cart-link"
          >

            <span className="cart-icon-wrapper">

              <span className="cart-icon">
                🛒
              </span>


              {cartCount > 0 && (

                <span className="cart-count-badge">
                  {cartCount}
                </span>

              )}

            </span>


            <span className="cart-label">
              {t("cart")}
            </span>

          </Link>


          {/* =================================
              LANGUAGE SELECTOR
          ================================= */}

          <div
            className="navbar-language-container"
            ref={languageRef}
          >

            <button
              type="button"
              className="navbar-language-button"
              onClick={() =>
                setLanguageOpen(
                  !languageOpen
                )
              }
              aria-expanded={
                languageOpen
              }
            >

              <span>
                🌐
              </span>

              <span>
                {
                  currentLanguage.nativeName
                }
              </span>

              <span
                className={`language-arrow ${
                  languageOpen
                    ? "language-arrow-open"
                    : ""
                }`}
              >
                ▾
              </span>

            </button>


            {/* LANGUAGE DROPDOWN */}

            {languageOpen && (

              <div className="language-dropdown">

                <div className="language-dropdown-title">
                  {t(
                    "selectLanguage"
                  )}
                </div>


                {languages.map(
                  (item) => (

                    <button
                      key={
                        item.code
                      }
                      type="button"
                      className={`language-dropdown-item ${
                        language ===
                        item.code
                          ? "language-selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleLanguageChange(
                          item.code
                        )
                      }
                    >

                      <span>
                        {
                          item.nativeName
                        }
                      </span>


                      {language ===
                        item.code && (

                        <span className="language-check">
                          ✓
                        </span>

                      )}

                    </button>

                  )
                )}

              </div>

            )}

          </div>


          {/* =================================
              AUTHENTICATION
          ================================= */}

          {loading ? (

            <span className="navbar-loading">
              {t("loading")}
            </span>

          ) : user ? (

            <>


              {/* ==============================
                  MY ORDERS
              ============================== */}

              <Link
                to="/my-orders"
                className="nav-link"
              >

                <span className="nav-icon">
                  📦
                </span>

                <span>
                  {t("myOrders")}
                </span>

              </Link>


              {/* ==============================
                  CUSTOMER PROFILE
              ============================== */}

              <div
                className="navbar-profile-container"
                ref={profileRef}
              >


                {/* PROFILE BUTTON */}

                <button
                  type="button"
                  className="navbar-user"
                  onClick={() =>
                    setProfileOpen(
                      !profileOpen
                    )
                  }
                  aria-expanded={
                    profileOpen
                  }
                >


                  {/* PROFILE IMAGE */}

                  {profileImage ||
                  user.photoURL ? (

                    <img
                      src={
                        profileImage ||
                        user.photoURL
                      }
                      alt="Profile"
                      className="navbar-profile"
                    />

                  ) : (

                    <span className="navbar-profile-placeholder">
                      👤
                    </span>

                  )}


                  {/* CUSTOMER NAME */}

                  <span className="navbar-user-name">

                    {user.displayName ||
                      user.email}

                  </span>


                  {/* ARROW */}

                  <span
                    className={`profile-arrow ${
                      profileOpen
                        ? "profile-arrow-open"
                        : ""
                    }`}
                  >
                    ▾
                  </span>

                </button>


                {/* PROFILE DROPDOWN */}

                {profileOpen && (

                  <div className="profile-dropdown">


                    {/* PROFILE SETTINGS */}

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={
                        handleProfile
                      }
                    >

                      <span>
                        👤
                      </span>

                      <span>
                        {t("profile")}
                      </span>

                    </button>


                  </div>

                )}

              </div>


              {/* ==============================
                  LOGOUT
              ============================== */}

              <button
                type="button"
                className="navbar-logout-button"
                onClick={
                  handleLogout
                }
              >

                <span>
                  ↪
                </span>

                {t("logout")}

              </button>


            </>

          ) : (


            /* ==============================
               LOGIN
            ============================== */

            <button
              type="button"
              className="navbar-login-button"
              onClick={() =>
                navigate(
                  "/login"
                )
              }
            >

              <span className="google-icon">
                G
              </span>

              <span>
                {t("login")}
              </span>

            </button>

          )}

        </div>

      </div>

    </nav>

  );

}

export default Navbar;