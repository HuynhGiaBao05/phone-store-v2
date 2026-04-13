const express = require("express");
const router = express.Router();
const Banner = require("../models/Banner");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// GET ALL BANNERS
router.get("/", async (req, res) => {
  const now = new Date();

  // 🔥 auto disable
  await Banner.updateMany(
    {
      type: "COMING_SOON",
      launchDate: { $lt: now },
      isActive: true
    },
    { isActive: false }
  );

  const banners = await Banner.find({
    isActive: true,
    $or: [
      { type: { $ne: "COMING_SOON" } },
      { type: "COMING_SOON", launchDate: { $gte: now } }
    ]
  })
    .sort({ order: 1 })
    .populate("productId");

  res.json(banners);
});
// ✅ CREATE banner có upload ảnh
router.post(
  "/",
  protect,
  authorizeRoles("ADMIN", "STAFF"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 3 }
  ]),
  async (req, res) => {
    try {
console.log("FILES:", req.files);
    console.log("BODY:", req.body);
    const count = await Banner.countDocuments();

      const newBanner = new Banner({
        launchDate: req.body.launchDate
  ? new Date(req.body.launchDate)
  : null,
        title: req.body.title || "",

        // 🔥 1️⃣ ẢNH BANNER
        image: req.files?.image?.[0]?.filename || "",

        // 🔥 2️⃣ ẢNH COMING SOON (MAX 3)
        images: req.files?.images?.map(f => f.filename) || [],

        // 🔥 INFO
       description: req.body.description || "",

        type: req.body.type,
        productId: req.body.productId || null,
        link: req.body.link || "",

        isActive: true,
        order: count
      });

      await newBanner.save();

      res.json(newBanner);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
// 🔥 UPDATE ORDER
router.put("/reorder", async (req, res) => {
  const { banners } = req.body;

  // banners = [{_id, order}]
  const updates = banners.map(b =>
    Banner.findByIdAndUpdate(b._id, { order: b.order })
  );

  await Promise.all(updates);

  res.json({ message: "Updated order" });
});
// ✅ UPDATE BANNER
router.put(
  "/:id",
  protect,
  authorizeRoles("ADMIN", "STAFF"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 3 }
  ]),
  async (req, res) => {
    try {
      const updateData = {
        ...req.body
      };

      if (req.files?.image) {
        updateData.image = req.files.image[0].filename;
      }

      if (req.files?.images) {
        updateData.images = req.files.images.map(f => f.filename);
      }

      const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json(banner);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
// ✅ DELETE BANNER
router.delete(
  "/:id",
  protect,
  authorizeRoles("ADMIN", "STAFF"),
  async (req, res) => {
    try {
      await Banner.findByIdAndDelete(req.params.id);
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
module.exports = router;