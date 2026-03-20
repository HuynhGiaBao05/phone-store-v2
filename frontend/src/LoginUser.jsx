import { useState } from "react";
import axios from "axios";
import "./Auth.css";
import { useNavigate } from "react-router-dom";


function LoginUser() {

  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  // LOGIN
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");


  // REGISTER
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

//Fogot pass
const [forgotStep, setForgotStep] = useState(null);
// null | email | otp

const [forgotEmail, setForgotEmail] = useState("");
const [forgotOtp, setForgotOtp] = useState("");
const [newPassword, setNewPassword] = useState("");
const [step, setStep] = useState("register");
// register | otp

const [otp, setOtp] = useState("");
  // ================= LOGIN =================
  const handleLogin = async (e) => {
  e.preventDefault();

    console.log("LOGIN USER PAGE");
    //check fomat 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(loginEmail)) {
  alert("Email không hợp lệ");
  return;
}

    if (!loginEmail.trim() || !loginPassword) {
  alert("Vui lòng nhập email và mật khẩu");
  return;
}
  try {
    const res = await axios.post(
      "http://localhost:5000/api/users/login",
      {
        email: loginEmail.trim(),
        password: loginPassword
      }
    );

    const role = res.data.role?.toUpperCase();

if (role !== "USER") {
  alert("Tài khoản này không phải USER");
  return;
}

    localStorage.setItem("token", res.data.token);

    alert("Đăng nhập thành công!");

    navigate("/"); // chuyển về home

  } catch (error) {
  alert(error.response?.data?.message || "Đăng nhập thất bại");
}
};

  //=======Send OTP===========//
  const [loading, setLoading] = useState(false); // nhớ thêm trên đầu

const handleSendOtp = async (e) => {
  e.preventDefault();

  if (!forgotEmail.trim()) {
    alert("Vui lòng nhập email");
    return;
  }

  if (loading) return;
  setLoading(true);

  try {
    await axios.post(
      "http://localhost:5000/api/users/send-reset-otp",
      {
        email: forgotEmail.trim(),
      }
    );

    alert("OTP đã gửi về email!");
    setForgotStep("otp");

  } catch (error) {
    alert(
      error.response?.data?.message || "Email không tồn tại"
    );
  } finally {
    setLoading(false);
  }
};

//========Reset Pass=====//
const handleResetPassword = async (e) => {
  e.preventDefault();

  // ✅ validate đúng dữ liệu
  if (!forgotEmail.trim() || !forgotOtp.trim() || !newPassword) {
  alert("Vui lòng nhập đầy đủ thông tin");
  return;
}

 const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

if (!passwordRegex.test(newPassword)) {
  alert(
    "Mật khẩu phải >=8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
  );
  return;
}

  try {
    await axios.post("http://localhost:5000/api/users/reset-password", {
      email: forgotEmail.trim(),
      otp: forgotOtp,
      newPassword,
    });

    alert("Đổi mật khẩu thành công!");

    // reset state cho sạch
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setForgotStep(null);
    setLoginPassword("");
    setLoginEmail("");

  } catch {
    alert("OTP không đúng hoặc hết hạn");
  }
};

  // ================= REGISTER =================
  const handleRegister = async (e) => {
  e.preventDefault();

  // email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(registerEmail)) {
  alert("Email không hợp lệ");
  return;
}

// password strong
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

if (!passwordRegex.test(registerPassword)) {
  alert(
    "Mật khẩu phải >=8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
  );
  return;
}

  if (!name.trim() || !registerEmail.trim() || !registerPassword) {
  alert("Vui lòng nhập đầy đủ thông tin");
  return;
}
if (!confirmPassword) {
  alert("Vui lòng nhập lại mật khẩu");
  return;
}
  if (registerPassword !== confirmPassword) {
    alert("Mật khẩu không khớp");
    return;
  }

  try {

    const res = await axios.post(
      "http://localhost:5000/api/users/register",
      {
        fullName: name,
        email: registerEmail.trim(),
        password: registerPassword,
      }
    );

    alert(res.data.message);

    setStep("otp");   // 👈 chuyển sang nhập OTP

  } catch (error) {

    alert(error.response?.data?.message || "Đăng ký thất bại");

  }
};

