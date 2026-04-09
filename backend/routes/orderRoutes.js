const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const ActivityLog = require("../models/ActivityLog");
const Customer = require("../models/Customer");
const sendEmail = require("../utils/sendEmail");
const generateInvoice = require("../utils/generateInvoice");

// =====================================================
// 1️⃣ TẠO ĐƠN HÀNG (USER đặt)
// =====================================================
router.post("/", protect, async (req, res) => {
  console.log("ORDER BODY:", req.body);
  try {
     console.log("DELIVERY BACKEND:", req.body.deliveryMethod);
if (!req.body.shippingInfo?.phone || !req.body.shippingInfo?.address) {
  return res.status(400).json({
    message: "Thiếu thông tin giao hàng"
  });
}
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
    const productNames = [];

    // =====================================================
    // 🔥 KHÔNG TIN FRONTEND → TÍNH LẠI TỪ DATABASE
    // =====================================================
    const products = await Promise.all(
  items.map(item => Product.findById(item.product))
);

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const product = products[i];
// ===============================
      // 🔥 CHECK sp ko tồn tại
      // ===============================
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
        productNames.push(product.name);

    }

    // ===============================
    // 🔥 TẠO ORDER
    // ===============================
    const order = new Order({
  user: req.user._id,
  items: orderItems,
  totalAmount,
  shippingInfo: req.body.shippingInfo,

  deliveryMethod: req.body.deliveryMethod,
  paymentMethod: req.body.paymentMethod,

  paymentStatus:
    req.body.paymentMethod === "MOMO" ? "PAID" : "UNPAID",

  
});

    const updatedProducts = [];

    // 🔥 TRỪ KHO NGAY KHI PENDING
for (let item of orderItems) {
  const updated = await Product.updateOne(
    {
      _id: item.product,
      stock: { $gte: item.quantity }
    },
    {
      $inc: { stock: -item.quantity }
    }
  );

  if (updated.modifiedCount === 0) {

    // 🔥 ROLLBACK những cái đã trừ trước đó
    for (let p of updatedProducts) {
      await Product.updateOne(
        { _id: p.product },
        { $inc: { stock: p.quantity } }
      );
    }

    return res.status(400).json({
      message: "Không đủ tồn kho"
    });
  }

  updatedProducts.push(item);
}
    try {
  await order.save();
} catch (err) {

  // 🔥 rollback lại kho nếu save fail
  for (let p of updatedProducts) {
    await Product.updateOne(
      { _id: p.product },
      { $inc: { stock: p.quantity } }
    );
  }

  throw err;
}
    // 📝 ACTIVITY LOG: user mua hàng
await ActivityLog.create({
  user: req.user._id,
  action: "CREATE_ORDER",
  description: `${req.user.email} đặt đơn ${order._id} (${productNames.length} sp: ${productNames.join(", ")})`
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
      const allowedStatus = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"];

if (!status || !allowedStatus.includes(status)) {
  return res.status(400).json({
    message: "Trạng thái không hợp lệ"
  });
}

      const order = await Order.findById(req.params.id)
 .populate("items.product", "name")
.populate("user", "fullName email");


      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (!order.items || order.items.length === 0) {
  return res.status(400).json({
    message: "Order không có sản phẩm"
  });
}
        // =====================================
      // 🔥 LƯU LỊCH SỬ
      // =====================================
     const oldStatus = order.status;
     if (status === oldStatus) {
  return res.status(400).json({
    message: "Trạng thái không thay đổi"
  });
}// 🔥 lưu trạng thái cũ
// ❌ CHẶN USER HỦY KHI KHÔNG PHẢI PENDING
// 🔥 CHỈ CHO STAFF/ADMIN HỦY KHI PENDING (giống user)
if (status === "CANCELLED" && oldStatus !== "PENDING") {
  return res.status(400).json({
    message: "Chỉ được hủy khi đơn đang chờ xử lý"
  });
}
      // =====================================
      // 🔥 FLOW CONTROL
      // =====================================
      const validTransitions = {
  PENDING: ["CONFIRMED", "CANCELLED"], // ✅ chỉ cho hủy ở đây
  CONFIRMED: ["SHIPPING"],             // ❌ bỏ CANCELLED
  SHIPPING: ["DELIVERED"],             // ❌ bỏ CANCELLED
  DELIVERED: [],
  CANCELLED: []
};

      if (!validTransitions[order.status].includes(status)) {
        return res.status(400).json({
          message: `Không thể chuyển từ ${order.status} sang ${status}`
        });
      }

     

      
      

      // =====================================
      // 🔥 HOÀN KHO (CHỈ NẾU CHƯA GIAO)
      // =====================================
      if (
  status === "CANCELLED" &&
  oldStatus === "PENDING" // 🔥 chỉ hoàn nếu đã trừ kho
) {

        for (let item of order.items) {
          await Product.updateOne(
  { _id: item.product._id },
  { $inc: { stock: item.quantity } }
);
        }
      }

    

// 🔥 update status trước
order.status = status;
// 🔥 FIX CHUẨN COD
if (
  status === "DELIVERED" &&
  order.paymentMethod === "COD" &&
  order.paymentStatus === "UNPAID"
) {
  order.paymentStatus = "PAID";
}
// 🔥 khi giao thành công thì lưu ngày giao
if (status === "DELIVERED") {
  order.deliveredAt = new Date();
}
// 🔥 lưu history sau khi update
order.statusHistory.push({
  status,
  changedBy: req.user._id
});

await order.save();

      // ================== 🔥 CRM UPDATE ==================

if (
  status === "DELIVERED" &&
  oldStatus !== "DELIVERED" &&
  order.user
) {  
  
  // ===== GỬI EMAIL + HÓA ĐƠN =====
// ===== GỬI EMAIL + HÓA ĐƠN =====
try {

  if (!order.user?.email) {
    console.log("User không có email: ", order.user);
  } else {

    // 🔥 đảm bảo có data
    await order.populate("user items.product");
    // 🔥 1. tạo PDF trước
 const invoiceBuffer = await generateInvoice(order);
    // 🔥 2. gửi mail (KHÔNG await để tránh lag)
    sendEmail(
      order.user.email,
      "🎉 Cảm ơn bạn đã mua hàng tại PHONESTORE",
      `<h1>Cảm ơn bạn đã chọn PHONESTORE</h1>
        <h2>Cảm ơn bạn đã mua hàng tại PHONESTORE 🥰</h2>
        <p>Đơn hàng <b>#${order._id}</b> đã giao thành công.</p>
        <p>nếu bạn có bất kỳ câu hỏi nào, hãy liên hệ với chúng tôi.</p>
        <p>Hóa đơn được đính kèm bên dưới.</p>
      `,
      [
        {
          filename: "invoice.pdf",
          content: invoiceBuffer
        }
      ]
    ).catch(err => console.log("Mail error:", err));

  }

} catch (err) {
  console.log("❌ Lỗi gửi email:", err);
}


const orderUser = order.user;


if (!orderUser) {
  return res.status(404).json({
    message: "User không tồn tại"
  });
}

  let customer = await Customer.findOne({
    email: orderUser.email
  });

  if (!customer) {
    customer = await Customer.create({
      fullName: orderUser.fullName,
      email: orderUser.email,
      phone: order.shippingInfo?.phone,
      address: order.shippingInfo?.address,
      status: "NEW"
    });
  }

  customer.fullName = orderUser.fullName || customer.fullName;
  customer.phone = order.shippingInfo?.phone || customer.phone;
  customer.address = order.shippingInfo?.address || customer.address;

  customer.totalOrders = (customer.totalOrders || 0) + 1;
  customer.totalSpent = (customer.totalSpent || 0) + order.totalAmount;

  if (customer.totalSpent > 100000000) {
  customer.status = "VIP";
} else if (customer.status === "NEW") {
  customer.status = "CARE";
}

  // 🔥 FIX: đảm bảo notes tồn tại (tránh crash DB cũ)
if (!customer.notes) {
  customer.notes = [];
}

// 🔥 thêm lịch sử chăm sóc
customer.notes.push({
  content: `Đã mua đơn ${order._id}`,
  createdAt: new Date()
});


// 🔥 AUTO ASSIGN ROUND ROBIN
if (!customer.assignedTo) {

  const staffs = await User.find({ role: "STAFF" })
    .sort({ createdAt: 1 }) // 🔥 giữ thứ tự ổn định
    .select("_id");

  if (staffs.length > 0) {

    const totalCustomers = await Customer.countDocuments();

    const staff = staffs[totalCustomers % staffs.length];

    customer.assignedTo = staff._id;
  }
}
await customer.save();
// 🔥 log CRM action
await ActivityLog.create({
  user: req.user._id,
  action: "CRM_UPDATE",
  description: `Cập nhật khách hàng ${customer.email} sau đơn ${order._id}`
});

}
// ===================================================
      //activity
      // luôn log update
await ActivityLog.create({
  user: req.user._id,
  action: "UPDATE_ORDER_STATUS",
  description: `Đổi trạng thái đơn ${order._id} từ ${oldStatus} → ${status}`
});

// chỉ log cancel khi thật sự cancel
if (status === "CANCELLED") {
  await ActivityLog.create({
    user: req.user._id,
    action: "CANCEL_ORDER",
    description: `Hủy đơn ${order._id}`,
  });
}
      res.json({ message: "Order status updated successfully" });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
// ===============================
// ADMIN - REVENUE BY MONTH
// ===============================
router.get("/revenue-chart", protect, authorizeRoles("ADMIN"), async (req, res) => {
  try {

    const data = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, // nhóm theo tháng
          totalRevenue: { $sum: "$totalAmount" } // tổng tiền
        }
      },
      {
        $sort: { "_id": 1 } // sắp xếp tháng tăng dần
      }
    ]);

    // format lại cho frontend
    const result = data.map(item => ({
      name: `Tháng ${item._id}`,
      revenue: item.totalRevenue
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ===============================
// ADMIN - ORDERS BY MONTH
// ===============================
router.get("/orders-chart", protect, authorizeRoles("ADMIN"), async (req, res) => {
  try {

    const data = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    const result = data.map(item => ({
      name: `Tháng ${item._id}`,
      orders: item.totalOrders
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ================= RECENT ORDERS =================
router.get(
  "/recent-orders",
  protect,
  authorizeRoles("ADMIN", "STAFF"),
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(5);

      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
// ================= TOP PRODUCTS (ADMIN) =================
router.get(
  "/top-products",
  protect,
  authorizeRoles("ADMIN", "STAFF"),
  async (req, res) => {
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

        return {
          name: product?.name,
          sold: tp.totalSold
        };
      });

      res.json(result);

    } catch (err) {
      res.status(500).json({ message: err.message });
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

  // ✅ FIX Ở ĐÂY
  image: Array.isArray(product.image)
    ? `http://localhost:5000/uploads/${product.image[0]}`
    : `http://localhost:5000/uploads/${product.image}`,

  price: finalPrice,
  discount: product.discount,
  originalPrice: product.originalPrice,
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
    totalRevenue: { $sum: "$totalAmount" }
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
            totalOrders: { $sum: 1 }
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
// =====================================================
// USER - HỦY ĐƠN
// =====================================================
router.put("/:id/cancel", protect, authorizeRoles("USER"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "Chỉ được hủy khi đơn chưa xử lý"
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Không có quyền hủy đơn này"
      });
    }

    // 🔥 CỘNG LẠI KHO (ĐẶT Ở ĐÂY)
    for (let item of order.items) {
      if (item.product) {
       await Product.updateOne(
  { _id: item.product._id },
  { $inc: { stock: item.quantity } }
);
      }
    }

    order.status = "CANCELLED";

    order.statusHistory.push({
      status: "CANCELLED",
      changedBy: req.user._id
    });

    await order.save();

    await ActivityLog.create({
      user: req.user._id,
      action: "CANCEL_ORDER",
      description: `User hủy đơn ${order._id}`
    });

    res.json({ message: "Hủy đơn thành công" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;