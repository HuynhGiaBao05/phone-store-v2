const express = require("express");
const router = express.Router();
const Store = require("../models/Store");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");


// ==========================================
// ⭐ ADMIN - TẠO CHI NHÁNH
// ==========================================
router.post(
  "/",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {

    try {

      const store = await Store.create(req.body);

      res.json(store);

    } catch (err) {

      res.status(500).json({ message: err.message });

    }

  }
);


// ==========================================
// ⭐ ADMIN - LẤY STORE (CHỈ ACTIVE)
// ==========================================
router.get(
  "/admin",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {

    try {

      // ⭐ chỉ lấy store chưa bị xóa
      const stores = await Store.find({ isActive: true })
        .sort({ createdAt: -1 });

      res.json(stores);

    } catch (err) {

      res.status(500).json({ message: err.message });

    }

  }
);


// ==========================================
// ⭐ PUBLIC - STORE ACTIVE
// ==========================================
router.get("/", async (req, res) => {

  try {

    const stores = await Store.find({ isActive: true });

    res.json(stores);

  } catch (err) {

    res.status(500).json({ message: err.message });

  }

});


// ==========================================
// ⭐ ADMIN - UPDATE STORE
// ==========================================
router.put(
  "/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {

    try {

      const store = await Store.findById(req.params.id);

      if (!store) {
        return res.status(404).json({
          message: "Store not found"
        });
      }

      // ⭐ cập nhật dữ liệu
      Object.assign(store, req.body);

      await store.save();

      res.json(store);

    } catch (err) {

      res.status(500).json({ message: err.message });

    }

  }
);


// ==========================================
// ⭐ ADMIN - DELETE STORE (SOFT DELETE)
// ==========================================
router.delete(
  "/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {

    try {

      const store = await Store.findById(req.params.id);

      if (!store) {
        return res.status(404).json({
          message: "Store not found"
        });
      }

      // ⭐ soft delete
      store.isActive = false;

      await store.save();

      res.json({
        message: "Store deleted successfully"
      });

    } catch (err) {

      res.status(500).json({ message: err.message });

    }

  }
);


module.exports = router;