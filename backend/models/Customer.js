const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
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

  phone: String,
  address: String,

  // 🔥 staff phụ trách
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // 🔥 trạng thái
  status: {
    type: String,
    enum: ["NEW", "CARE", "VIP", "BLOCK"],
    default: "NEW"
  },

  // 🔥 ghi chú chăm sóc
  notes: [
    {
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // 🔥 follow up (NHỚ để TRONG schema)
  followUps: [
    {
      date: Date,
      note: String,
      done: {
        type: Boolean,
        default: false
      }
    }
  ],
totalOrders: {
  type: Number,
  default: 0
},
totalSpent: {
  type: Number,
  default: 0
}

}, { timestamps: true });

customerSchema.index({ email: 1 }, { unique: true });
customerSchema.index({ status: 1 });
customerSchema.index({ assignedTo: 1, status: 1 });
module.exports = mongoose.model("Customer", customerSchema);