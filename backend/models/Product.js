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

    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // 🔥 sửa luôn (bạn đang để 5)
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

    promoEndDate: {
      type: Date,
      default: null
    },

    image: {
      type: [String],
      default: null
    },

    // 🔥🔥🔥 FIX QUAN TRỌNG: reviews PHẢI NẰM TRONG SCHEMA
    reviews: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rating: {
      type: Number,
      required: true
    },
    comment: {
      type: String,
      default: ""
    },

    // 🔥 THÊM IMAGE REVIEW
    images: [
      {
        type: String
      }
    ],

    createdAt: {
      type: Date,
      default: Date.now
    }
  }
]
  },
  { timestamps: true }
);

// =====================================================
productSchema.pre("save", function (next) {
  if (this.discount === 0) {
    this.promoEndDate = null;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);