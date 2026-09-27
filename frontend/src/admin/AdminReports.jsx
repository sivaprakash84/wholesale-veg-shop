import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminReports.css";

const ORDERS_API = "http://localhost:5000/api/orders";
const PRODUCTS_API = "http://localhost:5000/api/products";

const getAuthConfig = () => {
  const token = localStorage.getItem("adminToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

function AdminReports() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("30");

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersResponse, productsResponse] =
        await Promise.all([
          axios.get(
            ORDERS_API,
            getAuthConfig()
          ),
          axios.get(PRODUCTS_API),
        ]);

      setOrders(ordersResponse.data || []);

      const productData =
        productsResponse.data;

      setProducts(
        Array.isArray(productData)
          ? productData
          : productData.products || []
      );

    } catch (err) {
      console.error(
        "Report loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (period === "all") {
      return orders;
    }

    const days = Number(period);

    const cutoff =
      new Date().getTime() -
      days * 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      const orderDate = new Date(
        order.orderedAt
      ).getTime();

      return orderDate >= cutoff;
    });
  }, [orders, period]);

  const report = useMemo(() => {
    const validOrders =
      filteredOrders.filter(
        (order) =>
          order.orderStatus !== "Cancelled"
      );

    const cancelledOrders =
      filteredOrders.filter(
        (order) =>
          order.orderStatus === "Cancelled"
      );

    const paidOrders =
      validOrders.filter(
        (order) =>
          order.paymentStatus === "Paid"
      );

    const pendingPayments =
      validOrders.filter(
        (order) =>
          order.paymentStatus === "Pending"
      );

    const deliveredOrders =
      validOrders.filter(
        (order) =>
          order.orderStatus === "Delivered"
      );

    const totalSales =
      validOrders.reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    const paidRevenue =
      paidOrders.reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    const pendingAmount =
      pendingPayments.reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    const averageOrderValue =
      validOrders.length > 0
        ? totalSales / validOrders.length
        : 0;

    const productSales = {};

    validOrders.forEach((order) => {
      (order.items || []).forEach(
        (item) => {
          const name =
            item.name || "Unknown";

          if (!productSales[name]) {
            productSales[name] = {
              name,
              quantity: 0,
              revenue: 0,
            };
          }

          productSales[name].quantity +=
            Number(item.quantity || 0);

          productSales[name].revenue +=
            Number(item.total || 0);
        }
      );
    });

    const topProducts =
      Object.values(productSales)
        .sort(
          (a, b) =>
            b.quantity - a.quantity
        )
        .slice(0, 5);

    const lowStockProducts =
      products.filter(
        (product) =>
          Number(product.stock || 0) <= 20
      );

    const outOfStockProducts =
      products.filter(
        (product) =>
          Number(product.stock || 0) <= 0
      );

    return {
      totalOrders:
        filteredOrders.length,

      validOrders:
        validOrders.length,

      cancelledOrders:
        cancelledOrders.length,

      paidOrders:
        paidOrders.length,

      pendingPayments:
        pendingPayments.length,

      deliveredOrders:
        deliveredOrders.length,

      totalSales,

      paidRevenue,

      pendingAmount,

      averageOrderValue,

      topProducts,

      lowStockProducts,

      outOfStockProducts,
    };
  }, [filteredOrders, products]);

  const statusCounts = useMemo(() => {
    const counts = {
      Pending: 0,
      Confirmed: 0,
      Preparing: 0,
      "Out for Delivery": 0,
      Delivered: 0,
      Cancelled: 0,
    };

    filteredOrders.forEach((order) => {
      if (counts[order.orderStatus] !== undefined) {
        counts[order.orderStatus]++;
      }
    });

    return counts;
  }, [filteredOrders]);

  const paymentCounts = useMemo(() => {
    const counts = {
      Pending: 0,
      Paid: 0,
      Failed: 0,
    };

    filteredOrders.forEach((order) => {
      if (
        counts[order.paymentStatus] !==
        undefined
      ) {
        counts[order.paymentStatus]++;
      }
    });

    return counts;
  }, [filteredOrders]);

  if (loading) {
    return (
      <div className="report-page">
        <div className="report-loading">
          <div className="report-loading-icon">
            📊
          </div>

          <h2>
            Loading Reports...
          </h2>

          <p>
            Preparing your shop report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">

      {/* HEADER */}

      <div className="report-header">

        <div>
          <p className="report-label">
            SHOP ADMIN
          </p>

          <h1>
            Business Reports
          </h1>

          <p className="report-subtitle">
            Monitor sales, orders, payments
            and inventory performance.
          </p>
        </div>

        <div className="report-header-actions">

          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value)
            }
            className="report-period"
          >
            <option value="7">
              Last 7 Days
            </option>

            <option value="30">
              Last 30 Days
            </option>

            <option value="all">
              All Time
            </option>
          </select>

          <button
            className="report-refresh"
            onClick={loadReportData}
          >
            🔄 Refresh
          </button>

        </div>

      </div>

      {error && (
        <div className="report-error">
          ⚠️ {error}
        </div>
      )}

      {/* MAIN STATISTICS */}

      <div className="report-stat-grid">

        <div className="report-stat-card">
          <div className="report-stat-icon">
            📦
          </div>

          <div>
            <span>Total Orders</span>

            <strong>
              {report.totalOrders}
            </strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon">
            💰
          </div>

          <div>
            <span>Total Sales</span>

            <strong>
              ₹{report.totalSales.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon">
            💳
          </div>

          <div>
            <span>Paid Revenue</span>

            <strong>
              ₹{report.paidRevenue.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon">
            📈
          </div>

          <div>
            <span>Average Order</span>

            <strong>
              ₹{Math.round(
                report.averageOrderValue
              ).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

      </div>

      {/* SECONDARY STATISTICS */}

      <div className="report-mini-grid">

        <div className="report-mini-card">
          <span>⏳ Pending Payments</span>

          <strong>
            {report.pendingPayments}
          </strong>

          <small>
            ₹{report.pendingAmount.toLocaleString(
              "en-IN"
            )} pending
          </small>
        </div>

        <div className="report-mini-card">
          <span>🚚 Delivered Orders</span>

          <strong>
            {report.deliveredOrders}
          </strong>
        </div>

        <div className="report-mini-card">
          <span>❌ Cancelled Orders</span>

          <strong>
            {report.cancelledOrders}
          </strong>
        </div>

        <div className="report-mini-card">
          <span>🥬 Total Products</span>

          <strong>
            {products.length}
          </strong>
        </div>

      </div>

      {/* REPORT SECTIONS */}

      <div className="report-columns">

        {/* ORDER STATUS */}

        <div className="report-section">

          <div className="report-section-title">
            <div>
              <h2>
                📦 Order Status
              </h2>

              <p>
                Current order distribution
              </p>
            </div>
          </div>

          <div className="report-list">

            {Object.entries(statusCounts).map(
              ([status, count]) => (
                <div
                  className="report-list-row"
                  key={status}
                >
                  <span>
                    {status}
                  </span>

                  <strong>
                    {count}
                  </strong>
                </div>
              )
            )}

          </div>

        </div>

        {/* PAYMENT STATUS */}

        <div className="report-section">

          <div className="report-section-title">
            <div>
              <h2>
                💳 Payment Status
              </h2>

              <p>
                Payment collection overview
              </p>
            </div>
          </div>

          <div className="report-list">

            {Object.entries(paymentCounts).map(
              ([status, count]) => (
                <div
                  className="report-list-row"
                  key={status}
                >
                  <span>
                    {status}
                  </span>

                  <strong>
                    {count}
                  </strong>
                </div>
              )
            )}

          </div>

        </div>

      </div>

      {/* TOP SELLING PRODUCTS */}

      <div className="report-section">

        <div className="report-section-title">
          <div>
            <h2>
              🏆 Best-Selling Vegetables
            </h2>

            <p>
              Top vegetables by quantity sold
            </p>
          </div>
        </div>

        {report.topProducts.length === 0 ? (
          <div className="report-empty">
            No sales data available yet.
          </div>
        ) : (
          <div className="top-products">

            {report.topProducts.map(
              (product, index) => (
                <div
                  className="top-product-row"
                  key={product.name}
                >
                  <div className="product-rank">
                    #{index + 1}
                  </div>

                  <div className="product-info">
                    <strong>
                      {product.name}
                    </strong>

                    <span>
                      {product.quantity} units sold
                    </span>
                  </div>

                  <div className="product-revenue">
                    ₹{product.revenue.toLocaleString(
                      "en-IN"
                    )}
                  </div>
                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* INVENTORY REPORT */}

      <div className="report-columns">

        <div className="report-section">

          <div className="report-section-title">
            <div>
              <h2>
                ⚠️ Low Stock
              </h2>

              <p>
                Products with 20 or fewer units
              </p>
            </div>
          </div>

          {report.lowStockProducts.length ===
          0 ? (
            <div className="report-success">
              ✓ All products have healthy stock.
            </div>
          ) : (
            <div className="report-list">

              {report.lowStockProducts
                .slice(0, 8)
                .map((product) => (
                  <div
                    className="report-list-row"
                    key={product._id}
                  >
                    <span>
                      {product.name}
                    </span>

                    <strong>
                      {product.stock}
                    </strong>
                  </div>
                ))}

            </div>
          )}

        </div>

        <div className="report-section">

          <div className="report-section-title">
            <div>
              <h2>
                🚨 Out of Stock
              </h2>

              <p>
                Products currently unavailable
              </p>
            </div>
          </div>

          {report.outOfStockProducts.length ===
          0 ? (
            <div className="report-success">
              ✓ No products are out of stock.
            </div>
          ) : (
            <div className="report-list">

              {report.outOfStockProducts.map(
                (product) => (
                  <div
                    className="report-list-row"
                    key={product._id}
                  >
                    <span>
                      {product.name}
                    </span>

                    <strong>
                      0
                    </strong>
                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* SUMMARY */}

      <div className="report-summary">

        <div>
          <h2>
            📊 Business Summary
          </h2>

          <p>
            Report period:{" "}
            <strong>
              {period === "all"
                ? "All Time"
                : `Last ${period} Days`}
            </strong>
          </p>
        </div>

        <div className="report-summary-values">

          <div>
            <span>Orders</span>
            <strong>
              {report.validOrders}
            </strong>
          </div>

          <div>
            <span>Sales</span>
            <strong>
              ₹{report.totalSales.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <div>
            <span>Paid</span>
            <strong>
              ₹{report.paidRevenue.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminReports;