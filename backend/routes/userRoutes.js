const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");
const sendEmail = require("../utils/sendEmail");
const xss = require("xss"); // 🛡️ XSS: sanitize input
const ActivityLog = require("../models/ActivityLog");

const crypto = require("crypto");
// CREATE USER
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ⭐ PASSWORD VALIDATION
const validatePassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
};
// 🛡️ EMAIL VALIDATION
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

router.post(
  "/create",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {  try {
    let { fullName, email, password, role } = req.body;

// 🛡️ SQL INJECTION: ép kiểu
fullName = String(fullName);
email = String(email);
password = String(password);
role = role ? String(role).toUpperCase() : "USER";

// 🛡️ ROLE VALIDATION
const allowedRoles = ["USER", "ADMIN","STAFF"];
if (!allowedRoles.includes(role)) {
  return res.status(400).json({ message: "Invalid role" });
}

// 🛡️ XSS: sanitize input
fullName = xss(fullName);
email = xss(email);

// 🛡️ check email format
if (!fullName) {
  return res.status(400).json({ message: "Full name is required" });
}

if (!email) {
  return res.status(400).json({ message: "Email is required" });
}

if (!validateEmail(email)) {
  return res.status(400).json({
    success: false,
    error: "Email không hợp lệ"
  });
}
      const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
  return res.status(400).json({ message: "Email already exists" });
}

    if (!password || !validatePassword(password)) {
  return res.status(400).json({
    message: "Mật khẩu phải >=8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
  });
}

const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email: cleanEmail,
      password: hashedPassword,
      role: role || "USER",
      isVerified: true,
      isActive: true
    });
await user.save();

    res.json({
  success: true,
  total: 1,
  data: {
    id: user._id,
    email: user.email,
    role: user.role
  }
});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

   

    // 🛡️ USE XSS: sanitize input
    email = xss(String(email));
    // 🛡️ USE SQL INJECTION: ép kiểu tránh object injection
password = String(password);
    // 🛡️ CHECK EMAIL FORMAT
if (!email || !password) {
  return res.status(400).json({ message: "Missing credentials" });
}

if (!validateEmail(email)) {
  return res.status(400).json({
    success: false,
    error: "Email không hợp lệ"
  });
}
if (typeof email !== "string" || typeof password !== "string") {
  return res.status(400).json({ message: "Invalid input type" });
}
    const cleanEmail = email.trim().toLowerCase();
const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user) {
  return res.status(400).json({
    success: false,
    type: "LOGIN_FAIL"
  });
}

    // 🛡️ USE ACCOUNT STATUS
    if (!user.isActive) {
      return res.status(403).json({
  success: false,
  type: "ACCOUNT_LOCKED"
});
    }

    // 🛡️ USE VERIFY CHECK
    if (user.role === "USER" && !user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify account" });
    }

    // 🛡️ USE BRUTE FORCE PROTECTION
    if (user.lockUntil && user.lockUntil > Date.now()) {
  const remaining = Math.ceil((user.lockUntil - Date.now()) / 1000);

  return res.status(403).json({
    success: false,
    total: 0,
    type: "ACCOUNT_LOCKED",
    remainingTime: remaining
  });
}

// 🛡️ LẤY IP + DEVICE
const ip =
  (req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() || req.socket.remoteAddress;

const agent = req.headers["user-agent"];

    const isMatch = await bcrypt.compare(password, user.password);

    // ❌ WRONG PASSWORD
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
  user.lockUntil = Date.now() + 60 * 1000;
  user.loginAttempts = 0;

  await user.save();
  return res.status(403).json({
    success: false,
    type: "ACCOUNT_LOCKED",
    remainingTime: 60
  });
}
await user.save();
      await SecurityLog.create({
  user: user._id,
  action: "LOGIN_FAIL",
  ip,
  userAgent: req.headers["user-agent"],
  status: "FAIL",
  description: "Sai mật khẩu",
});
      return res.status(400).json({
  success: false,
  type: "LOGIN_FAIL"
});
    }

    // ✅ LOGIN SUCCESS
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // ================= FIX MFA + ALERT =================

