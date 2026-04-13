import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRef } from "react";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const lockIntervalRef = useRef(null);

  
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  if (status === "denied") {
    toast.error("Bạn đã từ chối đăng nhập");
    window.history.replaceState({}, document.title, "/admin-login");
  }
}, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading || isLocked) return;
    setLoading(true);
// ✅ CHECK EMAIL
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  toast.error("Email không hợp lệ");
  setLoading(false);
  return;
}

    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        { email, password }
      );

      // 🔥 MFA: nếu cần xác nhận email
if (res.data.requireApproval) {
  toast.info("Vui lòng xác nhận đăng nhập qua email");
  navigate(`/mfa-wait?token=${res.data.loginToken}`);
  return;
}

// ✅ CHỈ LƯU TOKEN KHI CÓ TOKEN
if (res.data.data?.token) {
const role = res.data.data?.user?.role?.toUpperCase();

if (role === "ADMIN") {
  localStorage.setItem("adminToken", res.data.data.token);
}

if (role === "STAFF") {
  localStorage.setItem("staffToken", res.data.data.token);
}
}

const role = res.data.data?.user?.role?.toUpperCase();
      // 🔀 Điều hướng theo role
      if (role === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (role === "STAFF") {
        navigate("/staff-products");
      } else {
         toast.error("Tài khoản USER không được phép đăng nhập admin");
      }

    } catch (error) {
      // ✅ FIX: xử lý MFA đang chờ duyệt
  if (error.response?.status === 429) {
    toast.info("Vui lòng xác nhận đăng nhập qua email");  
    setLoading(false);

    navigate(`/mfa-wait?token=${error.response?.data?.loginToken}`); // hoặc token nếu bạn có
    return;
  }
  const type = error.response?.data?.type;

  switch (type) {
    case "LOGIN_FAIL":
      toast.error("Sai email hoặc mật khẩu");
      break;

   case "ACCOUNT_LOCKED":
  setIsLocked(true);

  toast.dismiss();

  // clear interval cũ
  if (lockIntervalRef.current) {
    clearInterval(lockIntervalRef.current);
  }

  let time = error.response?.data?.remainingTime || 60;

  const id = toast.error(
    `🔒 Tài khoản bị khóa (${time}s). Vui lòng thử lại sau`,
    { autoClose: false }
  );

  lockIntervalRef.current = setInterval(() => {
    time--;

    toast.update(id, {
      render: `🔒 Tài khoản bị khóa (${time}s). Vui lòng thử lại sau`
    });

    if (time <= 0) {
      clearInterval(lockIntervalRef.current);
      lockIntervalRef.current = null;
      toast.dismiss();
      setIsLocked(false);
    }
  }, 1000);

  break;
    default:
      toast.error("Đăng nhập thất bại");
  }
} finally {
  setLoading(false);
}
};

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div style={{ position: "relative" }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer"
    }}
  >
    👁️
  </span>
</div>
<button type="submit" disabled={loading || isLocked}>
  {isLocked
    ? "Đang bị khóa..."
    : loading
    ? "Đang đăng nhập..."
    : "Đăng nhập"}
</button>

          <p style={{ marginTop: "15px" }}>
            <a href="/forgot-password">Quên mật khẩu?</a>
          </p>
        </form>
      </div>
      
    </div>
  );
}

export default AdminLogin;