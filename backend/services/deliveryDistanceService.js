const ShopSettings = require("../models/ShopSettings");
const DeliverySettings = require("../models/DeliverySettings");

/* =========================================
   GEOCODE CUSTOMER ADDRESS
   FALLBACK ONLY
========================================= */

const geocodeAddress = async ({
  address,
  city,
  pincode,
}) => {
  const queries = [
    [address, city, pincode, "India"],
    [city, pincode, "India"],
    [address, city, "India"],
    [city, "Tamil Nadu", "India"],
  ];

  for (const parts of queries) {
    const query = parts
      .filter(Boolean)
      .join(", ");

    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?format=jsonv2` +
      `&limit=1` +
      `&countrycodes=in` +
      `&q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "SAD-Prakash-Wholesale-Vegetable-Shop/1.0",
          "Accept-Language": "en",
        },
      });

      if (!response.ok) {
        continue;
      }

      const results = await response.json();

      if (
        results &&
        results.length > 0
      ) {
        return {
          latitude: Number(
            results[0].lat
          ),
          longitude: Number(
            results[0].lon
          ),
        };
      }
    } catch (error) {
      console.error(
        "Geocoding attempt failed:",
        error.message
      );
    }
  }

  throw new Error(
    "Delivery address could not be located. Please check the address, city and pincode."
  );
};


/* =========================================
   CALCULATE ROAD DISTANCE
========================================= */

