const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Category = require("../models/Category");

const upload = require("../middleware/uploadMiddleware");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const fs = require("fs");
const path = require("path");
const ActivityLog = require("../models/ActivityLog");

// =====================================================
// FUNCTION TÍNH GIÁ + AUTO HỦY KM + BADGE SẮP HẾT GIỜ
// =====================================================
async function calculateProductPrice(product) {

  let finalPrice = product.originalPrice;
  let activeDiscount = product.discount;
  let isExpiringSoon = false; // 🔥 FLAG BADGE

  if (product.discount > 0 && product.promoEndDate) {

    const now = new Date();
    const endDate = new Date(product.promoEndDate);
    const diff = endDate - now;

    // =====================================================
    // 🔥 1️⃣ HẾT HẠN → RESET DISCOUNT
    // =====================================================
    if (diff <= 0) {

      product.discount = 0;
      product.promoEndDate = null;

      activeDiscount = 0;
      finalPrice = product.originalPrice;
    }

    // =====================================================
    // 🔥 2️⃣ CÒN HẠN → TÍNH GIÁ
    // =====================================================
    else {

      finalPrice =
        product.originalPrice -
        (product.originalPrice * product.discount) / 100;

      // =====================================================
      // 🔥 3️⃣ NẾU CÒN DƯỚI 24H → BẬT BADGE
      // =====================================================
      const hoursLeft = diff / (1000 * 60 * 60);

      if (hoursLeft <= 24) {
        isExpiringSoon = true;
      }
    }
  }

    return {
        ...product.toObject(),
        price: finalPrice,
        discount: activeDiscount,
        isExpiringSoon,
        images: product.images
            ? product.images.map(img => `http://localhost:5000/uploads/${img}`)
            : [],
    };
}

