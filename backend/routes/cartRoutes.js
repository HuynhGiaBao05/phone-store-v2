const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");


// =====================================================
// 🔥 GET CART
// =====================================================
router.get("/", protect, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: "items.product",
                select: "name price image originalPrice discount stock isActive"
            });

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: []
            });
        }

        res.json(cart);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// =====================================================
// 🔥 ADD TO CART (FIX STOCK CHECK)
// =====================================================
router.post("/add", protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Product ID required" });
        }

        const product = await Product.findById(productId);

        // ❌ FIX: KHÔNG dùng isActive nếu schema chưa có
        if (!product || product.stock <= 0) {
            return res.status(400).json({
                message: "Sản phẩm đã hết hàng"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: `Chỉ còn ${product.stock} sản phẩm`
            });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: []
            });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {

            const newQty = existingItem.quantity + quantity;

            if (newQty > product.stock) {
                return res.status(400).json({
                    message: `Vượt quá tồn kho (${product.stock})`
                });
            }

            existingItem.quantity = newQty;

        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();

        const updatedCart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: "items.product",
                select: "name price image originalPrice discount stock isActive"
            });

        res.json(updatedCart);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// =====================================================
// 🔥 UPDATE QUANTITY (FIX STOCK)
// =====================================================
router.put("/update", protect, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || quantity < 1) {
            return res.status(400).json({ message: "Invalid data" });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        const product = await Product.findById(productId);

        // ❌ FIX: chỉ check stock + active an toàn
        if (!product || product.stock <= 0) {
            return res.status(400).json({
                message: "Sản phẩm không còn bán"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: `Chỉ còn ${product.stock} sản phẩm`
            });
        }

        item.quantity = quantity;

        await cart.save();

        const updatedCart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: "items.product",
                select: "name price image originalPrice discount stock isActive"
            });

        res.json(updatedCart);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// =====================================================
// 🔥 REMOVE ITEM
// =====================================================
router.delete("/remove/:productId", protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );

        await cart.save();

        const updatedCart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: "items.product",
                select: "name price image originalPrice discount stock isActive"
            });

        res.json(updatedCart);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
