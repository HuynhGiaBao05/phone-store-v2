import { Link } from "react-router-dom";
import "./admin.css";

function AdminLayout({ children }) {
  return (
    <div className="admin-container">

      {/* Sidebar */}
      <div className="admin-sidebar">
        <h2>ADMIN</h2>

        <Link to="/admin-dashboard">Dashboard</Link>
        <Link to="/admin-users">Users</Link>
        <Link to="/admin-products">Products</Link>
        <Link to="/admin-categories">Categories</Link>
        <Link to="/admin-brands">Brands</Link>
        <Link to="/admin-orders">Orders</Link>
        <Link to="/admin-stores">Stores</Link>
        <Link to="/admin-reports">Reports</Link>
        <Link to="/admin-security-logs">Security Logs</Link>
        <Link to="/admin-activity-logs">Activity Logs</Link>
        <Link to="/admin-customers">Customers</Link>
      </div>

      {/* Content */}
      <div className="admin-content">
        {children}
      </div>

    </div>
  );
}

export default AdminLayout;