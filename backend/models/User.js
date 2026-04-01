const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  index: true 
  },

  phone: {
    type: String
  },

  address: {
    type: String
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  role: {
    type: String,
    enum: ["USER", "STAFF", "ADMIN"],
    default: "USER"
  },
// ================= MFA =================
loginToken: String,
loginTokenExpire: Date,

isLoginApproved: {
  type: Boolean,
  default: false,
},

loginHistory: {
  type: [
    {
      ip: String,
      userAgent: String,
      time: {
        type: Date,
        default: Date.now
      }
    }
  ],
  default: []
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
    default: 0,
    max: 10
  },

  lockUntil: {
    type: Date
  },
loginStatus: {
  type: String,
  enum: ["PENDING", "APPROVED", "DENIED"],
  default: null
},
  // =========================
  // 🔢 OTP SYSTEM
  // =========================

  otpCode: {
    type: String
  },

  otpExpire: {
    type: Date,
  }


  
}, 


{ timestamps: true });


module.exports = mongoose.model("User", userSchema);