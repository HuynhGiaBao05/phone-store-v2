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
            max: 100
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

        // 🔥 FIX: đổi image -> images
        images: {
            type: [String],
            default: []
        },

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

module.exports = mongoose.model("Product", productSchema)