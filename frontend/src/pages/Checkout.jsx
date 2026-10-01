import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import mapLibreWorker from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

setWorkerUrl(mapLibreWorker);

import { useCart } from "../context/CartContext";
import { createOrder } from "../api/orderApi";
import { auth } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";

import "leaflet/dist/leaflet.css";
import "./Checkout.css";

// --------------------------------------------------
// FIX LEAFLET DEFAULT MARKER ICON
// --------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// --------------------------------------------------
// MAP CENTER COMPONENT
// --------------------------------------------------

function MapCenter({ latitude, longitude }) {
  const map = useMap();

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    map.setView(
      [latitude, longitude],
      16,
      {
        animate: true,
      }
    );
  }

  return null;
}

// --------------------------------------------------
// OPENFREEMAP / MAPLIBRE BASE LAYER
// --------------------------------------------------

function OpenFreeMapLayer() {
  const map = useMap();

  useEffect(() => {
    const mapLibreLayer = maplibreGL({
      style: "https://tiles.openfreemap.org/styles/bright",
    });

    mapLibreLayer.addTo(map);

    return () => {
      if (map.hasLayer(mapLibreLayer)) {
        map.removeLayer(mapLibreLayer);
      }
    };
  }, [map]);

  return null;
}

// --------------------------------------------------
// OPENSTREETMAP NEARBY PLACE LABELS
// --------------------------------------------------

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function NearbyOSMPlaces({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    let cancelled = false;
    const layerGroup = L.layerGroup().addTo(map);

    // Keep OSM labels above the MapLibre canvas, but below Leaflet popups.
    if (!map.getPane("osmPlaceLabels")) {
      const pane = map.createPane("osmPlaceLabels");
      pane.style.zIndex = "650";
      pane.style.pointerEvents = "none";
    }

    const loadNearbyPlaces = async () => {
      try {
        const radius = 2000;

        const query = `
          [out:json][timeout:20];
          (
            nwr["name"]["amenity"](around:${radius},${latitude},${longitude});
            nwr["name"]["shop"](around:${radius},${latitude},${longitude});
            nwr["name"]["tourism"](around:${radius},${latitude},${longitude});
            nwr["name"]["leisure"](around:${radius},${latitude},${longitude});
            nwr["name"]["healthcare"](around:${radius},${latitude},${longitude});
            nwr["name"]["public_transport"](around:${radius},${latitude},${longitude});
            nwr["name"]["place"](around:${radius},${latitude},${longitude});
            nwr["name"]["office"](around:${radius},${latitude},${longitude});
          );
          out center tags;
        `;

        const response = await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
            body: "data=" + encodeURIComponent(query),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Overpass request failed: ${response.status}`
          );
        }

        const data = await response.json();

        if (cancelled) return;

        const elements = Array.isArray(data.elements)
          ? data.elements
          : [];

        const usedCoordinates = new Set();

        elements.forEach((element) => {
          const tags = element.tags || {};

          const name =
            tags.name ||
            tags["name:en"] ||
            tags["name:ta"];

          if (!name) return;

          let lat = element.lat;
          let lon = element.lon;

          if (
            !Number.isFinite(lat) &&
            element.center
          ) {
            lat = element.center.lat;
            lon = element.center.lon;
          }

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
          ) {
            return;
          }

          const coordinateKey =
            `${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;

          if (usedCoordinates.has(coordinateKey)) {
            return;
          }

          usedCoordinates.add(coordinateKey);

          let category = "📍";

          if (tags.amenity === "school") {
            category = "🏫";
          } else if (
            tags.amenity === "hospital" ||
            tags.healthcare
          ) {
            category = "🏥";
          } else if (
            tags.amenity === "place_of_worship"
          ) {
            category = "🛕";
          } else if (
            tags.amenity === "restaurant" ||
            tags.amenity === "cafe"
          ) {
            category = "🍴";
          } else if (tags.amenity === "fuel") {
            category = "⛽";
          } else if (tags.shop) {
            category = "🛒";
          } else if (tags.public_transport) {
            category = "🚌";
          } else if (tags.tourism) {
            category = "📍";
          }

          const safeName = escapeHtml(name);
          const safeCategory = escapeHtml(category);

          const labelIcon = L.divIcon({
            className: "osm-place-label",
            html: `
              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:4px;
                  background:white;
                  border:1px solid #d1d5db;
                  border-radius:7px;
                  padding:4px 7px;
                  box-shadow:0 2px 7px rgba(0,0,0,0.18);
                  color:#1f2937;
                  font-size:11px;
                  font-weight:600;
                  white-space:nowrap;
                  max-width:180px;
                  overflow:hidden;
                  text-overflow:ellipsis;
                  pointer-events:none;
                "
              >
                <span>${safeCategory}</span>
                <span>${safeName}</span>
              </div>
            `,
            iconSize: null,
            iconAnchor: [0, 0],
          });

          const marker = L.marker([lat, lon], {
            icon: labelIcon,
            interactive: false,
            pane: "osmPlaceLabels",
          });

          marker.addTo(layerGroup);
        });
      } catch (error) {
        console.warn(
          "Nearby OSM places failed:",
          error
        );
      }
    };

    loadNearbyPlaces();

    return () => {
      cancelled = true;
      map.removeLayer(layerGroup);
    };
  }, [latitude, longitude, map]);

  return null;
}

// --------------------------------------------------
// MAP CLICK HANDLER
// --------------------------------------------------

function MapLocationPicker({ onLocationSelected }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;

      onLocationSelected(lat, lng);
    },
  });

  return null;
}


