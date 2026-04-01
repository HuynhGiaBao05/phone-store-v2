import { useEffect, useState } from "react";
import axios from "axios";
import "./Checkout.css";

function Checkout() {
    const [step, setStep] = useState(1);

    const [cart] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem("checkoutItems")) || [];
        } catch {
            return [];
        }
    });

    const [stores, setStores] = useState([]);

    const [customer, setCustomer] = useState({
        name: "",
        phone: "",
        email: "",
        address: ""
    });

    const [paymentMethod, setPaymentMethod] = useState("COD");
    const token = localStorage.getItem("token");

    const [deliveryMethod, setDeliveryMethod] = useState("STORE");
    const [storeAddress, setStoreAddress] = useState("");

    const API_BASE = "http://localhost:5000";

    // ====================================================
    // FIXED PRICE (discount % + originalPrice)
    // ====================================================
    const getPrice = (product) => {
        if (!product) return 0;

        const originalPrice = Number(product.originalPrice || 0);
        const discount = Number(product.discount || 0);

        if (discount > 0 && discount <= 100) {
            return originalPrice - (originalPrice * discount) / 100;
        }

        return originalPrice;
    };

    const getImageUrl = (img) => {
        if (!img) return "/placeholder.png";
        return img.startsWith("http") ? img : `${API_BASE}/uploads/${img}`;
    };

    // ====================================================
    // LOAD STORES
    // ====================================================
    useEffect(() => {
        const loadStores = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/stores`);
                setStores(res.data);
            } catch (err) {
                console.log(err);
            }
        };

        loadStores();
    }, []);

    // ====================================================
    // TOTAL FIXED
    // ====================================================
    const total = cart.reduce((sum, item) => {
        const price = getPrice(item.product);
        return sum + price * item.quantity;
    }, 0);

    // ====================================================
    // NEXT STEP
    // ====================================================
    const handleNext = () => {
        if (!customer.name || !customer.phone) {
            alert("Vui lòng nhập đủ thông tin");
            return;
        }
        if (deliveryMethod === "DELIVERY" && !customer.address) {
            alert("Vui lòng nhập địa chỉ giao hàng");
            return;
        }
        if (deliveryMethod === "STORE" && !storeAddress) {
            alert("Vui lòng chọn cửa hàng");
            return;
        }
        setStep(2);
    };

    // ====================================================
    // PAYMENT
// ====================================================
    const handlePayment = async () => {
        try {
            const formattedItems = cart.map((item) => ({
                product: item.product?._id || item.product,
                quantity: item.quantity
            }));

            const orderData = {
  items: formattedItems,

  // 🔥 FIX QUAN TRỌNG
  shippingInfo: {
    phone: customer.phone,
    address:
      deliveryMethod === "DELIVERY"
        ? customer.address
        : storeAddress
  },

  paymentMethod,
  deliveryMethod
};

            const res = await axios.post(
                `${API_BASE}/api/orders`,
                orderData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log("ORDER OK:", res.data);

            alert("🎉 Thanh toán thành công!");
            sessionStorage.removeItem("checkoutItems");
            window.location.href = "/";
        } catch (error) {
            console.log("Payment error:", error?.response?.data || error.message);
            alert(error?.response?.data?.message || "Có lỗi xảy ra khi thanh toán");
        }
    };

    return (
        <div className="checkout-page">
            <div className="checkout-wrapper">

                <div className="checkout-steps">
                    <div className={step === 1 ? "active" : ""}>1. THÔNG TIN</div>
                    <div className={step === 2 ? "active" : ""}>2. THANH TOÁN</div>
                </div>

                {/* CART */}
                <div className="checkout-card">
                    {cart.map((item) => {
                        const product = item.product;
                        const finalPrice = getPrice(product);

                        return (
                            <div key={product._id} className="product-row">
                                <img src={getImageUrl(product.image)} alt={product.name} />

                                <div className="product-info">
                                    <h4>{product.name}</h4>

                                    <p>
                                        {finalPrice.toLocaleString()}đ

                                        {product.discount > 0 && (
                                            <span className="old-price">
                                                {product.originalPrice.toLocaleString()}đ
                                            </span>
                                        )}
                                    </p>

                                    <span>Số lượng: {item.quantity}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* STEP 1 */}
                {step === 1 && (
<div className="checkout-card">
                        <h3>Thông tin khách hàng</h3>

                        <div className="input-group">
                            <input
                                placeholder="Họ và tên"
                                value={customer.name}
                                onChange={(e) =>
                                    setCustomer({ ...customer, name: e.target.value })
                                }
                            />
                            <input
                                placeholder="Số điện thoại"
                                value={customer.phone}
                                onChange={(e) =>
                                    setCustomer({ ...customer, phone: e.target.value })
                                }
                            />
                            <input
                                placeholder="Email"
                                value={customer.email}
                                onChange={(e) =>
                                    setCustomer({ ...customer, email: e.target.value })
                                }
                            />
                        </div>

                        <div className="delivery-method">
                            <label>
                                <input
                                    type="radio"
                                    checked={deliveryMethod === "STORE"}
                                    onChange={() => setDeliveryMethod("STORE")}
                                />
                                Nhận tại cửa hàng
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    checked={deliveryMethod === "DELIVERY"}
                                    onChange={() => setDeliveryMethod("DELIVERY")}
                                />
                                Giao hàng tận nơi
                            </label>
                        </div>

                        {deliveryMethod === "STORE" && (
                            <div className="store-select">
                                <select
                                    value={storeAddress}
                                    onChange={(e) => setStoreAddress(e.target.value)}
                                >
                                    <option value="">Chọn cửa hàng</option>
                                    {stores.map((store) => (
                                        <option key={store._id} value={store.address}>
                                            {store.address}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
{deliveryMethod === "DELIVERY" && (
                            <input
                                className="full-address"
                                placeholder="Địa chỉ nhận hàng"
                                value={customer.address}
                                onChange={(e) =>
                                    setCustomer({ ...customer, address: e.target.value })
                                }
                            />
                        )}

                        <div className="checkout-summary">
                            <span>Tổng tiền:</span>
                            <span className="price">{total.toLocaleString()}đ</span>
                        </div>

                        <button className="primary-btn" onClick={handleNext}>
                            Tiếp tục
                        </button>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="checkout-card">
                        <h3>Phương thức thanh toán</h3>

                        <div className="payment-method">
                            <label>
                                <input
                                    type="radio"
                                    checked={paymentMethod === "COD"}
                                    onChange={() => setPaymentMethod("COD")}
                                />
                                Thanh toán khi nhận hàng
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    checked={paymentMethod === "BANK"}
                                    onChange={() => setPaymentMethod("BANK")}
                                />
                                Chuyển khoản ngân hàng
                            </label>
                        </div>

                        <div className="checkout-summary">
                            <span>Tổng tiền:</span>
                            <span className="price">{total.toLocaleString()}đ</span>
                        </div>

                        <button className="primary-btn" onClick={handlePayment}>
                            Thanh toán
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Checkout;
