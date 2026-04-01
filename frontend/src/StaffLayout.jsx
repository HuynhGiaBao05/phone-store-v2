import { Link, useLocation } from "react-router-dom";
import "./Staff.css";

function StaffLayout({ children }) {

  const location = useLocation();

  return (
    <div className="staff-wrapper">
      <aside className="staff-sidebar">

        <h2 className="logo">STAFF PANEL</h2>

        <Link
          to="/staff-products"
          className={location.pathname.includes("products") ? "active" : ""}
        >
          📦 Sản phẩm
        </Link>

        <Link
          to="/staff-orders"
          className={location.pathname.includes("orders") ? "active" : ""}
        >
          🧾 Đơn hàng
        </Link>
        <Link
          to="/staff-customers"
          className={location.pathname.includes("customers") ? "active" : ""}
        >
          👥 Khách hàng
        </Link>

      </aside>

      <main className="staff-content">
        {children}
      </main>

    </div>
  );
}

export default StaffLayout;