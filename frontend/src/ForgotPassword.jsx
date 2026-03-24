import { useState, useEffect } from "react";
import axios from "axios";
import "./ForgotPassword.css";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [timer, setTimer] = useState(0);
const navigate = useNavigate();

  // ===============================
  // COUNTDOWN EFFECT
  // ===============================
  useEffect(() => {
    let interval;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  // ===============================
  // SEND OTP
  // ===============================
  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setSuccess(false);

      const res = await axios.post(
        "http://localhost:5000/api/users/send-reset-otp",
        { email }
      );

      setMessage(res.data.message);
      setSuccess(true);
      setStep(2);
      setTimer(60); // bắt đầu đếm ngược 60s

    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // RESEND OTP
  // ===============================
  const handleResendOtp = async () => {
    if (timer > 0) return;

    try {
      setLoading(true);
      setSuccess(false);

      const res = await axios.post(
        "http://localhost:5000/api/users/send-reset-otp",
        { email }
      );

      setMessage("OTP đã được gửi lại");
      setSuccess(true);
      setTimer(60);

    } catch (err) {
      setMessage("Không thể gửi lại OTP");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // RESET PASSWORD
  // ===============================
  const handleResetPassword = async () => {
  try {
    setLoading(true);
    setSuccess(false);

    const res = await axios.post(
      "http://localhost:5000/api/users/reset-password",
      { email, otp, newPassword }
    );

    setMessage("Đổi mật khẩu thành công! Đang chuyển về đăng nhập...");
    setSuccess(true);

    // ⏳ Sau 2.5 giây tự chuyển về login
    setTimeout(() => {
      navigate("/admin-login");
    }, 2500);

  } catch (err) {
    setMessage(err.response?.data?.message || "Reset failed");
    setSuccess(false);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="forgot-container">
      <div className={`forgot-card ${step === 2 ? "slide" : ""}`}>

        <h2>Quên mật khẩu</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button onClick={handleSendOtp} disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Nhập OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>

            {/* Countdown + Resend */}
            <div className="resend-area">
              {timer > 0 ? (
                <p>Gửi lại OTP sau {timer}s</p>
              ) : (
                <button
                  className="resend-btn"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Gửi lại OTP
                </button>
              )}
            </div>
          </>
        )}

        {message && (
          <p className={`message ${success ? "success" : "error"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;