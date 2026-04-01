import { useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./MfaWait.css";
import { toast } from "react-toastify";


function MfaWait() {
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const token = query.get("token");



  useEffect(() => {
  if (!token) {
    navigate("/admin-login", { replace: true });
        return;
  }

  const timeout = setTimeout(() => {
    toast.warning("Hết thời gian xác nhận ⏰");
    navigate("/admin-login");
  }, 5 * 60 * 1000);

  const interval = setInterval(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/check-login-approved-token/${token}`
      );

      // ✅ APPROVED
if (res.data.approved) {
  clearInterval(interval);
  clearTimeout(timeout);

  toast.success("Xác thực thành công ✅");

  localStorage.setItem("adminToken", res.data.token);
  localStorage.setItem("adminRole", res.data.role);

  setTimeout(() => {
    if (res.data.role === "ADMIN") {
      navigate("/admin-dashboard", { replace: true });
    } else {
      navigate("/staff-products", { replace: true });
    }
  }, 1500);

  return; // 🔥 BẮT BUỘC
}

// ⏰ EXPIRED
if (res.data.expired) {
  clearInterval(interval);
  clearTimeout(timeout);

  toast.warning("Link xác nhận đã hết hạn ⏰");
  navigate("/admin-login", { replace: true });
  return;
}

// ❌ DENIED
if (res.data.denied) {
  clearInterval(interval);
  clearTimeout(timeout);

  toast.error("Bạn đã từ chối đăng nhập ❌");
  navigate("/admin-login", { replace: true });
  return;
}
      }

     catch (err) {
  // 🔥 FIX 429 (Too Many Requests)
  if (err.response?.status === 429) {
    // đang chờ user xác nhận email → bỏ qua
    return;
  }

  console.error(err);
}
  }, 3000);

  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
}, [token, navigate]);

  

  

  return (
    <div className="mfa-container">
    <div className="mfa-card">
      <h2>🔐 Xác nhận đăng nhập</h2>

      <div className="spinner"></div>

      <p>Vui lòng kiểm tra email và bấm xác nhận</p>
      <p>Hệ thống sẽ tự động đăng nhập sau khi xác nhận</p>
    </div>
  </div>
  );
}

export default MfaWait;