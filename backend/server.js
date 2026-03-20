const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // ✅ THÊM DÒNG NÀY
require("dotenv").config();


const app = express();
const helmet = require("helmet");


const rateLimit = require("express-rate-limit");


// 🛡️ BRUTE FORCE PROTECTION: limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

// 🛡️ SECURITY FIRST
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// 🛡️ TRUST PROXY (PHẢI ĐỂ SỚM)
app.set("trust proxy", true);

// 🌐 CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// 🛡️ BODY
app.use(express.json({ limit: "10kb" }));
// ✅ FIX: tránh crash req.query + injection basic
app.use((req, res, next) => {
  try {
    if (req.body && typeof req.body !== "object") {
      return res.status(400).json({ message: "Invalid body" });
    }

    if (req.query && typeof req.query !== "object") {
      return res.status(400).json({ message: "Invalid query" });
    }

    next();
  } catch (err) {
    next(err);
  }
});
// 🛡️ BRUTE FORCE
app.use("/api/users/login", loginLimiter);



// 🛡️ XSS: Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'self' data: blob:; script-src * 'self' 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});



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

app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/stores", storeRoutes);


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
    console.error("MongoDB connection error ❌", err);
  });