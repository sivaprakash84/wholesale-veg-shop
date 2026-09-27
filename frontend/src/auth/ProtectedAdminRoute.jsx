import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../firebase";


function ProtectedAdminRoute() {

  const [checking, setChecking] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);


  useEffect(() => {

    let isMounted = true;


    // =====================================================
    // CHECK FIREBASE GOOGLE SESSION
    // =====================================================

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          if (!currentUser) {

            localStorage.removeItem(
              "adminToken"
            );

            localStorage.removeItem(
              "adminUser"
            );

            if (isMounted) {
              setAuthorized(false);
              setChecking(false);
            }

            return;
          }


          // =================================================
          // GET ADMIN JWT
          // =================================================

          const token =
            localStorage.getItem(
              "adminToken"
            );


          const adminUser =
            localStorage.getItem(
              "adminUser"
            );


          if (!token || !adminUser) {

            if (isMounted) {
              setAuthorized(false);
              setChecking(false);
            }

            return;
          }


          // =================================================
          // VERIFY ADMIN JWT WITH BACKEND
          // =================================================

          try {

            const response =
              await axios.get(
                "http://localhost:5000/api/auth/admin/verify",
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );


            // =================================================
            // CHECK BACKEND RESPONSE
            // =================================================

            if (
              response.data?.valid !== true
            ) {

              throw new Error(
                "Admin token is invalid"
              );

            }


            // =================================================
            // CHECK EMAIL MATCH
            // =================================================

            const storedAdmin =
              JSON.parse(adminUser);


            const backendAdmin =
              response.data.admin;


            if (
              !storedAdmin.email ||
              !backendAdmin?.email ||
              currentUser.email?.toLowerCase() !==
                backendAdmin.email.toLowerCase()
            ) {

              throw new Error(
                "Admin account mismatch"
              );

            }


            // =================================================
            // ADMIN VERIFIED
            // =================================================

            if (isMounted) {

              setAuthorized(true);
              setChecking(false);

            }

          } catch (error) {

            console.error(
              "Admin verification failed:",
              error
            );


            // =================================================
            // REMOVE INVALID ADMIN SESSION
            // =================================================

            localStorage.removeItem(
              "adminToken"
            );

            localStorage.removeItem(
              "adminUser"
            );


            if (isMounted) {

              setAuthorized(false);
              setChecking(false);

            }

          }

        }
      );


    return () => {

      isMounted = false;

      unsubscribe();

    };

  }, []);


  // =====================================================
  // CHECKING
  // =====================================================

  if (checking) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8f5",
          fontSize: "16px",
          color: "#555",
        }}
      >
        Verifying admin access...
      </div>
    );

  }


  // =====================================================
  // NOT AUTHORIZED
  // =====================================================

  if (!authorized) {

    return (
      <Navigate
        to="/admin-login"
        replace
      />
    );

  }


  // =====================================================
  // AUTHORIZED
  // =====================================================

  return <Outlet />;

}


export default ProtectedAdminRoute;