// --------------------------------------------------
// CHECKOUT
// --------------------------------------------------

function Checkout() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const {
    cart,
    cartTotal,
    cartTotalWeight,
    cartUnitCount,
    clearCart,
  } = useCart();

  // --------------------------------------------------
  // CUSTOMER
  // --------------------------------------------------

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    shopName: "",
    address: "",
    city: "",
    pincode: "",
    deliveryDate: "",
    deliveryTime: "",
    instructions: "",
  });


  // --------------------------------------------------
  // DELIVERY METHOD
  // --------------------------------------------------

  const [deliveryMethod, setDeliveryMethod] =
    useState("delivery");


  // --------------------------------------------------
  // DELIVERY CALCULATION
  // --------------------------------------------------

  const [deliveryDistance, setDeliveryDistance] =
    useState(null);

  const [deliveryCharge, setDeliveryCharge] =
    useState(null);

  const [calculatingDelivery, setCalculatingDelivery] =
    useState(false);


  // --------------------------------------------------
  // LOCATION
  // --------------------------------------------------

  const [locationSearch, setLocationSearch] =
    useState("");

  const [locationResults, setLocationResults] =
    useState([]);

  const [searchingLocation, setSearchingLocation] =
    useState(false);

  const [gettingCurrentLocation, setGettingCurrentLocation] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [deliveryLocation, setDeliveryLocation] =
    useState({
      latitude: null,
      longitude: null,
      formattedAddress: "",
      confirmed: false,
    });


  // --------------------------------------------------
  // OTHER STATES
  // --------------------------------------------------

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const finalTotal =
    cartTotal + (deliveryCharge || 0);


  // ==================================================
  // INPUT CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Address information changed.
    // The previously selected exact location
    // must no longer be trusted.

    if (
      name === "address" ||
      name === "city" ||
      name === "pincode"
    ) {
      setDeliveryLocation({
        latitude: null,
        longitude: null,
        formattedAddress: "",
        confirmed: false,
      });

      setLocationResults([]);

      setDeliveryDistance(null);
      setDeliveryCharge(null);
    }
  };


  // ==================================================
  // DELIVERY / PICKUP
  // ==================================================

  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);

    setError("");
    setLocationError("");

    if (method === "pickup") {
      setDeliveryDistance(null);
      setDeliveryCharge(0);

      setDeliveryLocation({
        latitude: null,
        longitude: null,
        formattedAddress: "",
        confirmed: false,
      });
    } else {
      setDeliveryDistance(null);
      setDeliveryCharge(null);
    }
  };


  // ==================================================
  // SEARCH LOCATION
  // ==================================================

// ==================================================
// SEARCH LOCATION
// ==================================================

