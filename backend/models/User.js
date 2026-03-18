const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },

  email: {
    type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true
  },

  phone: {
    type: String
  },

  address: {
    type: String
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["USER", "STAFF", "ADMIN"],
    default: "USER"
  },

  // =========================
  // 🔐 ACCOUNT STATUS
  // =========================

  isVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date
  },

  // =========================
  // 🔢 OTP SYSTEM
  // =========================

  otpCode: {
    type: String
  },

  otpExpire: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);