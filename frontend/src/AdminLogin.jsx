import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
// ✅ CHECK EMAIL
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  alert("Email không hợp lệ");
  setLoading(false);
  return;
}
// ✅ CHECK PASSWORD
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

if (!passwordRegex.test(password)) {
  alert(
    "Mật khẩu phải >=8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
  );
  setLoading(false);
  return;
}

    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        { email, password }
      );

      const role = res.data.role?.toUpperCase();

      // 🔐 Lưu token
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminRole", res.data.role);

      // 🔀 Điều hướng theo role
      if (role === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (role === "STAFF") {
        navigate("/staff-products");
      } else {
        alert("Tài khoản USER không được phép đăng nhập admin");
      }

    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Login"}
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