const searchLocation = async () => {
  const rawQuery = locationSearch.trim();

  if (!rawQuery) {
    setLocationError("Enter a location to search.");
    return;
  }

  try {
    setSearchingLocation(true);
    setLocationError("");
    setLocationResults([]);

    // --------------------------------------------------
    // EXTRACT PINCODE
    // Example:
    // "Surandai-627859"
    // becomes:
    // location = "Surandai"
    // pincode  = "627859"
    // --------------------------------------------------

    const pincodeMatch =
      rawQuery.match(/\b\d{6}\b/);

    const extractedPincode =
      pincodeMatch
        ? pincodeMatch[0]
        : "";

    const locationWithoutPincode =
      rawQuery
        .replace(/\b\d{6}\b/g, "")
        .replace(/[-,]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // --------------------------------------------------
    // BUILD CLEAN SEARCH QUERIES
    // --------------------------------------------------

    const queries = [];

    // Original cleaned location
    if (locationWithoutPincode) {
      queries.push(
        `${locationWithoutPincode}, Tamil Nadu, India`
      );
    }

    // Location + pincode
    if (
      locationWithoutPincode &&
      extractedPincode
    ) {
      queries.push(
        `${locationWithoutPincode}, ${extractedPincode}, Tamil Nadu, India`
      );
    }

    // Specific Surandai/Tenkasi fallback
    if (
      locationWithoutPincode
        .toLowerCase()
        .includes("surandai")
    ) {
      queries.push(
        "Surandai, Tenkasi, Tamil Nadu, India"
      );

      queries.push(
        "Surandai, 627859, Tamil Nadu, India"
      );
    }

    // Pincode-only search
    if (extractedPincode) {
      queries.push(
        `${extractedPincode}, Tamil Nadu, India`
      );
    }

    // If customer fields already contain location
    if (
      customer.city?.trim()
    ) {
      queries.push(
        `${customer.city.trim()}, Tamil Nadu, India`
      );
    }

    if (
      customer.pincode?.trim()
    ) {
      queries.push(
        `${customer.pincode.trim()}, Tamil Nadu, India`
      );
    }

    // Remove duplicates
    const uniqueQueries = [
      ...new Set(
        queries.filter(Boolean)
      ),
    ];

    console.log(
      "Location search queries:",
      uniqueQueries
    );

    // --------------------------------------------------
    // SEARCH NOMINATIM
    // --------------------------------------------------

    let allResults = [];

    for (
      const searchQuery of uniqueQueries
    ) {
      try {
        const params =
          new URLSearchParams({
            format: "jsonv2",
            addressdetails: "1",
            limit: "5",
            countrycodes: "in",
            q: searchQuery,
          });

        const url =
          `https://nominatim.openstreetmap.org/search?${params.toString()}`;

        console.log(
          "Searching:",
          searchQuery
        );

        const response =
          await fetch(url, {
            headers: {
              "Accept-Language":
                "en-IN,en",
            },
          });

        if (!response.ok) {
          continue;
        }

        const results =
          await response.json();

        if (
          Array.isArray(results) &&
          results.length > 0
        ) {
          allResults.push(
            ...results
          );
        }

        // Public Nominatim rate protection
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 800)
        );
      } catch (error) {
        console.warn(
          "Search failed:",
          searchQuery,
          error
        );
      }
    }

    // --------------------------------------------------
    // REMOVE DUPLICATE LOCATIONS
    // --------------------------------------------------

    const uniqueResults =
      Array.from(
        new Map(
          allResults.map(
            (result) => [
              `${result.osm_type}-${result.osm_id}`,
              result,
            ]
          )
        ).values()
      );

    // --------------------------------------------------
    // IF NOTHING FOUND
    // --------------------------------------------------

    if (
      uniqueResults.length === 0
    ) {
      setLocationError(
        `Location not found. Try "Surandai" or "627859" separately.`
      );

      return;
    }

    // --------------------------------------------------
    // SCORE RESULTS
    // --------------------------------------------------

    const searchWords =
      locationWithoutPincode
        .toLowerCase()
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 3
        );

    const scoredResults =
      uniqueResults.map(
        (result) => {
          const text =
            (
              result.display_name ||
              ""
            ).toLowerCase();

          let score = 0;

          // Match search words
          searchWords.forEach(
            (word) => {
              if (
                text.includes(word)
              ) {
                score += 5;
              }
            }
          );

          // Prefer Surandai
          if (
            text.includes(
              "surandai"
            )
          ) {
            score += 30;
          }

          // Prefer Tenkasi
          if (
            text.includes(
              "tenkasi"
            )
          ) {
            score += 20;
          }

          // Prefer Tamil Nadu
          if (
            text.includes(
              "tamil nadu"
            )
          ) {
            score += 10;
          }

          // Prefer requested pincode
          if (
            extractedPincode &&
            text.includes(
              extractedPincode
            )
          ) {
            score += 30;
          }

          return {
            ...result,
            _score: score,
          };
        }
      );

    scoredResults.sort(
      (a, b) =>
        b._score -
        a._score
    );

    // --------------------------------------------------
    // SHOW RESULTS
    // --------------------------------------------------

    setLocationResults(
      scoredResults
        .slice(0, 10)
        .map(
          ({
            _score,
            ...result
          }) => result
        )
    );

  } catch (error) {
    console.error(
      "Location search failed:",
      error
    );

    setLocationError(
      "Unable to search location. Please try again."
    );
  } finally {
    setSearchingLocation(false);
  }
};


  // ==================================================
  // SELECT SEARCH RESULT
  // ==================================================

 const selectLocation = async (result) => {
  const latitude =
    Number(result.lat);

  const longitude =
    Number(result.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    setLocationError(
      "Invalid location returned by the map service."
    );

    return;
  }

  const formattedAddress =
    result.display_name || "";

  const address =
    result.address || {};

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    "";

  const pincode =
    address.postcode || "";

  /*
   * IMPORTANT:
   * Search result is NOT automatically confirmed.
   *
   * Customer must check the map and press
   * "Confirm This Location".
   */

  setDeliveryLocation({
    latitude,
    longitude,
    formattedAddress,
    confirmed: false,
  });

  setLocationResults([]);

  setLocationSearch(
    formattedAddress
  );

  setLocationError("");

  /*
   * Update address fields using the selected
   * search result.
   */
  setCustomer((previous) => ({
    ...previous,

    address:
      formattedAddress ||
      previous.address,

    city:
      city ||
      previous.city,

    pincode:
      pincode ||
      previous.pincode,
  }));

  setDeliveryDistance(null);
  setDeliveryCharge(null);
};

// ==================================================
// UPDATE LOCATION FROM MAP MARKER
// ==================================================

const handleMapLocationChange = async (
  latitude,
  longitude
) => {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return;
  }

  try {
    setLocationError("");

    // Location has changed, so confirmation
    // must be done again.
    setDeliveryLocation((previous) => ({
      ...previous,
      latitude,
      longitude,
      confirmed: false,
    }));

    setDeliveryDistance(null);
    setDeliveryCharge(null);

    // Reverse geocode the new pin.
    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      "?format=jsonv2" +
      "&addressdetails=1" +
      `&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}`;

    const response =
      await fetch(url, {
        headers: {
          "Accept-Language":
            "en-IN,en",
        },
      });

    if (!response.ok) {
      return;
    }

    const result =
      await response.json();

    const formattedAddress =
      result.display_name || "";

    const address =
      result.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      "";

    const pincode =
      address.postcode || "";

    setDeliveryLocation(
      (previous) => ({
        ...previous,
        latitude,
        longitude,
        formattedAddress,
        confirmed: false,
      })
    );

    setLocationSearch(
      formattedAddress
    );

    setCustomer((previous) => ({
      ...previous,

      address:
        formattedAddress ||
        previous.address,

      city:
        city ||
        previous.city,

      pincode:
        pincode ||
        previous.pincode,
    }));
  } catch (error) {
    console.warn(
      "Reverse geocoding failed:",
      error
    );
  }
};


// ==================================================
// CONFIRM SELECTED MAP LOCATION
// ==================================================

