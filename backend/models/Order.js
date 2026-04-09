const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  
  {
    // =====================================================
    // 👤 USER ĐẶT HÀNG
    // =====================================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // 🔥 FIX: bắt buộc phải có user
    },

    // =====================================================
    // 🛒 DANH SÁCH SẢN PHẨM
    // =====================================================
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true, // 🔥 FIX
        },

        quantity: {
          type: Number,
          required: true, // 🔥 FIX
          min: 1,
        },

        // 🔥 LƯU GIÁ TẠI THỜI ĐIỂM MUA (KHÔNG LẤY LẠI TỪ PRODUCT)
        price: {
          type: Number,
          required: true, // 🔥 FIX
        },
      },
    ],
deliveredAt: Date,
    // =====================================================
    // 💰 TỔNG TIỀN
    // =====================================================
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================================
    // 🚚 THÔNG TIN GIAO HÀNG (🔥 THÊM MỚI)
    // =====================================================
    shippingInfo: {
      fullName: String,
      phone: String,
      address: String,
      note: String,
    },
    // =====================================================
// 🚚 HÌNH THỨC NHẬN HÀNG
// =====================================================
deliveryMethod: {
  type: String,
  enum: ["DELIVERY", "STORE"],
  default: "STORE"
},

    // =====================================================
    // trạng thái thanh toán
    // =====================================================
paymentStatus: {
  type: String,
  enum: ["UNPAID", "PAID"],
  default: "UNPAID"
},
    // =====================================================
    // 💳 PHƯƠNG THỨC THANH TOÁN (🔥 THÊM MỚI)
    // =====================================================
    paymentMethod: {
  type: String,
  enum: ["COD", "BANKING", "MOMO"],
  default: "COD"
},
orderCode: {
  type: String,
  unique: true
},

    // =====================================================
    // 📦 TRẠNG THÁI ĐƠN
    // =====================================================
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "SHIPPING",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true, // 🔥 FIX: tăng tốc query dashboard
    },
   

    // =====================================================
    // 📜 LỊCH SỬ TRẠNG THÁI
    // =====================================================
    statusHistory: [
      {
        status: String,

        changedAt: {
          type: Date,
          default: Date.now,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true }
);


// =====================================================
// 🔥 AUTO HANDLE TRƯỚC KHI SAVE
// =====================================================
orderSchema.pre("save", function (next) {

  if (this.isNew && !this.orderCode) {

    // ✅ tạo mã đơn
   this.orderCode =
  "ORD-" +
  new Date().toISOString().slice(2, 10).replace(/-/g, "") +
  "-" +
  Math.floor(Math.random() * 1000);

    // ✅ đảm bảo có mảng
    if (!this.statusHistory) {
      this.statusHistory = [];
    }

    // ✅ push lịch sử
    this.statusHistory.push({
      status: "PENDING",
      changedBy: this.user,
    });
  }

  next();
});
orderSchema.index({ createdAt: 1 });

// ❗ LUÔN ĐỂ CUỐI FILE
module.exports = mongoose.model("Order", orderSchema);
