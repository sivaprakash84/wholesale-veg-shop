import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import AdminNavbar from "./admin/AdminNavbar";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Payment from "./pages/Payment";
import PaymentUpload from "./pages/PaymentUpload";
import Invoice from "./pages/Invoice";
import Profile from "./pages/Profile";

import CustomerLogin from "./auth/CustomerLogin";
import { CustomerAuthProvider } from "./auth/CustomerAuthContext";
import ProtectedCustomerRoute from "./auth/ProtectedCustomerRoute";

import AdminLogin from "./admin/AdminLogin";
import ProtectedAdminRoute from "./auth/ProtectedAdminRoute";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminPaymentSettings from "./admin/AdminPaymentSettings";
import AdminReports from "./admin/AdminReports";
import AdminProfile from "./admin/AdminProfile";
import AdminDeliverySettings from "./admin/AdminDeliverySettings";

import { CartProvider } from "./context/CartContext";

import {
  LanguageProvider,
} from "./i18n/LanguageContext";

function AppLayout() {
  const location = useLocation();

  // Hide customer Navbar on all admin pages
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {isAdminPage ? <AdminNavbar /> : <Navbar />}

      <Routes>

        {/* ================= CUSTOMER PUBLIC PAGES ================= */}

        <Route path="/" element={<Home />} />

        <Route path="/products" element={<Products />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/login" element={<CustomerLogin />} />


        {/* ================= CUSTOMER PROTECTED PAGES ================= */}

        <Route element={<ProtectedCustomerRoute />}>

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/my-orders"
            element={<MyOrders />}
          />

          <Route
            path="/payment"
            element={<Payment />}
          />

          <Route
            path="/payment-upload"
            element={<PaymentUpload />}
          />

          <Route
  path="/invoice/:orderId"
  element={<Invoice />}
/>

          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>


        {/* ================= ADMIN LOGIN ================= */}

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />


        {/* ================= ADMIN PROTECTED PAGES ================= */}

        <Route element={<ProtectedAdminRoute />}>

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/products"
            element={<AdminProducts />}
          />

          <Route
            path="/admin/orders"
            element={<AdminOrders />}
          />

          <Route
            path="/admin/payment-settings"
            element={<AdminPaymentSettings />}
          />

          <Route
            path="/admin/reports"
            element={<AdminReports />}
          />

          <Route
            path="/admin/profile"
            element={<AdminProfile />}
          />

          <Route
  path="/admin/delivery-settings"
  element={<AdminDeliverySettings />}
/>

        </Route>

      </Routes>
    </>
  );
}


function App() {
  return (
    <BrowserRouter>
      <CustomerAuthProvider>
        <LanguageProvider>
          <CartProvider>
            <AppLayout />
          </CartProvider>
        </LanguageProvider>
      </CustomerAuthProvider>
    </BrowserRouter>
  );
}

export default App;