import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";

import "./Profile.css";


// ===============================
// CREATE IMAGE
// ===============================
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));

    image.src = url;
  });


// ===============================
// CREATE CROPPED IMAGE
// ===============================
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const outputSize = 500;

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas.toDataURL("image/jpeg", 0.9);
};


function Profile() {
  const navigate = useNavigate();

  const { t } = useLanguage();

  // ===============================
  // CUSTOMER
  // ===============================
  const [customer, setCustomer] = useState(null);

  // ===============================
  // SHOP DETAILS
  // ===============================
  const [shop, setShop] = useState({
    shopName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [editing, setEditing] = useState(false);

  // ===============================
  // PROFILE IMAGE
  // ===============================
  const [profileImage, setProfileImage] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);

  // ===============================
  // CROP STATES
  // ===============================
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const [showCropper, setShowCropper] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ===============================
  // FIREBASE CUSTOMER
  // ===============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setCustomer(currentUser);
        }
      }
    );

    return () => unsubscribe();
  }, []);


  // ===============================
  // LOAD SAVED PROFILE
  // ===============================
  useEffect(() => {
    const savedShop =
      localStorage.getItem("customerShopDetails");

    if (savedShop) {
      try {
        setShop(JSON.parse(savedShop));
      } catch (error) {
        console.error(
          "Unable to load customer shop details:",
          error
        );
      }
    }

    const savedImage =
      localStorage.getItem("customerProfileImage");

    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);


  // ===============================
  // INPUT CHANGE
  // ===============================
  const handleChange = (e) => {
    setShop({
      ...shop,
      [e.target.name]: e.target.value,
    });
  };


  // ===============================
  // SAVE SHOP DETAILS
  // ===============================
  const handleSave = () => {
    localStorage.setItem(
      "customerShopDetails",
      JSON.stringify(shop)
    );

    setEditing(false);

    setSuccessMessage(
      t("profileDetailsSavedSuccessfully")
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };


  // ===============================
  // SELECT PHOTO
  // ===============================
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("selectImageFile"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t("imageSmallerThan5MB"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setSelectedImage(reader.result);

      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);

      setShowCropper(true);
    };

    reader.readAsDataURL(file);

    // Reset input so same image can be selected again
    e.target.value = "";
  };


  // ===============================
  // CROP COMPLETE
  // ===============================
  const handleCropComplete = (
    _croppedArea,
    croppedAreaPixels
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };


  // ===============================
  // SAVE CROPPED IMAGE
  // ===============================
  const handleCropSave = async () => {
    try {
      if (!selectedImage || !croppedAreaPixels) {
        alert(t("selectAndCropImage"));
        return;
      }

      const croppedImage = await getCroppedImg(
        selectedImage,
        croppedAreaPixels
      );

      setProfileImage(croppedImage);

      localStorage.setItem(
        "customerProfileImage",
        croppedImage
      );

      setShowCropper(false);
      setSelectedImage(null);

      // Notify Navbar
      window.dispatchEvent(
        new Event("customerProfileUpdated")
      );

    } catch (error) {
      console.error(
        "Image crop failed:",
        error
      );

      alert(t("unableToCropImage"));
    }
  };


  // ===============================
  // CANCEL CROP
  // ===============================
  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setZoom(1);

    setCrop({
      x: 0,
      y: 0,
    });
  };


  // ===============================
  // LOADING
  // ===============================
  if (!customer) {
    return (
      <div className="profile-loading">
        {t("loadingCustomerProfile")}
      </div>
    );
  }


  const customerName =
    customer.displayName ||
    customer.email?.split("@")[0] ||
    t("customer");


  const customerEmail =
    customer.email || "";


  const customerPhoto =
    profileImage ||
    customer.photoURL ||
    "";


  return (
    <div className="profile-page">

      {successMessage && (
        <div className="profile-success-toast">
          <span className="profile-success-icon">
            ✓
          </span>

          <span>
            {successMessage}
          </span>
        </div>
      )}

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="profile-header">

        <div>

          <p className="profile-label">
            {t("customerAccount")}
          </p>

          <h1>
            {t("myProfile")}
          </h1>

          <p>
            {t("manageAccountShopInformation")}
          </p>

        </div>


        <button
          type="button"
          className="profile-back-button"
          onClick={() => navigate("/products")}
        >
          ← {t("continueShopping")}
        </button>

      </div>


      {/* ================================= */}
      {/* PROFILE CARD */}
      {/* ================================= */}

      <div className="profile-card">


        {/* ================================= */}
        {/* CUSTOMER PHOTO */}
        {/* ================================= */}

        <div className="profile-top">

          <div className="profile-photo-wrapper">

            {customerPhoto ? (

              <img
                src={customerPhoto}
                alt={t("customer")}
                className="profile-photo"
              />

            ) : (

              <div className="profile-photo-placeholder">
                {customerName
                  .charAt(0)
                  .toUpperCase()}
              </div>

            )}


            {/* CHANGE PHOTO */}

            <label className="change-photo-button">

              📷 {t("changePhoto")}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                hidden
              />

            </label>

          </div>


          <div className="profile-user">

            <h2>
              {customerName}
            </h2>

            <p>
              {customerEmail}
            </p>

            <span className="profile-badge">
              {t("customer")}
            </span>

          </div>

        </div>


        {/* ================================= */}
        {/* GOOGLE ACCOUNT */}
        {/* ================================= */}

        <div className="profile-section">

          <h3>
            🔐 {t("accountInformation")}
          </h3>


          <div className="profile-grid">


            <div className="profile-detail">

              <label>
                {t("fullName")}
              </label>

              <strong>
                {customerName}
              </strong>

            </div>


            <div className="profile-detail">

              <label>
                {t("emailAddress")}
              </label>

              <strong>
                {customerEmail}
              </strong>

            </div>


            <div className="profile-detail">

              <label>
                {t("loginMethod")}
              </label>

              <strong>
                Google
              </strong>

            </div>


            <div className="profile-detail">

              <label>
                {t("accountStatus")}
              </label>

              <strong className="profile-active">
                {t("active")}
              </strong>

            </div>

          </div>

        </div>


        {/* ================================= */}
        {/* SHOP / CUSTOMER DETAILS */}
        {/* ================================= */}

        <div className="profile-section">


          <div className="profile-section-header">

            <div>

              <h3>
                🏪 {t("shopInformation")}
              </h3>

              <p>
                {t("addBusinessDetails")}
              </p>

            </div>


            {!editing && (

              <button
                type="button"
                className="profile-edit-button"
                onClick={() =>
                  setEditing(true)
                }
              >
                ✏️ {t("editProfile")}
              </button>

            )}

          </div>


          {/* ================================= */}
          {/* VIEW MODE */}
          {/* ================================= */}

          {!editing ? (

            <div className="profile-grid">


              <div className="profile-detail">

                <label>
                  {t("shopName")}
                </label>

                <strong>
                  {shop.shopName ||
                    t("notAddedYet")}
                </strong>

              </div>


              <div className="profile-detail">

                <label>
                  {t("phoneNumber")}
                </label>

                <strong>
                  {shop.phone ||
                    t("notAddedYet")}
                </strong>

              </div>


              <div className="profile-detail">

                <label>
                  {t("city")}
                </label>

                <strong>
                  {shop.city ||
                    t("notAddedYet")}
                </strong>

              </div>


              <div className="profile-detail">

                <label>
                  {t("pincode")}
                </label>

                <strong>
                  {shop.pincode ||
                    t("notAddedYet")}
                </strong>

              </div>


              <div className="profile-detail profile-address-detail">

                <label>
                  {t("deliveryAddress")}
                </label>

                <strong>
                  {shop.address ||
                    t("notAddedYet")}
                </strong>

              </div>


            </div>

          ) : (


            /* ================================= */
            /* EDIT MODE */
            /* ================================= */

            <div className="profile-edit-form">


              <div className="profile-form-group">

                <label>
                  {t("shopName")}
                </label>

                <input
                  type="text"
                  name="shopName"
                  value={shop.shopName}
                  onChange={handleChange}
                  placeholder={t("enterShopName")}
                />

              </div>


              <div className="profile-form-group">

                <label>
                  {t("phoneNumber")}
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={shop.phone}
                  onChange={handleChange}
                  placeholder={t("enterPhoneNumber")}
                />

              </div>


              <div className="profile-form-group">

                <label>
                  {t("deliveryAddress")}
                </label>

                <textarea
                  name="address"
                  value={shop.address}
                  onChange={handleChange}
                  placeholder={t("enterCompleteDeliveryAddress")}
                  rows="3"
                />

              </div>


              <div className="profile-form-row">


                <div className="profile-form-group">

                  <label>
                    {t("city")}
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={shop.city}
                    onChange={handleChange}
                    placeholder={t("city")}
                  />

                </div>


                <div className="profile-form-group">

                  <label>
                    {t("pincode")}
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    value={shop.pincode}
                    onChange={handleChange}
                    placeholder={t("pincode")}
                  />

                </div>


              </div>


              <div className="profile-form-actions">


                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={() =>
                    setEditing(false)
                  }
                >
                  {t("cancel")}
                </button>


                <button
                  type="button"
                  className="profile-save-button"
                  onClick={handleSave}
                >
                  💾 {t("saveChanges")}
                </button>


              </div>


            </div>

          )}

        </div>


        {/* ================================= */}
        {/* SECURITY */}
        {/* ================================= */}

        <div className="profile-security">

          <span>
            🔒
          </span>

          <div>

            <strong>
              {t("accountSecurity")}
            </strong>

            <p>
              {t("accountSecurityMessage")}
            </p>

          </div>

        </div>


      </div>


      {/* ================================= */}
      {/* CROP MODAL */}
      {/* ================================= */}

      {showCropper && selectedImage && (

        <div className="crop-modal-overlay">

          <div className="crop-modal">


            <div className="crop-modal-header">

              <div>

                <h2>
                  {t("cropProfilePhoto")}
                </h2>

                <p>
                  {t("cropPhotoInstructions")}
                </p>

              </div>


              <button
                type="button"
                className="crop-close-button"
                onClick={handleCropCancel}
              >
                ✕
              </button>

            </div>


            {/* CROP AREA */}

            <div className="crop-container">

              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />

            </div>


            {/* ZOOM */}

            <div className="crop-controls">

              <span>
                🔍
              </span>

              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) =>
                  setZoom(
                    Number(e.target.value)
                  )
                }
              />

              <span>
                3×
              </span>

            </div>


            {/* BUTTONS */}

            <div className="crop-actions">


              <button
                type="button"
                className="crop-cancel-button"
                onClick={handleCropCancel}
              >
                {t("cancel")}
              </button>


              <button
                type="button"
                className="crop-save-button"
                onClick={handleCropSave}
              >
                ✓ {t("savePhoto")}
              </button>


            </div>


          </div>

        </div>

      )}

    </div>
  );
}

export default Profile;