const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
    },

    ip: String,

    userAgent: String,

    status: {
      type: String,
      enum: ["SUCCESS", "FAIL", "PENDING"],
    },

    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityLog", securityLogSchema);