const confirmSelectedLocation = () => {
  if (
    !Number.isFinite(
      deliveryLocation.latitude
    ) ||
    !Number.isFinite(
      deliveryLocation.longitude
    )
  ) {
    setLocationError(
      "Please select a location on the map first."
    );

    return;
  }

  setDeliveryLocation(
    (previous) => ({
      ...previous,
      confirmed: true,
    })
  );

  setLocationError("");

  setDeliveryDistance(null);
  setDeliveryCharge(null);
};

  // ==================================================
  // USE CURRENT LOCATION
  // ==================================================

  const useCurrentLocation = () => {
    if (
      !navigator.geolocation
    ) {
      setLocationError(
        "Your browser does not support location services."
      );

      return;
    }

    setGettingCurrentLocation(true);
    setLocationError("");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude =
            Number(
              position.coords.latitude
            );

          const longitude =
            Number(
              position.coords.longitude
            );

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
          ) {
            throw new Error(
              "Invalid current location."
            );
          }

          // Reverse geocode coordinates
          // to get readable address.

          const url =
            "https://nominatim.openstreetmap.org/reverse" +
            "?format=jsonv2" +
            "&addressdetails=1" +
            `&lat=${latitude}` +
            `&lon=${longitude}`;

          const response =
            await fetch(url, {
              headers: {
                "Accept-Language": "en",
              },
            });

          if (!response.ok) {
            throw new Error(
              "Unable to identify current location."
            );
          }

          const result =
            await response.json();

          const formattedAddress =
            result.display_name || "";

          const address =
            result.address || {};

          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            "";

          const pincode =
            address.postcode || "";

          setDeliveryLocation({
            latitude,
            longitude,
            formattedAddress,
            confirmed: true,
          });

          setLocationSearch(
            formattedAddress
          );

          setCustomer((previous) => ({
            ...previous,

            address:
              formattedAddress ||
              previous.address,

            city:
              city ||
              previous.city,

            pincode:
              pincode ||
              previous.pincode,
          }));

          setDeliveryDistance(null);
          setDeliveryCharge(null);
          setLocationError("");
        } catch (error) {
          console.error(
            "Current location error:",
            error
          );

          setLocationError(
            error.message ||
              "Unable to identify your current location."
          );
        } finally {
          setGettingCurrentLocation(
            false
          );
        }
      },

      (error) => {
        console.error(
          "Browser geolocation error:",
          error
        );

        let message =
          "Unable to get your current location.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied. Please allow location access or search manually.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your current location could not be determined.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Location request timed out. Please try again.";
        }

        setLocationError(message);
        setGettingCurrentLocation(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  

  // ==================================================
  // CALCULATE DELIVERY
  // ==================================================

  const calculateDelivery = async () => {
    if (
      !customer.address.trim() ||
      !customer.city.trim() ||
      !customer.pincode.trim()
    ) {
      setError(
        t("completeDeliveryAddress")
      );

      return;
    }

    // Exact location is mandatory.
    if (
      !Number.isFinite(
        Number(
          deliveryLocation.latitude
        )
      ) ||
      !Number.isFinite(
        Number(
          deliveryLocation.longitude
        )
      ) ||
      !deliveryLocation.confirmed
    ) {
      setError(
        "Please search and confirm your exact delivery location before calculating delivery."
      );

      return;
    }

    try {
      setCalculatingDelivery(true);
      setError("");

      console.log(
        "========== DELIVERY CALCULATION =========="
      );

      console.log(
        "Address:",
        customer.address
      );

      console.log(
        "City:",
        customer.city
      );

      console.log(
        "Pincode:",
        customer.pincode
      );

      console.log(
        "Latitude:",
        deliveryLocation.latitude
      );

      console.log(
        "Longitude:",
        deliveryLocation.longitude
      );

      console.log(
        "Total Units:",
        cartUnitCount
      );

      console.log(
        "Total Weight:",
        cartTotalWeight,
        "kg"
      );

      const response =
        await fetch(
          "https://wholesale-veg-shop.onrender.com/api/delivery-settings/calculate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              address:
                customer.address.trim(),

              city:
                customer.city.trim(),

              pincode:
                customer.pincode.trim(),

              latitude:
                Number(
                  deliveryLocation.latitude
                ),

              longitude:
                Number(
                  deliveryLocation.longitude
                ),

              totalWeightKg:
                Number(
                  cartTotalWeight || 0
                ),
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "DELIVERY API STATUS:",
        response.status
      );

      console.log(
        "DELIVERY API RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `${t(
              "deliveryCalculationFailed"
            )} (${response.status}).`
        );
      }

      setDeliveryDistance(
        data.distanceKm
      );

      setDeliveryCharge(
        data.deliveryCharge
      );

      console.log(
        "Road Distance:",
        data.distanceKm,
        "km"
      );

      console.log(
        "Delivery Charge: ₹",
        data.deliveryCharge
      );

      if (data.vehicle) {
        console.log(
          "Vehicle Selected:",
          data.vehicle
        );
      }

      console.log(
        "=========================================="
      );
    } catch (error) {
      console.error(
        "Delivery calculation failed:",
        error
      );

      setDeliveryDistance(null);
      setDeliveryCharge(null);

      setError(
        error.message ||
          t("unableToCalculateDelivery")
      );
    } finally {
      setCalculatingDelivery(
        false
      );
    }
  };


  // ==================================================
  // PLACE ORDER
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !cart ||
      cart.length === 0
    ) {
      setError(
        t("emptyCart")
      );

      return;
    }

    if (
      deliveryMethod ===
        "delivery" &&
      deliveryCharge === null
    ) {
      setError(
        t(
          "calculateDeliveryBeforeOrder"
        )
      );

      return;
    }

    if (
      deliveryMethod ===
        "delivery" &&
      !deliveryLocation.confirmed
    ) {
      setError(
        "Please confirm your exact delivery location."
      );

      return;
    }

    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      setError(
        t("loginBeforeOrder")
      );

      return;
    }

    try {
      setLoading(true);

      const token =
        await currentUser.getIdToken();


      // --------------------------------------------------
      // ORDER ITEMS
      // --------------------------------------------------

      const orderItems =
        cart.map((item) => ({
          productId:
            item._id || item.id,

          name:
            item.name,

          nameTa:
            item.nameTa ||
            item.name,

          price:
            Number(
              item.price || 0
            ),

          unit:
            item.unit,

          quantity:
            Number(
              item.quantity || 0
            ),

          weightPerUnitKg:
            Number(
              item.weightPerUnitKg ||
                1
            ),

          totalWeightKg:
            Number(
              item.weightPerUnitKg ||
                1
            ) *
            Number(
              item.quantity || 0
            ),
        }));


      // --------------------------------------------------
      // ORDER DATA
      // --------------------------------------------------

      const orderData = {
        customer: {
          name:
            customer.name.trim(),

          phone:
            customer.phone.trim(),

          email:
            currentUser.email ||
            customer.email.trim(),

          shopName:
            customer.shopName.trim(),

          address:
            deliveryMethod ===
            "delivery"
              ? customer.address.trim()
              : "Self Pickup",

          city:
            deliveryMethod ===
            "delivery"
              ? customer.city.trim()
              : "",

          pincode:
            deliveryMethod ===
            "delivery"
              ? customer.pincode.trim()
              : "",
        },

        customerUid:
          currentUser.uid,

        delivery: {
          method:
            deliveryMethod,

          date:
            customer.deliveryDate,

          time:
            customer.deliveryTime,

          instructions:
            customer.instructions.trim(),

          // Exact customer location
          location:
            deliveryMethod ===
            "delivery"
              ? {
                  latitude:
                    Number(
                      deliveryLocation.latitude
                    ),

                  longitude:
                    Number(
                      deliveryLocation.longitude
                    ),

                  formattedAddress:
                    deliveryLocation.formattedAddress ||
                    customer.address.trim(),
                }
              : {
                  latitude: null,
                  longitude: null,
                  formattedAddress: "",
                },
        },

        deliveryMethod,

        items:
          orderItems,

        totalWeightKg:
          Number(
            cartTotalWeight || 0
          ),

        totalUnits:
          Number(
            cartUnitCount || 0
          ),

        deliveryDistance:
          deliveryMethod ===
          "delivery"
            ? deliveryDistance
            : 0,

        subtotal:
          Number(cartTotal),

        deliveryCharge:
          deliveryMethod ===
          "pickup"
            ? 0
            : Number(
                deliveryCharge || 0
              ),

        total:
          deliveryMethod ===
          "pickup"
            ? Number(cartTotal)
            : Number(finalTotal),

        paymentMethod:
          "Not Selected",
      };


      console.log(
        "========== ORDER DATA =========="
      );

      console.log(
        JSON.stringify(
          orderData,
          null,
          2
        )
      );

      console.log(
        "================================"
      );


      // --------------------------------------------------
      // CREATE ORDER
      // --------------------------------------------------

      const response =
        await createOrder(
          orderData,
          token
        );

      const createdOrder =
        response?.order;

      if (!createdOrder) {
        throw new Error(
          t(
            "orderCreatedNoDetails"
          )
        );
      }

      console.log(
        "ORDER CREATED:",
        createdOrder
      );


      clearCart();

      navigate(
        "/payment",
        {
          state: {
            orderId:
              createdOrder.orderId,

            amount:
              createdOrder.total,
          },
        }
      );
    } catch (error) {
      console.error(
        "Order placement failed:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          error.message ||
          t(
            "failedToPlaceOrder"
          )
      );
    } finally {
      setLoading(false);
    }
  };


  // ==================================================
  // EMPTY CART
  // ==================================================

  if (
    !cart ||
    cart.length === 0
  ) {
    return (
      <div className="empty-cart">

        <div className="empty-cart-icon">
          🛒
        </div>

        <h1>
          {t("emptyCart")}
        </h1>

        <p>
          {t(
            "addVegetablesBeforeCheckout"
          )}
        </p>

        <a
          href="/products"
          className="hero-button"
        >
          {t(
            "browseVegetables"
          )}
        </a>

      </div>
    );
  }


  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="page-container checkout-page">

      {/* HEADER */}

      <div className="page-header">

        <p className="section-label">
          {t("checkout")}
        </p>

        <h1>
          {t(
            "completeYourOrder"
          )}
        </h1>

        <p>
          {t(
            "enterDetailsChooseDelivery"
          )}
        </p>

      </div>


      {/* ERROR */}

      {error && (
        <div className="no-products">

          <h3>
            ⚠️ {error}
          </h3>

        </div>
      )}


      <form
        onSubmit={handleSubmit}
      >

        {/* =========================================
            CUSTOMER DETAILS
        ========================================== */}

        <div className="checkout-section">

          <h2>
            👤{" "}
            {t(
              "customerDetails"
            )}
          </h2>

          <div>

            <label>
              {t(
                "fullName"
              )}{" "}
              *
            </label>

            <input
              name="name"
              type="text"
              placeholder={t(
                "enterFullName"
              )}
              value={
                customer.name
              }
              onChange={
                handleChange
              }
              required
            />

          </div>


          <div>

            <label>
              {t(
                "mobileNumber"
              )}{" "}
              *
            </label>

            <input
              name="phone"
              type="tel"
              placeholder={t(
                "enterMobileNumber"
              )}
              value={
                customer.phone
              }
              onChange={
                handleChange
              }
              required
            />

          </div>


          <div>

            <label>
              {t(
                "emailAddress"
              )}{" "}
              *
            </label>

            <input
              name="email"
              type="email"
              placeholder={t(
                "enterEmailAddress"
              )}
              value={
                customer.email ||
                auth.currentUser
                  ?.email ||
                ""
              }
              onChange={
                handleChange
              }
              required
            />

          </div>


          <div>

            <label>
              {t(
                "shopBusinessName"
              )}
            </label>

            <input
              name="shopName"
              type="text"
              placeholder={t(
                "yourShopBusinessName"
              )}
              value={
                customer.shopName
              }
              onChange={
                handleChange
              }
            />

          </div>

        </div>


        {/* =========================================
            ORDER SUMMARY
        ========================================== */}

        <div className="checkout-section">

          <h2>
            🥬{" "}
            {t(
              "orderInformation"
            )}
          </h2>

          <div className="summary-row">

            <span>
              {t(
                "totalProducts"
              )}
            </span>

            <strong>
              {cart.length}
            </strong>

          </div>

          <div className="summary-row">

            <span>
              {t(
                "totalSellingUnits"
              )}
            </span>

            <strong>
              {cartUnitCount}
            </strong>

          </div>

          <div className="summary-row">

            <span>
              {t(
                "totalOrderWeight"
              )}
            </span>

            <strong>
              {cartTotalWeight} kg
            </strong>

          </div>

          <div className="summary-row">

            <span>
              {t(
                "productSubtotal"
              )}
            </span>

            <strong>
              ₹{cartTotal}
            </strong>

          </div>

        </div>


        {/* =========================================
            FULFILLMENT
        ========================================== */}

        <div className="checkout-section">

          <div className="fulfillment-header">

            <div className="fulfillment-label">
              {t(
                "fulfillment"
              )}
            </div>

            <h2>
              📦{" "}
              {t(
                "howReceiveOrder"
              )}
            </h2>

            <p>
              {t(
                "chooseDeliveryOrPickup"
              )}
            </p>

          </div>


          <div className="fulfillment-options">

            {/* HOME DELIVERY */}

            <button
              type="button"
              className={`fulfillment-card delivery ${
                deliveryMethod ===
                "delivery"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                handleDeliveryMethodChange(
                  "delivery"
                )
              }
            >

              <div className="fulfillment-icon">
                🚚
              </div>

              <div className="fulfillment-title-row">

                <span className="fulfillment-title">
                  {t(
                    "homeDelivery"
                  )}
                </span>

                {deliveryMethod ===
                  "delivery" && (
                  <span className="selected-badge">
                    {t(
                      "selected"
                    )}
                  </span>
                )}

              </div>

              <p className="fulfillment-description">
                {t(
                  "deliveryToDoorstep"
                )}
              </p>

              <span className="fulfillment-charge">
                📍{" "}
                {t(
                  "chargeBasedOnDistance"
                )}
              </span>

              <div className="selection-circle">
                {deliveryMethod ===
                  "delivery" &&
                  "✓"}
              </div>

            </button>


            {/* SELF PICKUP */}

            <button
              type="button"
              className={`fulfillment-card pickup ${
                deliveryMethod ===
                "pickup"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                handleDeliveryMethodChange(
                  "pickup"
                )
              }
            >

              <div className="fulfillment-icon">
                🏪
              </div>

              <div className="fulfillment-title-row">

                <span className="fulfillment-title">
                  {t(
                    "selfPickup"
                  )}
                </span>

                {deliveryMethod ===
                  "pickup" && (
                  <span className="selected-badge">
                    {t(
                      "selected"
                    )}
                  </span>
                )}

              </div>

              <p className="fulfillment-description">
                {t(
                  "collectFromShop"
                )}
              </p>

              <span className="fulfillment-charge">
                ✓{" "}
                {t(
                  "noDeliveryCharge"
                )}
              </span>

              <div className="selection-circle">
                {deliveryMethod ===
                  "pickup" &&
                  "✓"}
              </div>

            </button>

          </div>

        </div>


        {/* =========================================
            HOME DELIVERY DETAILS
        ========================================== */}

        {deliveryMethod ===
          "delivery" && (
          <div className="checkout-section delivery-details">

            <h2>
              🚚{" "}
              {t(
                "deliveryDetails"
              )}
            </h2>


            {/* ======================================
                LOCATION PICKER
            ======================================= */}

            <div className="location-picker">

              <h3>
                📍 Select Delivery Location
              </h3>

              <p className="location-help-text">
               {t("searchLocationTitle")}
              </p>


              {/* SEARCH */}

              <div className="location-search-row">

                <input
                  type="text"
                  value={
                    locationSearch
                  }
                  onChange={(e) => {
                    setLocationSearch(
                      e.target.value
                    );

                    setLocationResults(
                      []
                    );

                    setDeliveryLocation(
                      (previous) => ({
                        ...previous,
                        confirmed:
                          false,
                      })
                    );

                    setDeliveryDistance(
                      null
                    );

                    setDeliveryCharge(
                      null
                    );
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      e.preventDefault();

                      searchLocation();
                    }
                  }}
                  placeholder="Search village, town, area or pincode"
                />

                <button
                  type="button"
                  className="location-search-button"
                  onClick={
                    searchLocation
                  }
                  disabled={
                    searchingLocation
                  }
                >
                  🔎 {t("searchLocation")}
                </button>

              </div>


              {/* CURRENT LOCATION */}

              <button
                type="button"
                className="current-location-button"
                onClick={
                  useCurrentLocation
                }
                disabled={
                  gettingCurrentLocation
                }
              >
                📍 {t("useCurrentLocation")}
              </button>


              {/* SEARCH RESULTS */}

              {locationResults.length >
                0 && (
                <div className="location-results">

                  <div className="location-results-title">
                    Select the correct location:
                  </div>

                  {locationResults.map(
                    (result, index) => (
                      <button
                        key={
                          result.place_id ||
                          index
                        }
                        type="button"
                        className="location-result-item"
                        onClick={() =>
                          selectLocation(
                            result
                          )
                        }
                      >

                        <span className="location-result-icon">
                          📍
                        </span>

                        <span>
                          {
                            result.display_name
                          }
                        </span>

                      </button>
                    )
                  )}

                </div>
              )}


              {/* LOCATION ERROR */}

              {locationError && (
                <div className="location-error">
                  ⚠️{" "}
                  {locationError}
                </div>
              )}


              {/* MAP */}

             {/* ======================================
    MAP + LOCATION CONFIRMATION
======================================= */}

{deliveryLocation.latitude !==
  null &&
  deliveryLocation.longitude !==
    null && (
  <>

    <div className="delivery-map-wrapper">

      <h3>
    {t("map")}
  </h3>

      <MapContainer
        center={[
          deliveryLocation.latitude,
          deliveryLocation.longitude,
        ]}
        zoom={14}
        scrollWheelZoom={true}
        className="delivery-map"
      >

        <OpenFreeMapLayer />

        <NearbyOSMPlaces
          latitude={deliveryLocation.latitude}
          longitude={deliveryLocation.longitude}
        />

        <MapLocationPicker
          onLocationSelected={handleMapLocationChange}
        />

        <Marker
          position={[
            deliveryLocation.latitude,
            deliveryLocation.longitude,
          ]}
          draggable={true}
          eventHandlers={{
            dragend: (event) => {
              const marker =
                event.target;

              const position =
                marker.getLatLng();

              handleMapLocationChange(
                position.lat,
                position.lng
              );
            },
          }}
        >

          <Popup>
            <strong>
              📍 Delivery Location
            </strong>

            <br />

            Drag the pin or click anywhere
            on the map to select your exact
            delivery location.
          </Popup>

        </Marker>

        <MapCenter
          latitude={
            deliveryLocation.latitude
          }
          longitude={
            deliveryLocation.longitude
          }
        />

      </MapContainer>

    </div>


    {/* MAP INSTRUCTIONS */}

    <div
      className="map-location-instruction"
      style={{
        marginTop: "10px",
        padding: "12px 15px",
        borderRadius: "10px",
        background: "#f3f8f5",
        border: "1px solid #cfe6d8",
        color: "#176b3a",
        fontSize: "14px",
        lineHeight: "1.5",
      }}
    >
      📍📍 <strong>{t("checkYourLocation")}</strong>{" "}
{t("dragPinInstruction")}
    </div>


    {/* CONFIRM BUTTON */}

    {!deliveryLocation.confirmed && (
  <button
    type="button"
    onClick={confirmSelectedLocation}
    style={{
      width: "100%",
      marginTop: "12px",
      padding: "13px 18px",
      border: "none",
      borderRadius: "10px",
      background:
        "linear-gradient(135deg, #198754, #146c43)",
      color: "#fff",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow:
        "0 4px 12px rgba(25, 135, 84, 0.20)",
    }}
  >
    ✅ {t("confirmLocation")}
  </button>
)}

  </>
)}


              {/* CONFIRMED LOCATION */}

              {/* ======================================
    CONFIRMED LOCATION
======================================= */}

{deliveryLocation.confirmed &&
  deliveryLocation.latitude !== null &&
  deliveryLocation.longitude !== null && (
    <div className="confirmed-location">

      <div className="confirmed-location-title">
  ✅ {t("locationConfirmed")}
</div>

      <div className="confirmed-location-address">
        {deliveryLocation.formattedAddress ||
          customer.address}
      </div>

      <div className="coordinates">
        Latitude:{" "}
        {deliveryLocation.latitude.toFixed(6)}
        <br />

        Longitude:{" "}
        {deliveryLocation.longitude.toFixed(6)}
      </div>

    </div>
  )}


            </div>


            {/* ======================================
                ADDRESS
            ======================================= */}

            <label>
              {t(
                "deliveryAddress"
              )}{" "}
              *
            </label>

            <textarea
              name="address"
              placeholder={t(
                "enterCompleteAddress"
              )}
              value={
                customer.address
              }
              onChange={
                handleChange
              }
              required
            />


            <div className="form-row">

              <div>

                <label>
                  {t(
                    "cityArea"
                  )}{" "}
                  *
                </label>

                <input
                  name="city"
                  type="text"
                  placeholder={t(
                    "enterCityArea"
                  )}
                  value={
                    customer.city
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              <div>

                <label>
                  {t(
                    "pincode"
                  )}{" "}
                  *
                </label>

                <input
                  name="pincode"
                  type="text"
                  placeholder={t(
                    "enterPincode"
                  )}
                  value={
                    customer.pincode
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>



            {/* CALCULATE DELIVERY */}

            <button
              type="button"
              className="calculate-delivery-button"
              onClick={
                calculateDelivery
              }
              disabled={
                calculatingDelivery ||
                !deliveryLocation.confirmed
              }
            >
              {calculatingDelivery
                ? t(
                    "calculating"
                  )
                : `📍 ${t(
                    "calculateDelivery"
                  )}`}
            </button>


            {/* DELIVERY RESULT */}

            {deliveryDistance !==
              null && (
              <div className="delivery-distance-info">

                <strong>
                  📍{" "}
                  {t(
                    "roadDistance"
                  )}
                  :{" "}
                  {deliveryDistance}{" "}
                  km
                </strong>

                <span>
                  {t(
                    "deliveryCharge"
                  )}
                  : ₹
                  {
                    deliveryCharge
                  }
                </span>

              </div>
            )}


            <div className="form-row">

              <div>

                <label>
                  {t(
                    "deliveryDate"
                  )}
                </label>

                <input
                  type="date"
                  name="deliveryDate"
                  value={
                    customer.deliveryDate
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              <div>

                <label>
                  {t(
                    "preferredTime"
                  )}
                </label>

                <select
                  name="deliveryTime"
                  value={
                    customer.deliveryTime
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="">
                    {t(
                      "selectTime"
                    )}
                  </option>

                  <option value="6 AM - 9 AM">
                    6 AM - 9 AM
                  </option>

                  <option value="9 AM - 12 PM">
                    9 AM - 12 PM
                  </option>

                  <option value="12 PM - 4 PM">
                    12 PM - 4 PM
                  </option>

                  <option value="4 PM - 7 PM">
                    4 PM - 7 PM
                  </option>

                </select>

              </div>

            </div>


            <label>
              {t(
                "specialInstructions"
              )}
            </label>

            <textarea
              name="instructions"
              placeholder={t(
                "deliveryInstructionExample"
              )}
              value={
                customer.instructions
              }
              onChange={
                handleChange
              }
            />

          </div>
        )}


        {/* =========================================
            SELF PICKUP
        ========================================== */}

        {deliveryMethod ===
          "pickup" && (
          <div className="checkout-section pickup-details">

            <h2>
              🏪{" "}
              {t(
                "selfPickupDetails"
              )}
            </h2>

            <div className="pickup-info">

              <strong>
                {t(
                  "collectOrderFrom"
                )}
              </strong>

              <p>
                SAD Prakash Wholesale
                Vegetable Shop
              </p>

              <p>
                📍{" "}
                {t(
                  "shopLocationAfterOrder"
                )}
              </p>

              <p className="pickup-free">
                ✓{" "}
                {t(
                  "noDeliveryCharge"
                )}
              </p>

            </div>


            <div className="form-row">

              <div>

                <label>
                  {t(
                    "pickupDate"
                  )}
                </label>

                <input
                  type="date"
                  name="deliveryDate"
                  value={
                    customer.deliveryDate
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              <div>

                <label>
                  {t(
                    "preferredPickupTime"
                  )}
                </label>

                <select
                  name="deliveryTime"
                  value={
                    customer.deliveryTime
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="">
                    {t(
                      "selectTime"
                    )}
                  </option>

                  <option value="6 AM - 9 AM">
                    6 AM - 9 AM
                  </option>

                  <option value="9 AM - 12 PM">
                    9 AM - 12 PM
                  </option>

                  <option value="12 PM - 4 PM">
                    12 PM - 4 PM
                  </option>

                  <option value="4 PM - 7 PM">
                    4 PM - 7 PM
                  </option>

                </select>

              </div>

            </div>


            <label>
              {t(
                "specialInstructions"
              )}
            </label>

            <textarea
              name="instructions"
              placeholder={t(
                "pickupInstructionExample"
              )}
              value={
                customer.instructions
              }
              onChange={
                handleChange
              }
            />

          </div>
        )}


        {/* =========================================
            FINAL ORDER TOTAL
        ========================================== */}

        <div className="checkout-total">

          <h2>
            {t(
              "orderTotal"
            )}
          </h2>


          <div className="summary-row">

            <span>
              {t(
                "subtotal"
              )}
            </span>

            <strong>
              ₹{cartTotal}
            </strong>

          </div>


          <div className="summary-row">

            <span>
              {deliveryMethod ===
              "pickup"
                ? t(
                    "selfPickup"
                  )
                : t(
                    "delivery"
                  )}
            </span>

            <strong>

              {deliveryMethod ===
              "pickup"
                ? "₹0"
                : deliveryCharge ===
                  null
                ? t(
                    "calculate"
                  )
                : `₹${deliveryCharge}`}

            </strong>

          </div>


          {deliveryMethod ===
            "delivery" &&
            deliveryDistance !==
              null && (
              <div className="summary-row">

                <span>
                  {t(
                    "roadDistance"
                  )}
                </span>

                <strong>
                  {deliveryDistance}{" "}
                  km
                </strong>

              </div>
            )}


          <div className="summary-row">

            <span>
              {t(
                "totalOrderWeight"
              )}
            </span>

            <strong>
              {cartTotalWeight}{" "}
              kg
            </strong>

          </div>


          <div className="summary-total">

            <span>
              {t("total")}
            </span>

            <strong>
              ₹
              {deliveryMethod ===
              "pickup"
                ? cartTotal
                : finalTotal}
            </strong>

          </div>


          <button
            type="submit"
            className="place-order-button"
            disabled={
              loading ||
              (deliveryMethod ===
                "delivery" &&
                deliveryCharge ===
                  null)
            }
          >
            {loading
              ? t(
                  "placingOrder"
                )
              : `🥬 ${t(
                  "placeOrder"
                )}`}
          </button>

        </div>

      </form>

    </div>
  );
}

export default Checkout;