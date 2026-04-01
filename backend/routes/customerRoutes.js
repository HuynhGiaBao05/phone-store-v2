const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const Order = require("../models/Order");

// ===============================
// CREATE CUSTOMER
// ===============================
router.post("/", protect, async (req, res) => {
  try {
    const { fullName, email, phone, address } = req.body;
if (!email || !fullName) {
  return res.status(400).json({
    message: "Thiếu thông tin khách hàng"
  });
}
    // ✅ đặt ở đây
    const existing = await Customer.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "Email đã tồn tại"
      });
    }

    const customer = new Customer({
      fullName,
      email,
      phone,
      address
    });

    await customer.save();

    res.json({ message: "Customer created", customer });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ===============================
// GET CUSTOMER (ROLE BASED)
// ===============================
router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    // 🔥 STAFF chỉ thấy khách của mình
    if (req.user.role === "STAFF") {
      query.assignedTo = req.user._id;
    }

    // 🔥 FILTER theo status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const customers = await Customer.find(query)
      .populate("assignedTo", "fullName email");

    res.json(customers);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// ASSIGN CUSTOMER TO STAFF (ADMIN ONLY)
// ===============================
router.put(
  "/assign/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { staffId } = req.body;

      // 🔥 tìm customer
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // 🔥 gán staff
      customer.assignedTo = staffId;

      await customer.save();

      res.json({
        message: "Assigned successfully",
        customer
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ===============================
// ADD NOTE (STAFF)
// ===============================
router.post("/:id/note", protect, async (req, res) => {
  try {
    const { content } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // 🔥 chỉ staff phụ trách mới được ghi note
    if (
      req.user.role === "STAFF" &&
      String(customer.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not your customer" });
    }

    // 🔥 thêm note
    if (!customer.notes) {
  customer.notes = [];
}

customer.notes.push({
  content
});

    await customer.save();

    res.json({
      message: "Note added",
      customer
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ===============================
// UPDATE CUSTOMER STATUS
// ===============================
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // 🔥 STAFF chỉ sửa khách của mình
    if (
      req.user.role === "STAFF" &&
      String(customer.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not your customer" });
    }

    const allowedStatus = ["NEW", "CARE", "VIP"];

if (!allowedStatus.includes(status)) {
  return res.status(400).json({
    message: "Status không hợp lệ"
  });
}

customer.status = status;

    await customer.save();

    res.json({
      message: "Status updated",
      customer
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ===============================
// ADD FOLLOW UP
// ===============================
router.post("/:id/follow", protect, async (req, res) => {
  try {
   if (!date || !note) {
  return res.status(400).json({
    message: "Thiếu thông tin follow-up"
  });
}
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!customer.followUps) {
  customer.followUps = [];
}

customer.followUps.push({
  date,
  note
});

    await customer.save();

    res.json({
      message: "Follow-up added",
      customer
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("assignedTo");

    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    const orders = await Order.find({
      customer: req.params.id,
    });

    res.json({
      customer,
      orders,
    });

  } catch (err) {
    console.error("🔥 ERROR CUSTOMER DETAIL:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message, // 👈 thêm dòng này để debug
    });
  }
});
module.exports = router;