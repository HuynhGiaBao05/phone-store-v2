import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CartPage.css";

function CartPage() {

    const [cart, setCart] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // ====================================================
    // FIXED: GET PRODUCT PRICE (DISCOUNT %)
    // ====================================================
    const getPrice = (product) => {
        if (!product) return 0;

        const originalPrice = Number(product.originalPrice || 0);
        const discount = Number(product.discount || 0);

        // discount là %
        if (discount > 0 && discount <= 100) {
            return originalPrice - (originalPrice * discount) / 100;
        }

        return originalPrice;
    };

    // ====================================================
    // FETCH CART
    // ====================================================
    const fetchCart = async () => {
        if (!token) return;

        try {
            const res = await axios.get(
                "http://localhost:5000/api/cart",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Cart data:", res.data.items);
            setCart(res.data.items || []);
        } catch (err) {
            console.log("Fetch cart error:", err);
        }
    };

    // ====================================================
    // CHECK LOGIN + LOAD CART
    // ====================================================
    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            await fetchCart();
        };

        fetchData();

    }, [token, navigate]);

    // ====================================================
    // SELECT ITEM
    // ====================================================
    const toggleSelect = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const allProductIds = cart
            .filter(i => i.product)
            .map(i => i.product._id);

        if (selectedItems.length === allProductIds.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(allProductIds);
        }
    };

    // ====================================================
    // UPDATE QUANTITY
    // ====================================================
    const updateQuantity = async (productId, quantity) => {
        try {
            await axios.put(
                "http://localhost:5000/api/cart/update",
                { productId, quantity },
{ headers: { Authorization: `Bearer ${token}` } }
            );
            fetchCart();
        } catch (err) {
            console.log("Update qty error:", err);
        }
    };

    const increaseQty = (item) => {
        if (!item.product) return;
        updateQuantity(item.product._id, item.quantity + 1);
    };

    const decreaseQty = (item) => {
        if (!item.product) return;
        if (item.quantity > 1) {
            updateQuantity(item.product._id, item.quantity - 1);
        }
    };

    // ====================================================
    // REMOVE ITEM
    // ====================================================
    const removeItem = async (productId) => {
        try {
            await axios.delete(
                `http://localhost:5000/api/cart/remove/${productId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSelectedItems(prev =>
                prev.filter(id => id !== productId)
            );

            fetchCart();
        } catch (err) {
            console.log("Remove error:", err);
        }
    };

    // ====================================================
    // CALCULATE TOTAL
    // ====================================================
    const selectedProducts = cart.filter(item =>
        item.product && selectedItems.includes(item.product._id)
    );

    const total = selectedProducts.reduce((sum, item) => {
        const price = getPrice(item.product);
        return sum + price * item.quantity;
    }, 0);

    // ====================================================
    // CHECKOUT
    // ====================================================
    const handleCheckout = () => {
        if (selectedProducts.length === 0) return;

        sessionStorage.setItem(
            "checkoutItems",
            JSON.stringify(selectedProducts)
        );

        navigate("/checkout");
    };

    // ====================================================
    // FIX IMAGE URL
    // ====================================================
    const getImageUrl = (image) => {
        if (!image) return "";
        if (image.startsWith("http")) return image;
        return `http://localhost:5000/uploads/${image}`;
    };

    // ====================================================
    // RENDER
    // ====================================================
    return (
        <div className="cart-page">

            <h2 className="cart-title">Giỏ hàng của bạn</h2>

            {/* SELECT ALL */}
            {cart.length > 0 && (
                <div className="select-all-row">
                    <div
                        className={`check-circle ${selectedItems.length === cart.filter(i => i.product).length
                                ? "checked"
                                : ""
                            }`}
                        onClick={handleSelectAll}
                    ></div>
                    <span>Chọn tất cả</span>
</div>
            )}

            {/* EMPTY */}
            {cart.length === 0 && (
                <div className="empty-cart">
                    🛒 Giỏ hàng trống
                </div>
            )}

            {/* LIST */}
            {cart.map(item => {
                if (!item.product) return null;

                const productId = item.product._id;
                const finalPrice = getPrice(item.product);

                return (
                    <div key={productId} className="cart-item">

                        <div
                            className={`check-circle ${selectedItems.includes(productId)
                                    ? "checked"
                                    : ""
                                }`}
                            onClick={() => toggleSelect(productId)}
                        ></div>

                        {/* IMAGE */}
                        <img
                            src={getImageUrl(item.product?.image)}
                            alt={item.product?.name || "Sản phẩm"}
                        />

                        <div className="item-info">

                            <h4>{item.product?.name || "Chưa có tên"}</h4>

                            <div className="price-box">
                                <span className="new-price">
                                    {finalPrice.toLocaleString()}đ
                                </span>

                                {item.product?.discount > 0 && (
                                    <span className="old-price">
                                        {item.product.originalPrice.toLocaleString()}đ
                                    </span>
                                )}
                            </div>

                            <div className="qty">
                                <button onClick={() => decreaseQty(item)}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => increaseQty(item)}>+</button>
                            </div>

                        </div>

                        <button
                            className="delete-btn"
                            onClick={() => removeItem(productId)}
                        >
                            🗑
                        </button>

                    </div>
                );
            })}

            {/* BOTTOM */}
            {cart.length > 0 && (
                <div className="bottom-bar">
                    <div className="temp">
                        Tạm tính: {total.toLocaleString()}đ
                    </div>
                    <button
                        className="buy-now-btn"
                        disabled={selectedProducts.length === 0}
                        onClick={handleCheckout}
                    >
                        Mua ngay ({selectedProducts.length})
                    </button>
</div>
            )}

        </div>
    );
}

export default CartPage;