const calculateRoadDistance = async ({
  shopLatitude,
  shopLongitude,
  customerLatitude,
  customerLongitude,
}) => {
  const coordinates =
    `${shopLongitude},${shopLatitude};` +
    `${customerLongitude},${customerLatitude}`;

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${coordinates}?overview=false`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Unable to calculate delivery distance."
    );
  }

  const data =
    await response.json();

  if (
    data.code !== "Ok" ||
    !data.routes ||
    data.routes.length === 0
  ) {
    throw new Error(
      "No driving route could be found for this delivery address."
    );
  }

  const distanceMeters =
    data.routes[0].distance;

  return distanceMeters / 1000;
};


/* =========================================
   SELECT VEHICLE BY ORDER WEIGHT
========================================= */

const selectVehicle = ({
  vehicles,
  totalWeightKg,
}) => {
  if (
    !vehicles ||
    vehicles.length === 0
  ) {
    throw new Error(
      "No delivery vehicles have been configured."
    );
  }

  const enabledVehicles =
    vehicles
      .filter(
        (vehicle) =>
          vehicle.enabled !== false
      )
      .sort(
        (a, b) =>
          Number(a.maxWeightKg) -
          Number(b.maxWeightKg)
      );

  const selectedVehicle =
    enabledVehicles.find(
      (vehicle) =>
        Number(vehicle.maxWeightKg) >=
        Number(totalWeightKg)
    );

  if (!selectedVehicle) {
    throw new Error(
      `No delivery vehicle is available for an order weighing ${totalWeightKg} kg.`
    );
  }

  return selectedVehicle;
};


/* =========================================
   CALCULATE FIXED DELIVERY CHARGE
========================================= */

const calculateFixedDeliveryCharge = ({
  vehicle,
  distanceKm,
}) => {
  const ratePerKm =
    Number(vehicle.ratePerKm);

  if (
    !Number.isFinite(ratePerKm) ||
    ratePerKm < 0
  ) {
    throw new Error(
      `${vehicle.label} has an invalid delivery rate.`
    );
  }

  const rawCharge =
    Number(distanceKm) *
    ratePerKm;

  /*
   * Round to nearest rupee.
   *
   * Example:
   * 25 × ₹1.75 = ₹43.75
   * Final charge = ₹44
   */

  const deliveryCharge =
    Math.round(rawCharge);

  return {
    ratePerKm,

    rawCharge:
      Number(
        rawCharge.toFixed(2)
      ),

    deliveryCharge,
  };
};


/* =========================================
   MAIN DELIVERY CALCULATION
========================================= */

const calculateDeliveryCharge = async ({
  address,
  city,
  pincode,
  latitude,
  longitude,
  totalWeightKg,
}) => {
  const orderWeight =
    Number(totalWeightKg);

  /* =========================
     VALIDATE WEIGHT
  ========================= */

  if (
    !Number.isFinite(orderWeight) ||
    orderWeight <= 0
  ) {
    throw new Error(
      "Unable to calculate delivery because the order weight is invalid."
    );
  }


  /* =========================
     GET SHOP SETTINGS
  ========================= */

  const shop =
    await ShopSettings.findOne();

  if (!shop) {
    throw new Error(
      "Shop settings are not configured."
    );
  }

  if (
    shop.latitude === null ||
    shop.latitude === undefined ||
    shop.longitude === null ||
    shop.longitude === undefined
  ) {
    throw new Error(
      "Shop location has not been configured by the admin."
    );
  }


  /* =========================
     GET DELIVERY SETTINGS
  ========================= */

  const settings =
    await DeliverySettings.findOne();

  if (!settings) {
    throw new Error(
      "Delivery settings are not configured."
    );
  }


  /* =========================
     CHECK DELIVERY STATUS
  ========================= */

  if (!settings.isEnabled) {
    return {
      distanceKm: 0,

      totalWeightKg:
        orderWeight,

      deliveryCharge: 0,

      deliveryEnabled:
        false,
    };
  }


  /* =========================
     SELECT VEHICLE
  ========================= */

  const vehicle =
    selectVehicle({
      vehicles:
        settings.vehicles,

      totalWeightKg:
        orderWeight,
    });


  /* =========================
     CUSTOMER LOCATION
  =========================
  
  IMPORTANT:
  If the customer has selected
  an exact location, use those
  coordinates directly.

  We do NOT geocode the address
  again in that case.
  */

  let customerLocation;

  const customerLatitude =
    Number(latitude);

  const customerLongitude =
    Number(longitude);

  if (
    Number.isFinite(
      customerLatitude
    ) &&
    Number.isFinite(
      customerLongitude
    )
  ) {
    customerLocation = {
      latitude:
        customerLatitude,

      longitude:
        customerLongitude,
    };
  } else {
    /*
     * Fallback for old requests
     * that do not contain coordinates.
     */

    customerLocation =
      await geocodeAddress({
        address,
        city,
        pincode,
      });
  }


  /* =========================
     VALIDATE CUSTOMER COORDINATES
  ========================= */

  if (
    customerLocation.latitude < -90 ||
    customerLocation.latitude > 90
  ) {
    throw new Error(
      "Invalid customer latitude."
    );
  }

  if (
    customerLocation.longitude < -180 ||
    customerLocation.longitude > 180
  ) {
    throw new Error(
      "Invalid customer longitude."
    );
  }


  /* =========================
     CALCULATE ROAD DISTANCE
  ========================= */

  const distanceKm =
    await calculateRoadDistance({
      shopLatitude:
        shop.latitude,

      shopLongitude:
        shop.longitude,

      customerLatitude:
        customerLocation.latitude,

      customerLongitude:
        customerLocation.longitude,
    });


  /* =========================
     CHECK MAXIMUM DISTANCE
  ========================= */

  if (
    distanceKm >
    settings.maxDistanceKm
  ) {
    throw new Error(
      `Delivery is available only within ${settings.maxDistanceKm} km. Your location is approximately ${distanceKm.toFixed(1)} km away.`
    );
  }


  /* =========================
     CALCULATE DELIVERY CHARGE
  ========================= */

  const cost =
    calculateFixedDeliveryCharge({
      vehicle,
      distanceKm,
    });


  /* =========================
     RETURN RESULT
  ========================= */

  return {
    distanceKm:
      Number(
        distanceKm.toFixed(2)
      ),

    totalWeightKg:
      orderWeight,

    deliveryCharge:
      cost.deliveryCharge,

    ratePerKm:
      cost.ratePerKm,

    rawDeliveryCharge:
      cost.rawCharge,

    vehicle: {
      type:
        vehicle.type,

      label:
        vehicle.label,

      maxWeightKg:
        Number(
          vehicle.maxWeightKg
        ),

      ratePerKm:
        Number(
          vehicle.ratePerKm
        ),
    },

    maxDistanceKm:
      Number(
        settings.maxDistanceKm
      ),

    customerLatitude:
      customerLocation.latitude,

    customerLongitude:
      customerLocation.longitude,
  };
};


module.exports = {
  calculateDeliveryCharge,
};