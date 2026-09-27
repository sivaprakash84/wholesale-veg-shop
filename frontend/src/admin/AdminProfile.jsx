import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Cropper from "react-easy-crop";

import { auth } from "../firebase";

import "./AdminProfile.css";

function AdminProfile() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [editing, setEditing] = useState(false);

  const [profileImage, setProfileImage] = useState("");

  const [shopLoading, setShopLoading] = useState(true);
  const [shopSaving, setShopSaving] = useState(false);

  // Crop states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const [shop, setShop] = useState({
  shopName: "",
  phone: "",
  address: "",
  city: "",
  pincode: "",
  latitude: "",
  longitude: "",
});

const [successMessage, setSuccessMessage] = useState("");
  /* =========================
     LOAD ADMIN
  ========================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setAdmin(currentUser);
        }
      }
    );

    return () => unsubscribe();
  }, []);


  /* =========================
     LOAD PROFILE IMAGE
  ========================= */

  useEffect(() => {
    const savedImage =
      localStorage.getItem("adminProfileImage");

    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);


  /* =========================
     LOAD SHOP DETAILS
     FROM MONGODB
  ========================= */

  useEffect(() => {
    const loadShopDetails = async () => {
      try {
        setShopLoading(true);

        const adminToken =
          localStorage.getItem("adminToken");

        if (!adminToken) {
          console.error(
            "Admin token not found."
          );

          setShopLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/shop-settings",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load shop details"
          );
        }

        setShop({
  shopName: data.shopName || "",
  phone: data.phone || "",
  address: data.address || "",
  city: data.city || "",
  pincode: data.pincode || "",
  latitude: data.latitude ?? "",
  longitude: data.longitude ?? "",
});

      } catch (error) {
        console.error(
          "Unable to load shop details:",
          error
        );

        
      } finally {
        setShopLoading(false);
      }
    };

    loadShopDetails();
  }, []);


  /* =========================
     SHOP FORM
  ========================= */

  const handleChange = (e) => {
    setShop({
      ...shop,
      [e.target.name]: e.target.value,
    });
  };


  /* =========================
     SAVE SHOP DETAILS
     TO MONGODB
  ========================= */

  const handleSave = async () => {
    try {
      setShopSaving(true);

      const adminToken =
        localStorage.getItem("adminToken");

      if (!adminToken) {
        alert(
          "Admin session expired. Please login again."
        );

        navigate("/admin-login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/shop-settings",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },

         body: JSON.stringify({
  shopName: shop.shopName.trim(),
  phone: shop.phone.trim(),
  address: shop.address.trim(),
  city: shop.city.trim(),
  pincode: shop.pincode.trim(),
  latitude:
    shop.latitude === ""
      ? null
      : Number(shop.latitude),
  longitude:
    shop.longitude === ""
      ? null
      : Number(shop.longitude),
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save shop details"
        );
      }

     setShop({
  shopName: data.shop.shopName || "",
  phone: data.shop.phone || "",
  address: data.shop.address || "",
  city: data.shop.city || "",
  pincode: data.shop.pincode || "",
  latitude: data.shop.latitude ?? "",
  longitude: data.shop.longitude ?? "",
});
      setEditing(false);

      setSuccessMessage(
  "Shop information saved successfully!"
);

setTimeout(() => {
  setSuccessMessage("");
}, 3000);

    } catch (error) {
      console.error(
        "Save shop details error:",
        error
      );

      alert(
        error.message ||
          "Unable to save shop information."
      );
    } finally {
      setShopSaving(false);
    }
  };


  /* =========================
     SELECT IMAGE
  ========================= */

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(
        "Please select an image smaller than 10 MB."
      );
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

      setCropModalOpen(true);
    };

    reader.readAsDataURL(file);

    // Allow selecting the same image again
    e.target.value = "";
  };


  /* =========================
     CROP COMPLETE
  ========================= */

  const onCropComplete = (
    croppedArea,
    croppedAreaPixels
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };


  /* =========================
     CREATE CROPPED IMAGE
  ========================= */

  const createCroppedImage = (
    imageSrc,
    pixelCrop
  ) => {
    return new Promise(
      (resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          const canvas =
            document.createElement("canvas");

          const size = 500;

          canvas.width = size;
          canvas.height = size;

          const ctx =
            canvas.getContext("2d");

          ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            size,
            size
          );

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.88
            )
          );
        };

        image.onerror = reject;

        image.src = imageSrc;
      }
    );
  };


  /* =========================
     SAVE CROPPED IMAGE
  ========================= */

  const handleCropSave = async () => {
    try {
      if (
        !selectedImage ||
        !croppedAreaPixels
      ) {
        return;
      }

      const croppedImage =
        await createCroppedImage(
          selectedImage,
          croppedAreaPixels
        );

      setProfileImage(croppedImage);

      localStorage.setItem(
        "adminProfileImage",
        croppedImage
      );

      // Update navbar immediately
      window.dispatchEvent(
        new Event("adminProfileUpdated")
      );

      setCropModalOpen(false);
      setSelectedImage("");
      setZoom(1);

    } catch (error) {
      console.error(
        "Failed to crop image:",
        error
      );

      alert(
        "Unable to crop the image. Please try again."
      );
    }
  };


  /* =========================
     CANCEL CROP
  ========================= */

  const handleCropCancel = () => {
    setCropModalOpen(false);

    setSelectedImage("");

    setZoom(1);

    setCrop({
      x: 0,
      y: 0,
    });
  };


  /* =========================
     REMOVE IMAGE
  ========================= */

  const handleRemoveProfileImage = () => {
    localStorage.removeItem(
      "adminProfileImage"
    );

    setProfileImage("");

    window.dispatchEvent(
      new Event("adminProfileUpdated")
    );
  };


  /* =========================
     ADMIN LOADING
  ========================= */

  if (!admin) {
    return (
      <div className="admin-profile-loading">
        Loading admin profile...
      </div>
    );
  }


  /* =========================
     PROFILE IMAGE
  ========================= */

  const displayedProfileImage =
    profileImage || admin.photoURL;


  return (
    <div className="admin-profile-page">

  {successMessage && (
    <div className="admin-success-toast">
      <span>✓</span>
      <span>{successMessage}</span>
    </div>
  )}

  {/* rest of your page */}


      {/* =========================
          HEADER
      ========================= */}

      <div className="admin-profile-header">

        <div>

          <p className="admin-profile-label">
            SHOP ADMIN
          </p>

          <h1>
            Admin Profile
          </h1>

          <p>
            Manage your administrator account
            and shop information.
          </p>

        </div>


        <button
          type="button"
          className="admin-back-button"
          onClick={() =>
            navigate("/admin")
          }
        >
          ← Dashboard
        </button>

      </div>



      {/* =========================
          PROFILE CARD
      ========================= */}

      <div className="admin-profile-card">


        {/* PROFILE TOP */}

        <div className="admin-profile-top">


          {/* PROFILE IMAGE */}

          <div className="admin-profile-photo-area">

            <div className="admin-photo-wrapper">

              {displayedProfileImage ? (

                <img
                  src={displayedProfileImage}
                  alt="Admin"
                  className="admin-profile-photo"
                />

              ) : (

                <div className="admin-profile-placeholder">

                  {(
                    admin.displayName ||
                    "A"
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>

              )}

            </div>


            {/* IMAGE BUTTONS */}

            <div className="admin-profile-image-controls">

              <label
                htmlFor="admin-profile-image-input"
                className="admin-change-photo-button"
              >
                📷 Change Profile Image
              </label>


              <input
                id="admin-profile-image-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={
                  handleProfileImageChange
                }
                hidden
              />


              {profileImage && (

                <button
                  type="button"
                  className="admin-remove-photo-button"
                  onClick={
                    handleRemoveProfileImage
                  }
                >
                  Remove Image
                </button>

              )}


              <small>
                Choose a photo and crop it
                before saving.
              </small>

            </div>

          </div>



          {/* ADMIN USER */}

          <div className="admin-profile-user">

            <h2>
              {admin.displayName ||
                "Administrator"}
            </h2>

            <p>
              {admin.email}
            </p>

            <span className="admin-profile-badge">
              Administrator
            </span>

          </div>

        </div>



        {/* =========================
            ACCOUNT DETAILS
        ========================= */}

        <div className="admin-profile-section">

          <h3>
            🔐 Admin Account
          </h3>

          <div className="admin-profile-grid">

            <div className="admin-profile-detail">
              <label>
                Full Name
              </label>

              <strong>
                {admin.displayName || "-"}
              </strong>
            </div>


            <div className="admin-profile-detail">
              <label>
                Email Address
              </label>

              <strong>
                {admin.email || "-"}
              </strong>
            </div>


            <div className="admin-profile-detail">
              <label>
                Role
              </label>

              <strong>
                Administrator
              </strong>
            </div>


            <div className="admin-profile-detail">
              <label>
                Login Method
              </label>

              <strong>
                Google
              </strong>
            </div>


            <div className="admin-profile-detail">
              <label>
                Account Status
              </label>

              <strong className="admin-active">
                Active
              </strong>
            </div>

          </div>

        </div>



        {/* =========================
            SHOP INFORMATION
        ========================= */}

        <div className="admin-profile-section">

          <div className="admin-profile-section-header">

            <div>

              <h3>
                🏪 Shop Information
              </h3>

              <p>
                Information displayed and used
                for your shop.
              </p>

            </div>


            {!editing && (

              <button
                type="button"
                className="admin-edit-button"
                onClick={() =>
                  setEditing(true)
                }
              >
                ✏️ Edit Profile
              </button>

            )}

          </div>



          {shopLoading ? (

            <div className="admin-profile-loading">
              Loading shop information...
            </div>

          ) : !editing ? (

            <div className="admin-profile-grid">

              <div className="admin-profile-detail">
                <label>
                  Shop Name
                </label>

                <strong>
                  {shop.shopName ||
                    "Not added yet"}
                </strong>
              </div>


              <div className="admin-profile-detail">
                <label>
                  Phone Number
                </label>

                <strong>
                  {shop.phone ||
                    "Not added yet"}
                </strong>
              </div>


              <div className="admin-profile-detail">
                <label>
                  City
                </label>

                <strong>
                  {shop.city ||
                    "Not added yet"}
                </strong>
              </div>


              <div className="admin-profile-detail">
                <label>
                  Pincode
                </label>

                <strong>
                  {shop.pincode ||
                    "Not added yet"}
                </strong>
              </div>


              <div className="admin-profile-detail admin-profile-address-detail">
                <label>
                  Shop Address
                </label>

                <strong>
                  {shop.address ||
                    "Not added yet"}
                </strong>
              </div>

            </div>

          ) : (

            <div className="admin-edit-form">

              <div className="admin-form-group">

                <label>
                  Shop Name
                </label>

                <input
                  type="text"
                  name="shopName"
                  value={shop.shopName}
                  onChange={handleChange}
                  placeholder="Enter shop name"
                />

              </div>


              <div className="admin-form-group">

                <label>
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={shop.phone}
                  onChange={handleChange}
                  placeholder="Enter shop phone number"
                />

              </div>


              <div className="admin-form-group">

                <label>
                  Shop Address
                </label>

                <textarea
                  name="address"
                  value={shop.address}
                  onChange={handleChange}
                  placeholder="Enter shop address"
                  rows="3"
                />

              </div>


              <div className="admin-form-row">

                <div className="admin-form-group">

                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={shop.city}
                    onChange={handleChange}
                    placeholder="City"
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Pincode
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    value={shop.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                  />

                </div>

              </div>

              <div className="admin-form-row">

  <div className="admin-form-group">

    <label>
      Shop Latitude
    </label>

    <input
      type="number"
      name="latitude"
      value={shop.latitude}
      onChange={handleChange}
      placeholder="Example: 11.0168"
      step="any"
    />

    <small>
      Used to calculate delivery distance.
    </small>

  </div>

  <div className="admin-form-group">

    <label>
      Shop Longitude
    </label>

    <input
      type="number"
      name="longitude"
      value={shop.longitude}
      onChange={handleChange}
      placeholder="Example: 76.9558"
      step="any"
    />

    <small>
      Used to calculate delivery distance.
    </small>

  </div>

</div>


              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={() =>
                    setEditing(false)
                  }
                  disabled={shopSaving}
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="admin-save-button"
                  onClick={handleSave}
                  disabled={shopSaving}
                >
                  {shopSaving
                    ? "💾 Saving..."
                    : "💾 Save Changes"}
                </button>

              </div>

            </div>

          )}

        </div>



        {/* =========================
            SECURITY
        ========================= */}

        <div className="admin-profile-security">

          <span>
            🔒
          </span>

          <div>

            <strong>
              Account Security
            </strong>

            <p>
              Your authorized Google email
              cannot be changed from this page.
              Admin access is controlled by the
              authorized administrator account.
            </p>

          </div>

        </div>

      </div>



      {/* =================================================
          PROFILE IMAGE CROP MODAL
      ================================================= */}

      {cropModalOpen && (

        <div className="profile-crop-overlay">

          <div className="profile-crop-modal">


            {/* MODAL HEADER */}

            <div className="profile-crop-header">

              <div>

                <h2>
                  Crop Profile Image
                </h2>

                <p>
                  Adjust your photo before saving.
                </p>

              </div>


              <button
                type="button"
                className="profile-crop-close"
                onClick={handleCropCancel}
              >
                ✕
              </button>

            </div>



            {/* CROP AREA */}

            <div className="profile-crop-container">

              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />

            </div>



            {/* ZOOM */}

            <div className="profile-zoom-control">

              <span>
                🔍
              </span>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) =>
                  setZoom(
                    Number(e.target.value)
                  )
                }
              />

              <span>
                +
              </span>

            </div>



            {/* ACTIONS */}

            <div className="profile-crop-actions">

              <button
                type="button"
                className="profile-crop-cancel"
                onClick={handleCropCancel}
              >
                Cancel
              </button>


              <button
                type="button"
                className="profile-crop-save"
                onClick={handleCropSave}
              >
                ✓ Save Profile Image
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminProfile;