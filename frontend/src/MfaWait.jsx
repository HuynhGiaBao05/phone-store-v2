import { useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./MfaWait.css";
import { toast } from "react-toastify";


function MfaWait() {
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const email = query.get("email");

  useEffect(() => {
  if (!email) {
    navigate("/login", { replace: true });
    return;
  }

  const timeout = setTimeout(() => {
    alert("Hết thời gian xác nhận");
    navigate("/login");
  }, 5 * 60 * 1000);

  const interval = setInterval(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/check-login-approved/${email}`
      );

     if (res.data.approved) {
  clearInterval(interval);
  clearTimeout(timeout);

  toast.success("Xác thực thành công ✅"); // 🔥 ADD

  localStorage.setItem("adminToken", res.data.token);
  localStorage.setItem("adminRole", res.data.role);

  setTimeout(() => {
    if (res.data.role === "ADMIN") {
      navigate("/admin-dashboard", { replace: true });
    } else {
      navigate("/staff-products", { replace: true });
    }
  }, 1500); // delay để thấy toast

      }
    } catch (err) {}
  }, 5000);

  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
}, [email, navigate]);

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