import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ProtectedRoute({ children, allowedRoles }) {

  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");

  // ❌ chưa login
  if (!token || !role) {
    return <Navigate to="/admin-login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // 🔥 check hết hạn token
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");

      return <Navigate to="/admin-login" replace />;
    }

    // ❌ sai role
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/admin-login" replace />; // 🔥 KHÔNG về "/"
    }

    return children;

  } catch (err) {
    // ❌ token lỗi
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");

    return <Navigate to="/admin-login" replace />;
  }
}

export default ProtectedRoute;