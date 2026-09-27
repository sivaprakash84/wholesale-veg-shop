import { Link } from "react-router-dom";

function AdminDashboard() {
  return (
    <div className="admin-container">

      <div className="admin-header">
        <div>
          <p className="section-label">SHOP ADMIN</p>

          <h1>Admin Dashboard</h1>

          <p>
            Manage vegetables, stock and customer orders.
          </p>
        </div>
      </div>

      <div className="admin-cards">

        {/* PRODUCTS */}

        <Link
          to="/admin/products"
          className="admin-card"
        >
          <div className="admin-icon">
            🥬
          </div>

          <h2>
            Products
          </h2>

          <p>
            Add new vegetables, edit prices, update
            stock and manage availability.
          </p>

          <span>
            Manage Products →
          </span>
        </Link>


        {/* ORDERS */}

        <Link
          to="/admin/orders"
          className="admin-card"
        >
          <div className="admin-icon">
            📦
          </div>

          <h2>
            Orders
          </h2>

          <p>
            View customer orders, customer details
            and update order status.
          </p>

          <span>
            Manage Orders →
          </span>
        </Link>


        {/* PAYMENTS */}

        <Link
          to="/admin/payment-settings"
          className="admin-card"
        >
          <div className="admin-icon">
            💰
          </div>

          <h2>
            Payments
          </h2>

          <p>
            Manage the default payment QR code,
            UPI ID and payment details for customers.
          </p>

          <span>
            Manage Payments →
          </span>
        </Link>


        {/* REPORTS */}

        <Link
          to="/admin/reports"
          className="admin-card"
        >
          <div className="admin-icon">
            📊
          </div>

          <h2>
            Reports
          </h2>

          <p>
            View sales, orders, payments and
            inventory reports.
          </p>

          <span>
            View Reports →
          </span>
        </Link>


        
      </div>

    </div>
  );
}

export default AdminDashboard;