const role = user.role?.toUpperCase();

// ================= SAVE LOGIN HISTORY =================
if (!user.loginHistory) {
  user.loginHistory = [];
}

user.loginHistory.push({
  ip,
  userAgent: agent
});

// chỉ giữ 5 login gần nhất (FIX DB phình)
if (user.loginHistory.length > 5) {
  user.loginHistory.shift();
}

// ================= USER → CHỈ CẢNH BÁO =================
if (role === "USER") {
  const alertToken = crypto.randomBytes(32).toString("hex");

  user.loginToken = alertToken; // FIX ALERT
  user.loginTokenExpire = Date.now() + 10 * 60 * 1000;

  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const denyLink = `${BASE_URL}/api/users/deny-login/${alertToken}`;

  // 📧 EMAIL CẢNH BÁO
    await user.save();

  sendEmail(user.email,
    "Cảnh báo đăng nhập",
    `
      <h3>🔐 Cảnh báo đăng nhập</h3>

      <p>Có đăng nhập mới:</p>

      <ul>
        <li><b>IP:</b> ${ip}</li>
        <li><b>Thiết bị:</b> ${agent}</li>
      </ul>

      <p>Nếu là bạn → bỏ qua email này.</p>

      <a href="${denyLink}"
         style="padding:10px 20px;background:red;color:white;">
         ❌ Không phải tôi
      </a>
    `
  ).catch(err => console.error("SendEmail Error:", err));

  // 👉 LOGIN LUÔN
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  //secure cookie (nếu có dùng cookie)để  sau này dùng refresh token:
  res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict"
});

// ✅ SECURITY LOG
await SecurityLog.create({
  user: user._id,
  action: "LOGIN_SUCCESS",
  ip,
  userAgent: agent, 
  status: "SUCCESS",
});

  return res.json({
  success: true,
  total: 1,
  data: {
    token,
    user: {
      id: user._id,
      role: user.role
    }
  }
});
}
// ================= ADMIN / STAFF → MFA CHẶN LOGIN =================
if (role === "ADMIN" || role === "STAFF") {

  // 🔥 nếu token còn hạn → chặn spam
  if (
  user.loginStatus === "PENDING" &&
  user.loginTokenExpire > Date.now()
) {
    return res.status(429).json({
  requireApproval: true,
  loginToken: user.loginToken
});
  }

  // 🔥 nếu token hết hạn → reset
  if (user.loginTokenExpire && user.loginTokenExpire <= Date.now()) {
    user.loginTokenExpire = null;
    user.isLoginApproved = false;
    user.loginStatus = null;
  }

  const loginToken = crypto.randomBytes(32).toString("hex");

  user.loginToken = loginToken;
  user.loginTokenExpire = Date.now() + 2 * 60 * 1000;
  user.isLoginApproved = false;

  user.loginStatus = "PENDING";

  await user.save();

  // ✅ SECURITY LOG
await SecurityLog.create({
  user: user._id,
  action: "LOGIN_PENDING",
  ip,
  userAgent: agent,
  status: "PENDING",
});

  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const confirmLink = `${BASE_URL}/api/users/approve-login/${loginToken}`;
const denyLink = `${BASE_URL}/api/users/deny-login/${loginToken}`;

  sendEmail(
  user.email,
  "Xác nhận đăng nhập",
  `
  <div style="font-family:Arial,sans-serif;text-align:center;padding:20px">
   
    <h2>🔐 Xác nhận đăng nhập</h2>
    <p>Bạn vừa đăng nhập vào hệ thống</p>

    <div style="background:#f6f6f6;padding:15px;border-radius:8px;margin:20px auto;display:inline-block;text-align:left">
      <p><b>Tên thiết bị:</b> ${agent}</p>
      <p><b>Địa chỉ IP:</b> ${ip}</p>
      <p><b>Thời gian:</b> ${new Date().toLocaleString("vi-VN")}</p>
    </div>

    <div style="margin-top:20px">
      <a href="${confirmLink}"
         style="background:#28a745;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:10px;display:inline-block">
        ✅ Đây là tôi
      </a>

      <a href="${denyLink}"
         style="background:#dc3545;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
        ❌ Không phải là tôi
      </a>
    </div>

  </div>
  `
).catch(err => console.error("Admin Login Email Error:", err));

  return res.json({
    requireApproval: true,
    loginToken,
    message: "Vui lòng xác nhận email"
  });
}
return res.status(400).json({
  success: false,
  type: "LOGIN_FAILED"
});

} catch (error) {   // ✅ giờ catch hợp lệ
  console.error("LOGIN ERROR:", error);
  res.status(500).json({ message: error.message });
}
});

   

