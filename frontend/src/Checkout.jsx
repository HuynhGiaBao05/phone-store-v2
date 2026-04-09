import { useEffect, useState } from "react";
import axios from "axios";
import "./Checkout.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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
const phoneRegex = /^0[0-9]{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;

    const [paymentMethod, setPaymentMethod] = useState("COD");
    const token = localStorage.getItem("token");

    const [deliveryMethod, setDeliveryMethod] = useState("");
    const [storeAddress, setStoreAddress] = useState("");
const [loading, setLoading] = useState(false);

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

  // 🔥 FIX ARRAY
  if (Array.isArray(img)) {
    img = img[0];
  }

  if (typeof img !== "string") return "/placeholder.png";

  return img.startsWith("http")
    ? img
    : `${API_BASE}/uploads/${img}`;
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

    if (!customer.name.trim()) {
        toast.error("Vui lòng nhập họ tên");
        return;
    }

if (!nameRegex.test(customer.name.trim())) {
  toast.error("Tên không hợp lệ (chỉ chứa chữ)");
  return;
}
    if (!customer.phone.trim()) {
        toast.error("Vui lòng nhập số điện thoại");
        return;
    }

    if (!phoneRegex.test(customer.phone.trim())) {
        toast.error("Số điện thoại không hợp lệ");
        return;
    }

    if (customer.email && !emailRegex.test(customer.email.trim())) {
        toast.error("Email không hợp lệ");
        return;
    }

    if (!deliveryMethod) {
        toast.error("Vui lòng chọn phương thức nhận hàng");
        return;
    }

    if (deliveryMethod === "DELIVERY" && !customer.address.trim()) {
        toast.error("Vui lòng nhập địa chỉ giao hàng");
        return;
    }

    if (deliveryMethod === "STORE" && !storeAddress) {
        toast.error("Vui lòng chọn cửa hàng");
        return;
    }

    setStep(2);
window.scrollTo({ top: 0, behavior: "smooth" });
};
const navigate = useNavigate();
    // ====================================================
    // PAYMENT
// ====================================================
 
const handlePayment = async () => {

  if (loading) return; // ❗ chặn spam
  setLoading(true);

  if (!token) {
    toast.error("Bạn chưa đăng nhập");
    navigate("/login");
    setLoading(false);
    return;
  }
  if (!deliveryMethod) {
  toast.error("Chưa chọn phương thức nhận hàng");
  setLoading(false);
  return;
}
if (customer.email && !emailRegex.test(customer.email.trim())) {
  toast.error("Email không hợp lệ");
  setLoading(false);
  return;
}
if (!nameRegex.test(customer.name.trim())) {
  toast.error("Tên không hợp lệ");
  setLoading(false);
  return;
}

if (!phoneRegex.test(customer.phone.trim())) {
  toast.error("Số điện thoại không hợp lệ");
  setLoading(false);
  return;
}
if (deliveryMethod === "DELIVERY" && !customer.address) {
  toast.error("Thiếu địa chỉ");
  setLoading(false);
  return;
}

if (deliveryMethod === "STORE" && !storeAddress) {
  toast.error("Chưa chọn cửa hàng");
  setLoading(false);
  return;
}
if (!customer.name.trim() || !customer.phone.trim()) {
  toast.error("Thiếu thông tin khách hàng");
  setLoading(false);
  return;
}
  try {
    const formattedItems = cart.map((item) => ({
      product: item.product?._id || item.product,
      quantity: item.quantity
    }));

    const orderData = {
  items: formattedItems,
  shippingInfo: {
    phone: customer.phone.trim(),
    address:
      deliveryMethod === "DELIVERY"
        ? customer.address.trim()
        : storeAddress
  },
  paymentMethod,
  deliveryMethod: deliveryMethod === "DELIVERY" ? "DELIVERY" : "STORE"
};
    // 🔥 tạo order trước
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

    // =============================
    // 🔥 MOMO
    // =============================
    if (paymentMethod === "MOMO") {
        toast.loading("Đang chuyển đến MoMo...");
      const momoRes = await axios.post(
        `${API_BASE}/api/momo/payment`,
        {
          amount: total,
          orderInfo: `Thanh toán đơn ${res.data.order._id}`
        }
      );
      toast.dismiss();

      if (momoRes.data.payUrl) {
        window.location.href = momoRes.data.payUrl;
      } else {
        toast.error("Không lấy được link MoMo");
      }

      return; // 🔥 dừng tại đây
    }

    // =============================
    // 🔥 COD
    // =============================
    if (paymentMethod === "COD") {
      await axios.put(
        `${API_BASE}/api/cart/remove-selected`,
        { items: formattedItems },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success("🎉 Đặt hàng thành công!");

setTimeout(() => {
  sessionStorage.removeItem("checkoutItems");
  navigate("/cart");
}, 2000); // ⏱ delay 2 giây
    }

  } catch (error) {
    console.log("Payment error:", error?.response?.data || error.message);
    console.log("MOMO ERROR:", error.response?.data);
    toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi thanh toán");
  } finally {
  setLoading(false); // ❗ luôn reset
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
                                <img
  src={getImageUrl(product.image) || "/placeholder.png"}
  alt={product.name}
/>

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
                                onChange={(e) => {
  const value = e.target.value.replace(/[^a-zA-ZÀ-ỹ\s]/g, "");
  setCustomer({ ...customer, name: value });
}}
                            />
                            <input
                        placeholder="Số điện thoại"
                        value={customer.phone}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // 🔥 chỉ cho số
                            setCustomer({ ...customer, phone: value });
                        }}
                        />
                            <input
                                placeholder="Email"
                                value={customer.email}
                                onChange={(e) =>
                                    setCustomer({ ...customer, email: e.target.value.replace(/^\s+/, "") })
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
                                    setCustomer({ ...customer, address: e.target.value.replace(/^\s+/, "") })
                                }
                            />
                        )}

                        <div className="checkout-summary">
                            <span>Tổng tiền:</span>
                            <span className="price">{total.toLocaleString()}đ</span>
                        </div>

                        <button
  className="primary-btn"
  onClick={handleNext}
>
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
    checked={paymentMethod === "MOMO"}
    onChange={() => setPaymentMethod("MOMO")}
  />
  Thanh toán MoMo
</label>
                            <label>
                                <input
                                    type="radio"
                                    checked={paymentMethod === "COD"}
                                    onChange={() => setPaymentMethod("COD")}
                                />
                                Thanh toán khi nhận hàng
                            </label>

                            
                        </div>

                        <div className="checkout-summary">
                            <span>Tổng tiền:</span>
                            <span className="price">{total.toLocaleString()}đ</span>
                        </div>

                        <button
  className="primary-btn"
  onClick={handlePayment}
  disabled={loading}
>
  {loading ? "Đang xử lý..." : "Thanh toán"}
</button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Checkout;