// =====================================================
// CREATE PRODUCT
// =====================================================
router.post(
  "/create",
  protect,
  authorizeRoles("ADMIN", "STAFF"),
  upload.array("images", 10),
  async (req, res) => {
    try {

      const originalPrice = Number(req.body.originalPrice);
      const discount = Math.max(0, Math.min(100, Number(req.body.discount) || 0));

      if (!originalPrice || originalPrice <= 0) {
        return res.status(400).json({ message: "Giá gốc phải lớn hơn 0" });
      }

      const product = new Product({
        name: req.body.name,
        category: req.body.category,
        brand: req.body.brand,
        originalPrice,
        discount,
        stock: req.body.stock,
        description: req.body.description,
        promotion: req.body.promotion,
// 🔥 CHỈ LƯU promoEndDate NẾU discount > 0
        promoEndDate: discount > 0 ? req.body.promoEndDate : null,

          images: req.files ? req.files.map(file => file.filename) : [],
      });

      await product.save();

      // 📝 ACTIVITY LOG: admin thêm sản phẩm
await ActivityLog.create({
  user: req.user._id,
  action: "CREATE_PRODUCT",
  description: `Thêm sản phẩm ${product.name}`,
});

      res.json({ message: "Product created" });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =====================================================
// GET ALL PRODUCTS (PAGINATION)
// =====================================================
router.get("/", async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 999;
    const category = req.query.category;

    const skip = (page - 1) * limit;

    let filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category")
      .populate("brand")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const updatedProducts = await Promise.all(
      products.map((p) => calculateProductPrice(p))
    );

    res.json({
      products: updatedProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      totalProducts
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET PRODUCTS BY CATEGORY SLUG
// =====================================================
router.get("/category/:slug", async (req, res) => {
  try {

    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ category: category._id })
      .populate("category")
      .populate("brand");

    const updatedProducts = await Promise.all(
      products.map((p) => calculateProductPrice(p))
    );

    res.json(updatedProducts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// UPDATE PRODUCT
// =====================================================
router.put(
  "/:id",
  protect,
  authorizeRoles("ADMIN", "STAFF"),
    upload.array("images", 10),
  async (req, res) => {
    try {

      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

        // ===== UPDATE FIELD =====
        product.name = req.body.name ?? product.name;
        product.stock = req.body.stock ?? product.stock;
product.description = req.body.description ?? product.description;
        product.promotion = req.body.promotion ?? product.promotion;
        product.category = req.body.category ?? product.category;
        product.brand = req.body.brand ?? product.brand;

        // ===== UPDATE ẢNH =====
if (req.files && req.files.length > 0) {

    // 🔥 KHÔNG XÓA ẢNH CŨ

    // 🔥 GỘP ẢNH CŨ + ẢNH MỚI
    product.images = [
        ...(product.images || []),
        ...req.files.map(file => file.filename)
    ];

        }

      await product.save();

// 📝 ACTIVITY LOG: update sản phẩm
await ActivityLog.create({
  user: req.user._id,
  action: "UPDATE_PRODUCT",
  description: `Cập nhật sản phẩm ${product.name}`,
});

      res.json({ message: "Product updated" });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =====================================================
// DELETE PRODUCT
// =====================================================
    router.delete(
      "/:id",
      protect,
      authorizeRoles("ADMIN", "STAFF"),
      async (req, res) => {
        console.log("USER:", req.user);
          console.log("PARAM ID:", req.params.id);

        try {

          const product = await Product.findById(req.params.id);
          if (!product) {
            return res.status(404).json({ message: "Product not found" });
          }
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
            if (req.files && req.files.length > 0) {
                try {
                    product.images.forEach(img => {
                        const imagePath = path.join(__dirname, "../uploads", img);

                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        } else {
                            console.log("⚠️ File not found:", imagePath);
                        }
                    });
                } catch (err) {
                    console.log("⚠️ Delete image error:", err.message);
                }
            }

          await Product.findByIdAndDelete(req.params.id);

// 📝 ACTIVITY LOG: delete sản phẩm
//await ActivityLog.create({
  //user: req.user._id,
 // action: "DELETE_PRODUCT",
  //description: `Xóa sản phẩm ${product.name}`,
//});

      res.json({ message: "Product deleted successfully" });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =====================================================
// SEARCH PRODUCT
// =====================================================
router.get("/search", async (req, res) => {
  try {

    const keyword = req.query.q;

    if (!keyword) {
      return res.json([]);
    }

    const products = await Product.find({
      name: { $regex: keyword, $options: "i" }
    })
      .limit(10)
      .sort({ createdAt: -1 });

    const updatedProducts = await Promise.all(
      products.map((p) => calculateProductPrice(p))
    );

    res.json(updatedProducts);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET SINGLE PRODUCT
// =====================================================
router.get("/:id", async (req, res) => {
  try {

    const product = await Product.findById(req.params.id)
  .populate("category")
  .populate("brand")
  .populate("reviews.user", "name email");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await calculateProductPrice(product);

    res.json(updatedProduct);

  } catch (error) {
     console.error("🔥 ERROR GET PRODUCT:", error);
    res.status(500).json({ message: error.message });
  }
});
// =====================================================
// USER - ĐÁNH GIÁ SẢN PHẨM
// =====================================================
// 🔥 upload nhiều ảnh
router.post(
  "/:id/review",
  protect,
  upload.array("images", 5), // 🔥 tối đa 5 ảnh
  async (req, res) => {
    try {
      const { rating, comment } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      // 🔥 lấy list ảnh
      const imageUrls = req.files
        ? req.files.map(file => file.filename)
        : [];

      const review = {
        user: req.user._id,
        rating: Number(rating),
        comment,
        images: imageUrls // 🔥 thêm ảnh
      };

      if (!product.reviews) {
        product.reviews = [];
      }
// ❌ CHẶN REVIEW 2 LẦN
const alreadyReviewed = product.reviews.find(
  r => r.user.toString() === req.user._id.toString()
);

if (alreadyReviewed) {
  return res.status(400).json({
    message: "Bạn đã đánh giá rồi"
  });
}
      product.reviews.push(review);

      await product.save();

      res.json({ message: "Đánh giá thành công" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);
module.exports = router;