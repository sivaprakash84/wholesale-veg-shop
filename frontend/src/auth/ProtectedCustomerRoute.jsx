import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCustomerAuth } from "./CustomerAuthContext";

function ProtectedCustomerRoute() {
  const { user, loading } = useCustomerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Checking login...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedCustomerRoute;