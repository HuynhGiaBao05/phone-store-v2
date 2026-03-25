const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const xss = require("xss"); // 🛡️ XSS: sanitize input

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
const allowedRoles = ["USER", "ADMIN"];
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
  return res.status(400).json({ message: "Email không hợp lệ" });
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



    res.json({ message: "User created successfully" });
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
  return res.status(400).json({ message: "Email không hợp lệ" });
}
if (typeof email !== "string" || typeof password !== "string") {
  return res.status(400).json({ message: "Invalid input type" });
}
    const cleanEmail = email.trim().toLowerCase();
const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🛡️ USE ACCOUNT STATUS
    if (!user.isActive) {
      return res.status(403).json({ message: "Account locked" });
    }

    // 🛡️ USE VERIFY CHECK
    if (user.role === "USER" && !user.isVerified) {
      return res.status(403).json({ message: "Please verify account" });
    }

    // 🛡️ USE BRUTE FORCE PROTECTION
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ message: "Try again later" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // ❌ WRONG PASSWORD
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 60 * 1000;
        user.loginAttempts = 0;
      }

        await user.save();
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ LOGIN SUCCESS
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // ================= FIX MFA + ALERT =================

const role = user.role?.toUpperCase();

// 🛡️ LẤY IP + DEVICE
const ip =
  (req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() || req.socket.remoteAddress;

const agent = req.headers["user-agent"];

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


  const denyLink = `http://localhost:5000/api/users/deny-login/${alertToken}`;

  // 📧 EMAIL CẢNH BÁO
    await user.save();

  await sendEmail(
    user.email,
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
  );

  // 👉 LOGIN LUÔN
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.json({
    message: "Login successful",
    token,
    role: user.role
  });
}

// ================= ADMIN / STAFF → MFA CHẶN LOGIN =================
if (role === "ADMIN" || role === "STAFF") {

  // 🔥 nếu token còn hạn → chặn spam
  if (user.loginTokenExpire && user.loginTokenExpire > Date.now()) {
    return res.status(429).json({
      message: "Đã gửi xác nhận, kiểm tra email"
    });
  }

  // 🔥 nếu token hết hạn → reset
  if (user.loginTokenExpire && user.loginTokenExpire <= Date.now()) {
    user.loginToken = null;
    user.loginTokenExpire = null;
    user.isLoginApproved = false;
  }

  const loginToken = crypto.randomBytes(32).toString("hex");

  user.loginToken = loginToken;
  user.loginTokenExpire = Date.now() + 5 * 60 * 1000;
  user.isLoginApproved = false;

  await user.save();

  const confirmLink = `http://localhost:5000/api/users/approve-login/${loginToken}`;
  const denyLink = `http://localhost:5000/api/users/deny-login/${loginToken}`;

  await sendEmail(
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
);

  return res.json({
    requireApproval: true,
    message: "Vui lòng xác nhận email"
  });
}
return res.status(400).json({ message: "Login failed" });

} catch (error) {
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
  return res.status(400).json({ message: "Email không hợp lệ" });
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
    user.otpExpire = Date.now() + 60 * 1000;

    await user.save();

    await sendEmail(
      cleanEmail,
      "Reset Password OTP",
      `Your password reset OTP is: ${otp}`
    );

    res.json({ message: "Reset OTP sent to email" });

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
newPassword = String(newPassword);

//🛡️ XSS: sanitize input
email = xss(String(email));

// 🛡️  CHECK EMAIL FORMAT
if (!email) {
  return res.status(400).json({ message: "Email is required" });
}


if (!validateEmail(email)) {
  return res.status(400).json({ message: "Email không hợp lệ" });
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
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });

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
    const user = await User.findOne({ email: cleanEmail });

    if (!user) return res.json({ approved: false });

    if (user.isLoginApproved) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      user.isLoginApproved = false;
      user.loginToken = null;
      user.loginTokenExpire = null;

      await user.save();

      return res.json({
        approved: true,
        token,
        role: user.role
      });
    }

    res.json({ approved: false });

  } catch (err) {
    res.status(500).json({ approved: false });
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
  return res.status(400).json({ message: "Email không hợp lệ" });
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
    await sendEmail(
      cleanEmail,
      "OTP Verification",
      `Your OTP code is: ${otp}`
    );

    res.json({
      message: "OTP sent to your email"
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
  return res.status(400).json({ message: "Email không hợp lệ" });
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

    res.json({ message: "Account verified successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
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
  return res.status(400).json({ message: "Email không hợp lệ" });
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

    await sendEmail(
      cleanEmail,
      "Resend OTP Verification",
      `Your new OTP code is: ${newOtp}`
    );

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
      res.json(users);
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

const allowedRoles = ["USER", "ADMIN"];
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
        message: "User deleted successfully"
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
    user.loginToken = null;
    user.loginTokenExpire = null;

    await user.save();

    // 🔥 QUAN TRỌNG: auto đóng tab
    res.send(`
      <script>
        window.open('', '_self');
        window.close();
      </script>
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
      user.loginToken = null;

      if (user.role === "USER") {
        user.isActive = false;
      }

      await user.save();
    }

    res.send("Đã từ chối đăng nhập");
  } catch {
    res.send("Có lỗi xảy ra");
  }
});


module.exports = router;