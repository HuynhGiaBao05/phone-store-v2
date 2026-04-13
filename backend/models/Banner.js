const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["ACTIVE", "COMING_SOON"],
    default: "ACTIVE"
  },

  title: String,

  image: String, // 🔥 ảnh banner (home)

  // ✅ THÊM ĐOẠN NÀY
  images: [String],       // 🔥 tối đa 3 ảnh (coming soon)
  description: String,    // 🔥 mô tả sản phẩm
launchDate: {
  type: Date
},
  type: {
    type: String,
    enum: ["PRODUCT", "PROMO", "COMING_SOON"]
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  link: String,

  order: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  startDate: Date,
  endDate: Date

}, { timestamps: true });

module.exports = mongoose.model("Banner", bannerSchema);