//===========verify OTP=====//
const handleVerifyOtp = async (e) => {
  e.preventDefault();

  try {

    await axios.post(
      "http://localhost:5000/api/users/verify-otp",
      {
        email: registerEmail.trim(),
        otp: otp,
      }
    );

    alert("Xác thực thành công!");
    setOtp("");
    setRegisterEmail("");
    setRegisterPassword("");
    setConfirmPassword("");
    setIsActive(false);
    setStep("register");
    setName("");

  } catch {

    alert("OTP không đúng hoặc đã hết hạn");

  }
};

  return (
    <div className={`auth-container ${isActive ? "active" : ""}`}>

      {/* LOGIN */}
      <div className="form-container login-container">
        <form onSubmit={handleLogin}>

          <h2>Đăng Nhập</h2>

          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          <button type="submit">Đăng nhập</button>

          <p className="forgot-link">
            <span onClick={() => setForgotStep("email")}>
              Quên mật khẩu?
            </span>
          </p>

          <p className="switch-text">
            Tôi chưa có tài khoản?{" "}
            <span onClick={() => setIsActive(true)}>
              Đăng ký
            </span>
          </p>
          
        </form>
        
      </div>


      {/* REGISTER */}
      <div className="form-container register-container">

{step === "register" && (

<form onSubmit={handleRegister}>

<h2>Đăng Ký</h2>

<input
type="text"
placeholder="Tên"
value={name}
onChange={(e) => setName(e.target.value)}
/>

<input
type="email"
placeholder="Email"
value={registerEmail}
onChange={(e) => setRegisterEmail(e.target.value)}
/>

<input
type="password"
placeholder="Mật khẩu"
value={registerPassword}
onChange={(e) => setRegisterPassword(e.target.value)}
/>

<input
type="password"
placeholder="Nhập lại mật khẩu"
value={confirmPassword}
onChange={(e) => setConfirmPassword(e.target.value)}
/>

<button type="submit">Đăng ký</button>

</form>

)}

{step === "otp" && (

<form onSubmit={handleVerifyOtp}>

<h2>Xác thực OTP</h2>

<input
type="text"
placeholder="Nhập OTP"
value={otp}
onChange={(e) => setOtp(e.target.value)}
/>

<button type="submit">Xác nhận OTP</button>

</form>

)}

</div>
      {/* Forgot Password Modal */}
{forgotStep && (
  <div className="forgot-modal">

    {forgotStep === "email" && (
      <form onSubmit={handleSendOtp}>
        <h2>Quên mật khẩu</h2>

        <input
          type="email"
          placeholder="Nhập email"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
        />

        <button type="submit">Gửi OTP</button>

        <p className="switch-text">
          <span onClick={() => setForgotStep(null)}>
            Quay lại đăng nhập
          </span>
        </p>
      </form>
    )}

    {forgotStep === "otp" && (
      <form onSubmit={handleResetPassword}>
        <h2>Đặt lại mật khẩu</h2>

        <input
          type="text"
          placeholder="Nhập OTP"
          value={forgotOtp}
          onChange={(e) => setForgotOtp(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button type="submit">Đổi mật khẩu</button>

        
      </form>
      
    )}

  </div>
)}

      {/* OVERLAY */}
      <div className="overlay-container">

        <div className="overlay">

          {/* LEFT */}
          <div className="overlay-panel overlay-left">

            <h1>Chào mừng trở lại!</h1>

            <p>Nếu đã có tài khoản hãy đăng nhập</p>

            <button onClick={() => setIsActive(false)}>
              Đăng nhập
            </button>

          </div>

          {/* RIGHT */}
          <div className="overlay-panel overlay-right">

            <h1>Welcome to BaoPhone</h1>

            <p>Tạo tài khoản để bắt đầu</p>

            <button onClick={() => setIsActive(true)}>
              Đăng ký
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default LoginUser;