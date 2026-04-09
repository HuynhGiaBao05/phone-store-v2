const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===============================
// 🔐 PROTECT - VERIFY TOKEN
// ===============================
const protect = async (req, res, next) => {
  try {
    let token;

    // Kiểm tra header có Bearer token không
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy user từ DB (không lấy password)
      const user = await User.findById(decoded.id).select("-password");

      // Nếu user không tồn tại
      if (!user) {
        return res.status(401).json({
          message: "User not found"
        });
      }

      // Nếu tài khoản bị khóa
      if (!user.isActive) {
        return res.status(403).json({
          message: "Account has been disabled"
        });
      }

      // Gán user vào request
      req.user = user;

      next();
    } else {
      return res.status(401).json({
        message: "Not authorized, no token"
      });
    }
  } catch (error) {
    console.log("JWT ERROR:", error.message);
    return res.status(401).json({
      
      message: "Not authorized"
    });
  }
};

// ===============================
// 🛡 ROLE-BASED AUTHORIZATION
// ===============================
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };