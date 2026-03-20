const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    // ================= GIÁ GỐC =================
    originalPrice: { 
      type: Number, 
      required: true,
      min: 0
    },

    // ================= DISCOUNT (%) =================
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    description: {
      type: String,
      default: ""
    },

    promotion: {
      type: String,
      default: ""
    },

    // ================= NGÀY HẾT KHUYẾN MÃI =================
    promoEndDate: {
      type: Date,
      default: null
    },

    image: {
      type: String,
      default: null
    },
  },
  { timestamps: true }
);



// =====================================================
// 🔥 AUTO CLEAR promoEndDate NẾU discount = 0
// =====================================================
productSchema.pre("save", function (next) {

  // Nếu discount = 0 thì không giữ ngày hết hạn
  if (this.discount === 0) {
    this.promoEndDate = null;
  }

  next();
});


module.exports = mongoose.model("Product", productSchema);