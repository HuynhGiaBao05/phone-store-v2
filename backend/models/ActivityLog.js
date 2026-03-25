const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
    },

    description: String, // 📝 mô tả hành động

  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);