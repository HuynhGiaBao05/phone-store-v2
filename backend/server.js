const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // ✅ THÊM DÒNG NÀY
require("dotenv").config();
const momoRoutes = require("./routes/momo");
const app = express();
const helmet = require("helmet");
const hpp = require("hpp");

const rateLimit = require("express-rate-limit");

// 🛡️ BRUTE FORCE PROTECTION: limit login attempts
const isDev = process.env.NODE_ENV !== "production";
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 giây
   max: isDev ? 100 : 5,
  message: {
    message: "Bạn đã thử đăng nhập quá nhiều lần, thử lại sau 60 giây",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    message: "Gửi OTP quá nhiều, thử lại sau"
  }
});
app.use("/api/banners", require("./routes/bannerRoutes"));

// 🛡️ SECURITY FIRST
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.set("trust proxy", 1);
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// 🛡️ TRUST PROXY (PHẢI ĐỂ SỚM)


// 🛡️ BODY
app.use(express.json({ limit: "10kb" }));
app.use(hpp());
// 🛡️ chống NoSQL injection
// 🛡️ CUSTOM NoSQL SANITIZE 
// 🛡️ FULL SANITIZE (NoSQL + Prototype Pollution)
app.use((req, res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== "object") return;

    // xử lý array
    if (Array.isArray(obj)) {
      obj.forEach(clean);
      return;
    }

    // 🔥 chống prototype pollution
    delete obj.__proto__;
    delete obj.constructor;
    delete obj.prototype;

    Object.keys(obj).forEach((key) => {
      // 🔥 chống NoSQL injection
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
        return;
      }

      // 🔥 recursive
      if (typeof obj[key] === "object" && obj[key] !== null) {
        clean(obj[key]);
      }
    });
  };

  clean(req.body);
  clean(req.query);
  clean(req.params);

  next();
});

// 🛡️ BRUTE FORCE
app.use("/api/users/login", loginLimiter);
app.use("/api/users/send-reset-otp", otpLimiter);
app.use("/api/users/register", otpLimiter);
app.use("/api/users/resend-otp", otpLimiter);






// 🛡️ FIX ERROR: tránh crash req.query



// =====================================================
// 🔥 ENV CONFIG
// =====================================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// =====================================================
// 🔥 MIDDLEWARE
// =====================================================







// =====================================================
// 🔥 STATIC FOLDER UPLOAD (FIX CHUẨN TUYỆT ĐỐI)
// =====================================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// 👇 Debug thử đường dẫn thực tế
console.log("Uploads path:", path.join(__dirname, "uploads"));


// =====================================================
// 🔥 ROUTES
// =====================================================
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const brandRoutes = require("./routes/brandRoutes");
const cartRoutes = require("./routes/cartRoutes");
const reportRoutes = require("./routes/reportRoutes");
const storeRoutes = require("./routes/storeRoutes");
const customerRoutes = require("./routes/customerRoutes");



app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/momo", momoRoutes);
// =====================================================
// TEST ROUTE
// =====================================================
app.get("/", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});


// =====================================================
// 404 HANDLER
// =====================================================
app.use((req, res, next) => {
  res.status(404).json({
    message: "API route not found",
  });
});


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
});


// =====================================================
// CONNECT DB
// =====================================================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} 🚀`);
    });
  })
  .catch((err) => {
console.error("MongoDB error:", err.message);
  });