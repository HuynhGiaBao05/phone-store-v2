import { useState } from "react";
import axios from "axios";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function LoginUser() {
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  // LOGIN
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [emailError, setEmailError] = useState("");
const [passwordError, setPasswordError] = useState("");
const [showLoginPassword, setShowLoginPassword] = useState(false);

//verify OTP
const [verifyLoading, setVerifyLoading] = useState(false);
  // REGISTER
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//Fogot pass
const [forgotStep, setForgotStep] = useState(null);
const [showNewPassword, setShowNewPassword] = useState(false);

// null | email | otp
const [loginLoading, setLoginLoading] = useState(false);
const [otpLoading, setOtpLoading] = useState(false);
const [resetLoading, setResetLoading] = useState(false);//check format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

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
    const cleanEmail = loginEmail.trim();
     const cleanPassword = loginPassword.trim();


if (loginLoading) return;

setEmailError("");
setPasswordError("");

if (!cleanEmail) {
  setEmailError("Vui lòng nhập email");
  return;
}

if (!emailRegex.test(cleanEmail)) {
  setEmailError("Email không hợp lệ");
  return;
}

if (!cleanPassword) {
  setPasswordError("Vui lòng nhập mật khẩu");
  return;
}
setLoginLoading(true);



   
  try {
    const res = await axios.post(
      "http://localhost:5000/api/users/login",
      {
        email: cleanEmail,
        password: cleanPassword
      }
      
    );

    const role = res.data.role?.toUpperCase();


if (role !== "USER") {
  toast.error("Tài khoản này không phải USER");
  return;
}
if (!res.data.token) {
  toast.error("Token không hợp lệ");
  return;
}
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", role);
    toast.success("Đăng nhập thành công!");
    toast.info("Đã gửi email cảnh báo đăng nhập");
    navigate("/"); // chuyển về home
setLoginEmail("");
setLoginPassword("");
}catch (error) {
  toast.error(error.response?.data?.message || "Đăng nhập thất bại");
}
 finally {
  setLoginLoading(false);
}
};

  //=======Send OTP===========//

const handleSendOtp = async (e) => {
  e.preventDefault();
const cleanEmail = forgotEmail.trim();


if (!cleanEmail) {
  toast.error("Vui lòng nhập email");
  return;
}

if (!emailRegex.test(cleanEmail)) {
toast.error("Email không hợp lệ");
return;
}

  if (otpLoading) return;
setOtpLoading(true);

  try {
    await axios.post(
      "http://localhost:5000/api/users/send-reset-otp",
      {
        email: cleanEmail,
      }
    );

    toast.success("OTP đã gửi về email!");
    setForgotStep("otp");

  } catch (error) {
    toast.error(error.response?.data?.message || "Email không tồn tại");
  } finally {
      setOtpLoading(false);

  }
  
};