// ===============================
// SEND RESET PASSWORD OTP
// ===============================
router.post("/send-reset-otp", async (req, res) => {
  try {
    let { email } = req.body;

  // 🛡️ SQL INJECTION
email = String(email);

// 🛡️ XSS: sanitize input
email = xss(email);

// 🛡️ CHECK EMAIL FORMAT
if (!email) {
  return res.status(400).json({ message: "Email is required" });
}
if (!validateEmail(email)) {
  return res.status(400).json({
    success: false,
    error: "Email không hợp lệ"
  });
}
// ✅ FIX: chống spam gửi OTP liên tục
const cleanEmail = email.trim().toLowerCase();
const user = await User.findOne({ email: cleanEmail });

if (!user) {
  return res.status(400).json({ message: "Email not found" });
}

// ⏱️ chặn spam 60s
if (user.otpCooldown && user.otpCooldown > Date.now()) {
  return res.status(429).json({
    message: "Vui lòng đợi 60s để gửi lại OTP"
  });
}

   

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;
    user.otpCooldown = Date.now() + 60 * 1000;
    user.otpExpire = Date.now() + 60 * 1000;

    await user.save();

    sendEmail(cleanEmail,
      "Reset Password OTP",
      `Your password reset OTP is: ${otp}`
    ).catch(err => console.error("OTP Email Error:", err));

   res.json({
  success: true,
  total: 1,
  type: "OTP_SENT"
});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// RESET PASSWORD WITH OTP
// ===============================
router.post("/reset-password", async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

// 🛡️ SQL INJECTION
email = String(email);
otp = String(otp);
newPassword = xss(String(newPassword));

//🛡️ XSS: sanitize input
email = xss(String(email));

// 🛡️  CHECK EMAIL FORMAT
if (!email) {
  return res.status(400).json({ message: "Email is required" });
}

if (!validateEmail(email)) {
  return res.status(400).json({
    success: false,
    error: "Email không hợp lệ"
  });
}
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
if (!newPassword || !validatePassword(newPassword)) {
  return res.status(400).json({ message: "Mật khẩu yếu" });
}
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.loginAttempts = 0;
user.lockUntil = undefined;
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.json({
  success: true,
  type: "PASSWORD_RESET"
});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= CHECK LOGIN APPROVED =================
router.get("/check-login-approved/:email", async (req, res) => {
  try {
    let email = String(req.params.email);
    email = xss(email);

    if (!validateEmail(email)) {
      return res.json({ approved: false });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ✅ THÊM DÒNG NÀY (QUAN TRỌNG NHẤT)
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
  return res.json({ approved: false });
}

    // ✅ APPROVED
if (user.loginStatus === "APPROVED") {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict"
});

  user.loginStatus = null;
  user.loginToken = null; // 🔥 QUAN TRỌNG
  user.loginTokenExpire = null;
  await user.save();

  return res.json({
    approved: true,
    token,
    role: user.role
  });
}

// ❌ DENIED
if (user.loginStatus === "DENIED") {
  user.loginStatus = null;        // 🔥 reset
  user.loginToken = null;         // 🔥 chắc cú
  user.loginTokenExpire = null;   // 🔥 đồng bộ
  await user.save();

  return res.json({ denied: true });
}

    // ⏳ CHƯA XÁC NHẬN
    return res.json({ approved: false });

  } catch (err) {
    return res.status(500).json({ approved: false });
  }
});

// PROFILE
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

// ===============================
// REGISTER - GỬI OTP
// ===============================
router.post("/register", async (req, res) => {
  try {
        let { fullName, email, password } = req.body;

// 🛡️ SQL INJECTION: ép kiểu để tránh object injection
fullName = String(fullName);
email = String(email);
password = String(password);
// 🛡️ XSS: sanitize input
fullName = xss(fullName);
email = xss(email);      

// 🛡️ CHECK EMAIL FORMAT
if (!fullName) {
  return res.status(400).json({ message: "Full name is required" });
}

if (!email) {
  return res.status(400).json({ message: "Email is required" });
}

if (!validateEmail(email)) {
  return res.status(400).json({
    success: false,
    error: "Email không hợp lệ"
  });
}
    const cleanEmail = email.trim().toLowerCase();

const existingUser = await User.findOne({ email: cleanEmail });

if (existingUser) {
  return res.status(400).json({ message: "Email already exists" });
}

   if (!password || !validatePassword(password)) {
  return res.status(400).json({
    message: "Mật khẩu phải >=8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
  });
}

const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
     fullName,
  email: cleanEmail,
  password: hashedPassword,
  otpCode: otp,
  otpExpire: Date.now() + 5 * 60 * 1000,
  isVerified: false
    });

    await user.save();

    // ✅ BẬT LẠI GỬI EMAIL
    sendEmail(cleanEmail, "OTP Verification", `Your OTP code is: ${otp}`).catch(err => console.error("Register Email Error:", err));

    res.json({
  success: true,
  type: "REGISTER_OTP_SENT"
});

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// VERIFY OTP - KÍCH HOẠT TÀI KHOẢN
// ===============================
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    // 🛡️ SQL INJECTION
    email = String(email);
    otp = String(otp);
    //XSS: sanitize input
    email = xss(String(email));
    // 🛡️  CHECK EMAIL FORMAT
if (!email) {
  return res.status(400).json({ message: "Email is required" });
}

if (!validateEmail(email)) {
  return res.status(400).json({
    success: false,
    error: "Email không hợp lệ"
  });
}
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

   

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.json({
  success: true,
  type: "ACCOUNT_VERIFIED"
});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ================= LOGOUT =================
router.post("/logout", protect, async (req, res) => {
  try {

    await SecurityLog.create({
      user: req.user._id,
      action: "LOGOUT",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });
    res.clearCookie("token");
    res.json({
  success: true,
  type: "LOGOUT"
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ===============================
// RESEND OTP
// ===============================
router.post("/resend-otp", async (req, res) => {
  try {
    let { email } = req.body;

  // 🛡️ SQL INJECTION
email = String(email);

// 🛡️ XSS: sanitize input
email = xss(String(email));

// 🛡️ CHECK EMAIL FORMAT
if (!email) {
  return res.status(400).json({ message: "Email is required" });
}

if (!validateEmail(email)) {
  return res.status(400).json({
    success: false,
    error: "Email không hợp lệ"
  });
}

const cleanEmail = email.trim().toLowerCase();
const user = await User.findOne({ email: cleanEmail });

if (!user) {
  return res.status(400).json({ message: "User not found" });
}

if (user.otpExpire && user.otpExpire > Date.now()) {
  return res.status(429).json({ message: "OTP vừa gửi, thử lại sau" });
}

   

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Tạo OTP mới
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = newOtp;
    user.otpExpire = Date.now() + 60 * 1000;

    await user.save();

    sendEmail(
  cleanEmail,
  "Resend OTP Verification",
  `Your new OTP code is: ${newOtp}`
).catch(err => console.error("Resend OTP Error:", err));

    res.json({ message: "New OTP sent to your email" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// ADMIN - LẤY DANH SÁCH USER
// ===============================
router.get(
  "/all",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json({
  success: true,
  total: users.length,
  data: users
});
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ===============================
// ADMIN - KHÓA / MỞ KHÓA USER
// ===============================
router.put(
  "/toggle-active/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.json({ message: "User status updated" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ===============================
// ADMIN - CẬP NHẬT ROLE
// ===============================
router.put(
  "/update-role/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
     

let { role } = req.body;
role = String(role).toUpperCase();

const allowedRoles = ["USER", "ADMIN","STAFF"];
if (!allowedRoles.includes(role)) {
  return res.status(400).json({ message: "Invalid role" });
}

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = role;
      await user.save();

      res.json({ message: "Role updated successfully" });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ===============================
// ADMIN - XÓA USER
// Chỉ ADMIN mới được xóa tài khoản
// ===============================
router.delete(
  "/delete/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      // Tìm user theo ID
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Thực hiện xóa
      await user.deleteOne();

      res.json({
  success: true,
  total: 1,
  type: "USER_DELETED"
});

    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

  // ================= FIX MFA APPROVE =================
// APPROVE LOGIN
router.get("/approve-login/:token", async (req, res) => {
  try {
    const user = await User.findOne({ loginToken: req.params.token });

    if (!user || user.loginTokenExpire < Date.now()) {
      return res.send(`
        <script>
          window.close();
        </script>
      `);
     
    }
   

    user.isLoginApproved = true;
user.loginStatus = "APPROVED";

    // ✅ SECURITY LOG: LOGIN SUCCESS
await SecurityLog.create({
  user: user._id,
  action: "LOGIN_SUCCESS",
  ip: req.ip,
});

    await user.save();

   res.send(`
  <h2>✅ Xác thực thành công</h2>
  <p>Bạn có thể đóng tab này</p>
 
`);

  } catch (err) {
    res.send(`  
      <script>
        window.close();
      </script>
    `);
  }
});

// DENY LOGIN
router.get("/deny-login/:token", async (req, res) => {
  try {
    const user = await User.findOne({ loginToken: req.params.token });

    if (user) {
      user.isLoginApproved = false;

        user.loginStatus = "DENIED";
        user.loginTokenExpire = null;  
        user.loginToken = null;

      if (user.role === "USER") {
        user.isActive = false;
      }

      await user.save();
    }

    res.send(`
  <h3>Đã từ chối đăng nhập</h3>
  <script>
    window.close();
  </script>
`);
  } catch {
    res.send("Có lỗi xảy ra");
  }

});

// ===============================
// ADMIN - LẤY SECURITY LOG
// ===============================
router.get(
  "/security-logs",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const logs = await SecurityLog.find()
        .populate("user", "email fullName") // lấy info user
        .sort({ createdAt: -1 }) // mới nhất lên đầu
        .limit(50); // giới hạn 50 log

      res.json({
  success: true,
  total: logs.length,
  data: logs
});
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
// ===============================
// ADMIN - LẤY ACTIVITY LOG
// ===============================
router.get(
  "/activity-logs",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const logs = await ActivityLog.find()
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
  success: true,
  total: logs.length,
  data: logs
});
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
// ================= CHECK LOGIN APPROVED BY TOKEN =================
router.get("/check-login-approved-token/:token", async (req, res) => {
  try {
    const user = await User.findOne({ loginToken: req.params.token });

  if (!user) {
  return res.json({ approved: false });
}

// 🔥 token hết hạn
if (user.loginTokenExpire && user.loginTokenExpire < Date.now()) {
  return res.json({ expired: true }); // 👈 tách riêng
}

    // ✅ APPROVED
if (user.loginStatus === "APPROVED") {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict"
});
  user.loginToken = null;
  user.loginTokenExpire = null;

  user.loginStatus = null;
  await user.save();

  return res.json({
    approved: true,
    token,
    role: user.role
  });
}

// ❌ DENIED
if (user.loginStatus === "DENIED") {
  user.loginStatus = null;        // 🔥 reset trạng thái
  user.loginToken = null;         // 🔥 xóa token
  user.loginTokenExpire = null;   // 🔥 clear expire
  await user.save();

  return res.json({ denied: true });
}

    // ⏳ CHƯA XÁC NHẬN
    return res.json({ approved: false });

  } catch (err) {
    return res.status(500).json({ approved: false });
  }
});
module.exports = router;