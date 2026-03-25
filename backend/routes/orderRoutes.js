const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const ActivityLog = require("../models/ActivityLog");

// =====================================================
// 1️⃣ TẠO ĐƠN HÀNG (USER đặt)
// =====================================================
router.post("/", protect, async (req, res) => {
  try {

    const { items } = req.body;

    // ===============================
    // 🔥 VALIDATE GIỎ HÀNG
    // ===============================
    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Giỏ hàng trống",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    // =====================================================
    // 🔥 KHÔNG TIN FRONTEND → TÍNH LẠI TỪ DATABASE
    // =====================================================
    for (let item of items) {

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: "Sản phẩm không tồn tại",
        });
      }

      // ===============================
      // 🔥 CHECK TỒN KHO
      // ===============================
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Không đủ tồn kho cho ${product.name}`,
        });
      }

      // ===============================
      // 🔥 TÍNH GIÁ THỰC TẾ (CÓ GIẢM GIÁ)
      // NOTE: lưu giá tại thời điểm mua
      // ===============================
      const finalPrice =
        product.discount > 0
          ? product.originalPrice -
            (product.originalPrice * product.discount) / 100
          : product.originalPrice;

      totalAmount += finalPrice * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: finalPrice
      });
    }

    // ===============================
    // 🔥 TẠO ORDER
    // ===============================
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      status: "PENDING",
      statusHistory: [
        {
          status: "PENDING",
          changedBy: req.user._id
        }
      ]
    });

    await order.save();

    // 📝 ACTIVITY LOG: user mua hàng
await ActivityLog.create({
  user: req.user._id,
  action: "CREATE_ORDER",
  description: `User mua đơn hàng ${order._id}`,
});

    res.json({
      message: "Order created successfully",
      order,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================================
// 2️⃣ STAFF & ADMIN xem danh sách đơn
// =====================================================
router.get(
  "/",
  protect,
  authorizeRoles("STAFF", "ADMIN"),
  async (req, res) => {
    try {

      const orders = await Order.find()
        .populate("user", "fullName email")
        .populate("items.product", "name originalPrice discount stock");

      res.json(orders);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// =====================================================
// 3️⃣ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// =====================================================
router.put(
  "/:id/status",
  protect,
  authorizeRoles("STAFF", "ADMIN"),
  async (req, res) => {
    try {

      const { status } = req.body;

      const order = await Order.findById(req.params.id)
        .populate("items.product");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // =====================================
      // 🔥 FLOW CONTROL
      // =====================================
      const validTransitions = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["SHIPPING", "CANCELLED"],
        SHIPPING: ["DELIVERED", "CANCELLED"],
        DELIVERED: [],
        CANCELLED: []
      };

      if (!validTransitions[order.status].includes(status)) {
        return res.status(400).json({
          message: `Không thể chuyển từ ${order.status} sang ${status}`
        });
      }

      // =====================================================
// 4️⃣ USER - XEM ĐƠN HÀNG CỦA TÔI
// =====================================================
router.get("/my-orders", protect, async (req, res) => {
  try {

    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name image originalPrice")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

      // =====================================
      // 🔥 TRỪ KHO KHI CONFIRMED
      // =====================================
      if (status === "CONFIRMED") {

        for (let item of order.items) {

          if (item.product.stock < item.quantity) {
            return res.status(400).json({
              message: `Không đủ tồn kho cho ${item.product.name}`
            });
          }

          item.product.stock -= item.quantity;
          await item.product.save();
        }
      }

      // =====================================
      // 🔥 HOÀN KHO (CHỈ NẾU CHƯA GIAO)
      // =====================================
      if (
        status === "CANCELLED" &&
        order.status !== "DELIVERED" &&
        order.status !== "CANCELLED"
      ) {

        for (let item of order.items) {
          item.product.stock += item.quantity;
          await item.product.save();
        }
      }

      // =====================================
      // 🔥 LƯU LỊCH SỬ
      // =====================================
      order.statusHistory.push({
        status,
        changedBy: req.user._id
      });

      order.status = status;
      await order.save();

      res.json({ message: "Order status updated successfully" });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// =====================================================
// ADMIN - DASHBOARD STATS (TỐI ƯU)
// =====================================================
router.get(
  "/admin-stats",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {

      const totalUsers = await User.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalOrders = await Order.countDocuments();

      // 🔥 TÍNH DOANH THU BẰNG AGGREGATE
      const revenueData = await Order.aggregate([
        { $match: { status: "DELIVERED" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" }
          }
        }
      ]);

      const totalRevenue = revenueData[0]?.totalRevenue || 0;

      res.json({
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// =====================================================
// PUBLIC - TOP 5 BÁN CHẠY
// =====================================================
router.get("/top-products-home", async (req, res) => {
  try {

    const topProducts = await Order.aggregate([
      { $match: { status: "DELIVERED" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    const productIds = topProducts.map(p => p._id);

    const products = await Product.find({
      _id: { $in: productIds }
    });

    const result = topProducts.map(tp => {

      const product = products.find(
        p => p._id.toString() === tp._id.toString()
      );

      if (!product) return null;

      // 🔥 TÍNH LẠI GIÁ HIỆN TẠI
      const finalPrice =
        product.discount > 0
          ? product.originalPrice -
            (product.originalPrice * product.discount) / 100
          : product.originalPrice;

      return {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: finalPrice,
        totalSold: tp.totalSold
      };
    });

    res.json(result.filter(Boolean));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// ADMIN - DOANH THU THEO THÁNG
// ==========================================
router.get(
  "/revenue-by-month",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {

      const year = parseInt(req.query.year);

      const revenue = await Order.aggregate([
        {
          $match: {
            status: "DELIVERED",
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`)
            }
          }
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: "$totalAmount" }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      res.json(revenue);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ==========================================
// ADMIN - SỐ ĐƠN THEO THÁNG
// ==========================================
router.get(
  "/orders-by-month",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {

      const year = parseInt(req.query.year);

      const orders = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`)
            }
          }
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      res.json(orders);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// =====================================================
// USER - LẤY ĐƠN HÀNG CỦA MÌNH
// =====================================================
router.get("/my-orders", protect, async (req, res) => {
  try {

    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name image originalPrice")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;