//========Reset Pass=====//
const handleResetPassword = async (e) => {
  e.preventDefault();
  setResetLoading(true);
  const cleanEmail = forgotEmail.trim();
  const cleanOtp = forgotOtp.trim(); 
const cleanPassword = newPassword.trim();

if (!emailRegex.test(cleanEmail)) {
  toast.error("Email không hợp lệ");
 setResetLoading(false);
  return;

}
  // ✅ validate đúng dữ liệu
if (!cleanEmail || !cleanOtp || !cleanPassword) {
  toast.error ("Vui lòng nhập đầy đủ thông tin");
  setResetLoading(false);
  return;
}
 if (!/^\d{6}$/.test(cleanOtp)) {
    toast.error ("OTP phải là 6 chữ số");
      setResetLoading(false);
    return;
  }

if (!passwordRegex.test(cleanPassword)) {
  toast.error(
    "Mật khẩu phải >=8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
  );
  setResetLoading(false);
  return;
}

  try {
    await axios.post("http://localhost:5000/api/users/reset-password", {
      email: cleanEmail,
      otp: cleanOtp,
      newPassword: cleanPassword,
    });

    toast.success("Đổi mật khẩu thành công!");

    // reset state cho sạch
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setForgotStep(null);
    setLoginPassword("");
    setLoginEmail("");

  } catch {
    toast.error("OTP không đúng hoặc hết hạn");
  }
  finally {
  setResetLoading(false);
}
};

  // ================= REGISTER =================
  const handleRegister = async (e) => {
  e.preventDefault();
  setRegisterLoading(true);


    if (!name.trim() || !registerEmail.trim() || !registerPassword) {
  toast.error("Vui lòng nhập đầy đủ thông tin");
    setRegisterLoading(false);
  return;
}
const cleanEmail = registerEmail.trim();
const cleanPassword = registerPassword.trim();

  // email format
if (!emailRegex.test(cleanEmail)) {
toast.error("Email không hợp lệ");
setRegisterLoading(false);
  return;
}

// password strong




if (!passwordRegex.test(cleanPassword)) {
  toast.error(
    "Mật khẩu phải >=8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
  );
  setRegisterLoading(false);
  return;
}

  
if (!confirmPassword) {
 toast.error("Vui lòng nhập lại mật khẩu");
 setRegisterLoading(false);
  return;
}
  if (cleanPassword !== confirmPassword) {
    toast.error ("Mật khẩu không khớp");
    setRegisterLoading(false);
    return;
  }
  try {

    const res = await axios.post(
      "http://localhost:5000/api/users/register",
      {
        fullName: name,
        email: cleanEmail,
        password: cleanPassword 
      }
    );

    toast.success(res.data.message);
    setRegisterPassword("");
    setName("");
    setConfirmPassword("");
    setOtp("");

    setStep("otp");   // 👈 chuyển sang nhập OTP

  } catch (error) {

    toast.error(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
  setRegisterLoading(false); // 👈 THÊM

  }
};

//===========verify OTP=====//
const handleVerifyOtp = async (e) => {
  e.preventDefault();
  setVerifyLoading(true);

  if (!/^\d{6}$/.test(otp)) {
  toast.error("OTP phải là 6 chữ số");
  setVerifyLoading(false);
  return;
}
const cleanEmail = registerEmail.trim();

if (!cleanEmail) {
  toast.error("Email không tồn tại");
  setVerifyLoading(false);
  return;
}
  try {

    await axios.post(
      "http://localhost:5000/api/users/verify-otp",
      {
        email: cleanEmail,
        otp: otp,
      }
      
      
    );
    

    toast.success("Xác thực thành công!");
    setOtp("");
    setRegisterPassword("");
    setConfirmPassword("");
    setIsActive(false);
    setStep("register");
    setName("");

  }
  
  
  catch {

   toast.error("OTP không đúng hoặc đã hết hạn");

  } finally {
  setVerifyLoading(false);
  }
  
};

  return (
    <div className={`auth-container ${isActive ? "active" : ""}`}>
<ToastContainer />
      {/* LOGIN */}
      <div className="form-container login-container">
        <form onSubmit={handleLogin}>

          <h2>Đăng Nhập</h2>

          <input
  type="email"
  placeholder="Email"
  value={loginEmail}
  onChange={(e) => {
    setLoginEmail(e.target.value);
    setEmailError("");
  }}
/>
{emailError && <p className="error">{emailError}</p>}

<div style={{ position: "relative", width: "100%" }}>
  <input
    type={showLoginPassword ? "text" : "password"}
    placeholder="Mật khẩu"
    value={loginPassword}
    onChange={(e) => {
      setLoginPassword(e.target.value);
      setPasswordError("");
    }}
    style={{ width: "100%" }}
  />

  <span
    onClick={() => setShowLoginPassword(!showLoginPassword)}
    style={{
      position: "absolute",
      right: "15px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: "18px"
    }}
  >
    {showLoginPassword ? "🙈" : "👁️"}
  </span>
</div>
  
{passwordError && <p className="error">{passwordError}</p>}

          <button
  type="submit"
disabled={loginLoading || !!emailError || !!passwordError}>
            {loginLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>

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

<div style={{ position: "relative" }}>
  <input
    type={showRegisterPassword ? "text" : "password"}
    placeholder="Mật khẩu"
    value={registerPassword}
    onChange={(e) => setRegisterPassword(e.target.value)}
  />

  <span
    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
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


<div style={{ position: "relative" }}>
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Nhập lại mật khẩu"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
  />
  <span
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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


<button type="submit" disabled={registerLoading}>
  {registerLoading ? "Đang xử lý..." : "Đăng ký"}
</button>

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

<button type="submit" disabled={verifyLoading}>
  {verifyLoading ? "Đang xác thực..." : "Xác nhận OTP"}
</button>
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

        <button type="submit" disabled={otpLoading}>
            {otpLoading ? "Đang gửi..." : "Gửi OTP"}
        </button>

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

        <div style={{ position: "relative" }}>
  <input
    type={showNewPassword ? "text" : "password"}
    placeholder="Mật khẩu mới"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
  />
  <span
    onClick={() => setShowNewPassword(!showNewPassword)}
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
         

        <button type="submit" disabled={resetLoading}>
          {resetLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>

        
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