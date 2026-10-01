import { useEffect, useState } from "react";

function AdminDeliverySettings() {
  const defaultVehicles = [
    {
      type: "bike",
      label: "2-Wheeler",
      maxWeightKg: 110,
      ratePerKm: 3,
      enabled: true,
    },
    {
      type: "four_wheeler",
      label: "4-Wheeler",
      maxWeightKg: 2000,
      ratePerKm: 6,
      enabled: true,
    },
  ];

  const [settings, setSettings] = useState({
    maxDistanceKm: 50,
    isEnabled: true,
    vehicles: defaultVehicles,
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const adminToken =
    localStorage.getItem("adminToken");

  // =====================================================
  // LOAD SETTINGS
  // =====================================================

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(
          "https://wholesale-veg-shop.onrender.com/api/delivery-settings",
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load delivery settings"
          );
        }

        setSettings({
          maxDistanceKm:
            data.maxDistanceKm ?? 50,

          isEnabled:
            data.isEnabled !== false,

          vehicles:
            Array.isArray(data.vehicles) &&
            data.vehicles.length > 0
              ? data.vehicles
              : defaultVehicles,
        });
      } catch (err) {
        console.error(
          "Load delivery settings error:",
          err
        );

        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [adminToken]);

  // =====================================================
  // CHANGE VEHICLE RATE
  // =====================================================

  const handleVehicleRateChange = (
    vehicleType,
    value
  ) => {
    setSettings((prev) => ({
      ...prev,

      vehicles: prev.vehicles.map(
        (vehicle) =>
          vehicle.type === vehicleType
            ? {
                ...vehicle,
                ratePerKm: value,
              }
            : vehicle
      ),
    }));
  };

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      // -------------------------------------------------
      // VALIDATE DISTANCE
      // -------------------------------------------------

      const distance = Number(
        settings.maxDistanceKm
      );

      if (
        !Number.isFinite(distance) ||
        distance <= 0
      ) {
        throw new Error(
          "Maximum delivery distance must be greater than 0."
        );
      }

      // -------------------------------------------------
      // VALIDATE VEHICLES
      // -------------------------------------------------

      const vehicles =
        settings.vehicles.map(
          (vehicle) => {
            const rate = Number(
              vehicle.ratePerKm
            );

            const maxWeight =
              Number(
                vehicle.maxWeightKg
              );

            if (
              !Number.isFinite(rate) ||
              rate < 0
            ) {
              throw new Error(
                `${vehicle.label} rate per km must be 0 or greater.`
              );
            }

            if (
              !Number.isFinite(
                maxWeight
              ) ||
              maxWeight <= 0
            ) {
              throw new Error(
                `${vehicle.label} maximum weight must be greater than 0.`
              );
            }

            return {
              type: vehicle.type,

              label:
                vehicle.type === "bike"
                  ? "2-Wheeler"
                  : "4-Wheeler",

              maxWeightKg:
                maxWeight,

              ratePerKm: rate,

              enabled:
                vehicle.enabled !== false,
            };
          }
        );

      // -------------------------------------------------
      // SEND TO BACKEND
      // -------------------------------------------------

      const response = await fetch(
       "https://wholesale-veg-shop.onrender.com/api/delivery-settings",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${adminToken}`,
          },

          body: JSON.stringify({
            maxDistanceKm:
              distance,

            isEnabled:
              settings.isEnabled,

            vehicles: vehicles,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save delivery settings"
        );
      }

      // -------------------------------------------------
      // UPDATE UI WITH ACTUAL SAVED DATA
      // -------------------------------------------------

      setSettings({
        maxDistanceKm:
          data.settings.maxDistanceKm,

        isEnabled:
          data.settings.isEnabled,

        vehicles:
          data.settings.vehicles,
      });

      setMessage(
        "Delivery settings saved successfully."
      );
    } catch (err) {
      console.error(
        "Save delivery settings error:",
        err
      );

      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>
            Delivery Settings
          </h1>
        </div>

        <div className="admin-settings-card">
          Loading delivery settings...
        </div>
      </div>
    );
  }

  // =====================================================
  // GET VEHICLES
  // =====================================================

  const bike =
    settings.vehicles.find(
      (vehicle) =>
        vehicle.type === "bike"
    ) || defaultVehicles[0];

  const fourWheeler =
    settings.vehicles.find(
      (vehicle) =>
        vehicle.type ===
        "four_wheeler"
    ) || defaultVehicles[1];

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="admin-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-page-header">

        <div>

          <h1>
            Delivery Settings
          </h1>

          <p>
            Manage home delivery availability,
            distance and vehicle delivery rates.
          </p>

        </div>

      </div>

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {message && (
        <div className="admin-success-message">
          {message}
        </div>
      )}

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}

      {/* =================================================
          HOME DELIVERY STATUS
      ================================================= */}

      <div className="admin-settings-card">

        <div className="settings-card-header">

          <div>

            <h2>
              Home Delivery
            </h2>

            <p>
              Allow customers to choose home
              delivery during checkout.
            </p>

          </div>

          <label className="switch">

            <input
              type="checkbox"
              checked={
                settings.isEnabled
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  isEnabled:
                    e.target.checked,
                })
              }
            />

            <span className="slider"></span>

          </label>

        </div>

      </div>

      {/* =================================================
          MAXIMUM DELIVERY DISTANCE
      ================================================= */}

      <div className="admin-settings-card">

        <div className="settings-card-header">

          <div>

            <h2>
              Maximum Delivery Distance
            </h2>

            <p>
              Customers beyond this road
              distance cannot select home
              delivery.
            </p>

          </div>

        </div>

        <div className="settings-field">

          <label>
            Maximum Distance
          </label>

          <div className="distance-input">

            <input
              type="number"
              min="1"
              value={
                settings.maxDistanceKm
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxDistanceKm:
                    e.target.value,
                })
              }
            />

            <span>
              km
            </span>

          </div>

        </div>

      </div>

      {/* =================================================
          DELIVERY VEHICLES & RATES
      ================================================= */}

      <div className="admin-settings-card">

        <div className="settings-card-header">

          <div>

            <h2>
              Delivery Vehicles & Rates
            </h2>

            <p>
              Set the delivery charge per
              kilometer for each vehicle.
            </p>

          </div>

        </div>

        <div className="fixed-vehicle-grid">

          {/* =================================================
              2 WHEELER
          ================================================= */}

          <div className="fixed-vehicle-card">

            <div className="vehicle-icon">
              🛵
            </div>

            <div className="vehicle-details">

              <h3>
                2-Wheeler
              </h3>

              <p>
                Maximum order weight:
                <strong>
                  {" "}
                  {bike.maxWeightKg} kg
                </strong>
              </p>

              <div className="vehicle-rate-input">

                <label>
                  Rate Per KM
                </label>

                <div className="distance-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      bike.ratePerKm
                    }
                    onChange={(e) =>
                      handleVehicleRateChange(
                        "bike",
                        e.target.value
                      )
                    }
                  />

                  <span>
                    / km
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              4 WHEELER
          ================================================= */}

          <div className="fixed-vehicle-card">

            <div className="vehicle-icon">
              🚗
            </div>

            <div className="vehicle-details">

              <h3>
                4-Wheeler
              </h3>

              <p>
                Maximum order weight:
                <strong>
                  {" "}
                  {fourWheeler.maxWeightKg} kg
                </strong>
              </p>

              <div className="vehicle-rate-input">

                <label>
                  Rate Per KM
                </label>

                <div className="distance-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      fourWheeler.ratePerKm
                    }
                    onChange={(e) =>
                      handleVehicleRateChange(
                        "four_wheeler",
                        e.target.value
                      )
                    }
                  />

                  <span>
                    / km
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          DELIVERY CHARGE EXAMPLES
      ================================================= */}

      <div className="admin-settings-card">

        <h2>
          Delivery Charge Examples
        </h2>

        <div className="delivery-example">

          {/* 2 WHEELER */}

          <div>

            <span>
              25 km · up to{" "}
              {bike.maxWeightKg} kg
            </span>

            <strong>
              ₹
              {Math.round(
                25 *
                  Number(
                    bike.ratePerKm || 0
                  )
              )}
            </strong>

          </div>

          {/* 4 WHEELER */}

          <div>

            <span>
              25 km ·{" "}
              {bike.maxWeightKg + 1}
              –
              {fourWheeler.maxWeightKg}
              kg
            </span>

            <strong>
              ₹
              {Math.round(
                25 *
                  Number(
                    fourWheeler.ratePerKm ||
                      0
                  )
              )}
            </strong>

          </div>

        </div>

        <p className="settings-note">
          Charge is calculated using the
          actual road distance and the
          selected vehicle rate. The result
          is rounded to the nearest rupee.
        </p>

      </div>

      {/* =================================================
          VEHICLE WEIGHT RULES
      ================================================= */}

      <div className="admin-settings-card">

        <h2>
          Vehicle Weight Rules
        </h2>

        <div className="delivery-example">

          <div>

            <span>
              1–
              {bike.maxWeightKg}
              {" "}kg
            </span>

            <strong>
              🛵 2-Wheeler
            </strong>

          </div>

          <div>

            <span>
              {bike.maxWeightKg + 1}
              –
              {fourWheeler.maxWeightKg}
              {" "}kg
            </span>

            <strong>
              🚗 4-Wheeler
            </strong>

          </div>

        </div>

        <p className="settings-note">
          Orders above{" "}
          {fourWheeler.maxWeightKg}
          {" "}kg cannot be delivered because
          no configured vehicle can handle that
          weight.
        </p>

      </div>

      {/* =================================================
          SAVE BUTTON
      ================================================= */}

      <div className="settings-actions">

        <button
          className="admin-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>

      </div>

    </div>
  );
}

export default AdminDeliverySettings;