import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminOrders.css";

const getAuthConfig = () => {
  const token = localStorage.getItem("adminToken");

  console.log("Admin token exists:", !!token);

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const API_URL = "https://wholesale-veg-shop.onrender.com/api/orders";
const BACKEND_URL = "https://wholesale-veg-shop.onrender.com";

const statuses = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingPayment, setUpdatingPayment] = useState("");

  // =====================================================
  // SEARCH + FILTER STATES
  // =====================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        API_URL,
        getAuthConfig()
      );

      setOrders(response.data);
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const updateStatus = async (
    orderId,
    orderStatus
  ) => {
    try {
      setError("");

      await axios.put(
        `${API_URL}/${orderId}/status`,
        { orderStatus },
        getAuthConfig()
      );

      await loadOrders();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to update order status."
      );
    }
  };

  // =====================================================
  // UPDATE PAYMENT STATUS
  // =====================================================

  const updatePaymentStatus = async (
    orderId,
    paymentStatus
  ) => {
    try {
      setUpdatingPayment(orderId);
      setError("");

      const response = await axios.put(
        `${API_URL}/${orderId}/payment-status`,
        {
          paymentStatus,
        },
        getAuthConfig()
      );

      console.log(
        "Payment status updated:",
        response.data
      );

      await loadOrders();
    } catch (err) {
      console.error(
        "Payment verification error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update payment status."
      );
    } finally {
      setUpdatingPayment("");
    }
  };

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredOrders = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const customerName =
        order.customer?.name?.toLowerCase() || "";

      const phone =
        order.customer?.phone?.toLowerCase() || "";

      const shopName =
        order.customer?.shopName?.toLowerCase() || "";

      const orderId =
        order.orderId?.toLowerCase() || "";

      const matchesSearch =
        !search ||
        orderId.includes(search) ||
        customerName.includes(search) ||
        phone.includes(search) ||
        shopName.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        order.orderStatus === statusFilter;

      const matchesPayment =
        paymentFilter === "All" ||
        order.paymentStatus === paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    searchTerm,
    statusFilter,
    paymentFilter,
  ]);

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) =>
      order.orderStatus === "Pending"
  ).length;

  const paidOrders = orders.filter(
    (order) =>
      order.paymentStatus === "Paid"
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      order.orderStatus === "Delivered"
  ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-container">

        <div className="admin-empty">

          <h2>
            Loading orders...
          </h2>

          <p>
            Please wait.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="admin-container">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="admin-page-header">

        <div>

          <p className="section-label">
            SHOP ADMIN
          </p>

          <h1>
            Customer Orders
          </h1>

          <p>
            View orders, verify payments and update
            delivery status.
          </p>

        </div>

        <button
          className="admin-refresh-button"
          onClick={loadOrders}
        >
          🔄 Refresh
        </button>

      </div>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="admin-error">
          ⚠️ {error}
        </div>
      )}


      {/* ==================================================
          ORDER STATISTICS
      ================================================== */}

      <div className="admin-stats-grid">

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            📦
          </div>

          <div>
            <span>
              Total Orders
            </span>

            <strong>
              {totalOrders}
            </strong>
          </div>

        </div>


        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            ⏳
          </div>

          <div>
            <span>
              Pending Orders
            </span>

            <strong>
              {pendingOrders}
            </strong>
          </div>

        </div>


        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            💳
          </div>

          <div>
            <span>
              Paid Orders
            </span>

            <strong>
              {paidOrders}
            </strong>
          </div>

        </div>


        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            🚚
          </div>

          <div>
            <span>
              Delivered
            </span>

            <strong>
              {deliveredOrders}
            </strong>
          </div>

        </div>

      </div>


      {/* ==================================================
          SEARCH + FILTERS
      ================================================== */}

      <div className="admin-order-filters">

        <div className="admin-search-box">

          <label>
            🔍 Search Orders
          </label>

          <input
            type="text"
            placeholder="Order ID, customer, phone or shop..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

        </div>


        <div className="admin-filter-box">

          <label>
            Order Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >

            <option value="All">
              All Orders
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}

          </select>

        </div>


        <div className="admin-filter-box">

          <label>
            Payment Status
          </label>

          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(e.target.value)
            }
          >

            <option value="All">
              All Payments
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Failed">
              Failed
            </option>

          </select>

        </div>


        <button
          className="admin-clear-filter"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("All");
            setPaymentFilter("All");
          }}
        >
          Clear Filters
        </button>

      </div>


      {/* ==================================================
          FILTER RESULT COUNT
      ================================================== */}

      <div className="admin-result-count">

        Showing{" "}
        <strong>
          {filteredOrders.length}
        </strong>{" "}
        of{" "}
        <strong>
          {orders.length}
        </strong>{" "}
        orders

      </div>


      {/* ==================================================
          NO ORDERS
      ================================================== */}

      {orders.length === 0 ? (

        <div className="admin-empty">

          <div className="admin-empty-icon">
            📦
          </div>

          <h2>
            No Orders Yet
          </h2>

          <p>
            Customer orders will appear here.
          </p>

        </div>

      ) : filteredOrders.length === 0 ? (

        <div className="admin-empty">

          <div className="admin-empty-icon">
            🔍
          </div>

          <h2>
            No Matching Orders
          </h2>

          <p>
            Try changing your search or filters.
          </p>

        </div>

      ) : (

        <div className="admin-orders">

          {filteredOrders.map((order) => {

            const paymentPending =
              order.paymentStatus === "Pending" &&
              order.paymentScreenshot;

            const paymentPaid =
              order.paymentStatus === "Paid";

            const paymentFailed =
              order.paymentStatus === "Failed";

            return (

              <div
                className="admin-order-card"
                key={order._id}
              >

                {/* =========================================
                    ORDER HEADER
                ========================================= */}

                <div className="admin-order-header">

                  <div>

                    <p className="order-label">
                      ORDER ID
                    </p>

                    <h2>
                      {order.orderId}
                    </h2>

                    <p className="order-date">

                      {new Date(
                        order.orderedAt
                      ).toLocaleString("en-IN")}

                    </p>

                  </div>


                  {/* ORDER STATUS */}

                  <div className="order-status-section">

                    <label>
                      Order Status
                    </label>

                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        updateStatus(
                          order.orderId,
                          e.target.value
                        )
                      }
                    >

                      {statuses.map(
                        (status) => (

                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>


                {/* =========================================
                    CUSTOMER DETAILS
                ========================================= */}

                <div className="admin-order-section">

                  <h3>
                    👤 Customer Details
                  </h3>

                  <div className="order-details-grid">

                    <div>
                      <strong>
                        Name
                      </strong>

                      <span>
                        {order.customer?.name ||
                          "-"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Phone
                      </strong>

                      <span>
                        {order.customer?.phone ||
                          "-"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Email
                      </strong>

                      <span>
                        {order.customer?.email ||
                          "-"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Shop
                      </strong>

                      <span>
                        {order.customer?.shopName ||
                          "Not provided"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Pincode
                      </strong>

                      <span>
                        {order.customer?.pincode ||
                          "-"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Address
                      </strong>

                      <span>
                        {order.customer?.address ||
                          "-"}
                      </span>
                    </div>

                  </div>

                </div>


                {/* =========================================
                    DELIVERY DETAILS
                ========================================= */}

                <div className="admin-order-section">

                  <h3>
                    🚚 Delivery Details
                  </h3>

                  <div className="order-details-grid">

                    <div>
                      <strong>
                        Date
                      </strong>

                      <span>
                        {order.delivery?.date ||
                          "Not selected"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Time
                      </strong>

                      <span>
                        {order.delivery?.time ||
                          "Not selected"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Instructions
                      </strong>

                      <span>
                        {order.delivery?.instructions ||
                          "None"}
                      </span>
                    </div>

                  </div>

                </div>


                {/* =========================================
                    PRODUCTS
                ========================================= */}

                <div className="admin-order-section">

                  <h3>
                    🥬 Ordered Vegetables
                  </h3>

                  <div className="ordered-items">

                    {order.items?.map(
                      (item, index) => (

                        <div
                          className="ordered-item"
                          key={index}
                        >

                          <div>

                            <strong>
                              {item.name}
                            </strong>

                            <span>
                              ₹{item.price} /{" "}
                              {item.unit}
                            </span>

                          </div>


                          <div>
                            × {item.quantity}
                          </div>


                          <div>
                            ₹{item.total}
                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>


                {/* =========================================
                    PAYMENT VERIFICATION
                ========================================= */}

                <div className="admin-order-section">

                  <h3>
                    💳 Payment Verification
                  </h3>

                  <div className="payment-verification">

                    {/* PAYMENT METHOD */}

                    <div className="payment-info">

                      <strong>
                        Payment Method
                      </strong>

                      <span>
                        {order.paymentMethod ||
                          "Not Selected"}
                      </span>

                    </div>


                    {/* PAYMENT STATUS */}

                    <div className="payment-info">

                      <strong>
                        Payment Status
                      </strong>

                      <span
                        className={`payment-status ${
                          paymentPaid
                            ? "payment-paid"
                            : paymentFailed
                            ? "payment-failed"
                            : "payment-pending"
                        }`}
                      >
                        {order.paymentStatus ||
                          "Pending"}
                      </span>

                    </div>


                    {/* SCREENSHOT */}

                    {order.paymentScreenshot && (

                      <div className="payment-screenshot">

                        <strong>
                          Payment Screenshot
                        </strong>

                        <a
                          href={`${BACKEND_URL}${order.paymentScreenshot}`}
                          target="_blank"
                          rel="noreferrer"
                        >

                          <img
                            src={`${BACKEND_URL}${order.paymentScreenshot}`}
                            alt="Payment Screenshot"
                          />

                        </a>


                        <a
                          className="view-payment-button"
                          href={`${BACKEND_URL}${order.paymentScreenshot}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          🔍 View Full Screenshot
                        </a>

                      </div>

                    )}


                    {/* APPROVE / REJECT */}

                    {paymentPending && (

                      <div className="payment-actions">

                        <button
                          className="approve-payment-button"
                          disabled={
                            updatingPayment ===
                            order.orderId
                          }
                          onClick={() =>
                            updatePaymentStatus(
                              order.orderId,
                              "Paid"
                            )
                          }
                        >

                          {updatingPayment ===
                          order.orderId
                            ? "Updating..."
                            : "✓ Approve Payment"}

                        </button>


                        <button
                          className="reject-payment-button"
                          disabled={
                            updatingPayment ===
                            order.orderId
                          }
                          onClick={() =>
                            updatePaymentStatus(
                              order.orderId,
                              "Failed"
                            )
                          }
                        >

                          ✕ Reject Payment

                        </button>

                      </div>

                    )}

                  </div>

                </div>


                {/* =========================================
                    ORDER TOTAL
                ========================================= */}

                <div className="admin-order-footer">

                  <div>

                    <strong>
                      Payment
                    </strong>

                    <span>
                      {order.paymentMethod ||
                        "Not Selected"}
                    </span>

                  </div>


                  <div>

                    <strong>
                      Payment Status
                    </strong>

                    <span>
                      {order.paymentStatus ||
                        "Pending"}
                    </span>

                  </div>


                  <div>

                    <strong>
                      Total
                    </strong>

                    <span className="order-total">
                      ₹{order.total}
                    </span>

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      )}

    </div>
  );
}

export default AdminOrders;