import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductDetail.css";

function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const [loginMessage, setLoginMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    // ✅ THÊM CHECK HẾT HÀNG
    const isOutOfStock = product?.stock <= 0;

    useEffect(() => {
        axios
            .get(`http://localhost:5000/api/products/${id}`)
            .then((res) => {
                setProduct(res.data);
                setSelectedImage(res.data.image);
            })
            .catch((err) => {
                if (err.response?.status === 404) {
                    setErrorMessage("Sản phẩm không tồn tại");
                } else {
                    setErrorMessage("Lỗi khi tải sản phẩm");
                }
            });
    }, [id]);

    useEffect(() => {
        if (loginMessage) {
            const timer = setTimeout(() => setLoginMessage(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [loginMessage]);

    // ================= COUNTDOWN =================
    useEffect(() => {
        if (!product?.promoEndDate) return;

        const end = new Date(product.promoEndDate);

        const interval = setInterval(() => {
            const now = new Date();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("00:00:00");
                clearInterval(interval);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, "0")}:` +
                `${minutes.toString().padStart(2, "0")}:` +
                `${seconds.toString().padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [product?.promoEndDate]);

    if (errorMessage) return <div>{errorMessage}</div>;
    if (!product) return <div>Đang tải...</div>;

    let endDateText = "";
    if (product?.promoEndDate) {
        const end = new Date(product.promoEndDate);
        endDateText =
            end.getHours().toString().padStart(2, "0") + ":" +
            end.getMinutes().toString().padStart(2, "0") + " " +
            end.toLocaleDateString("vi-VN") +
            " · TP.HCM";
    }

    // ================= ADD TO CART =================
    const handleAddToCart = async () => {

        // ❌ HẾT HÀNG
        if (isOutOfStock) {
            setErrorMessage("❌ Sản phẩm đã hết hàng");
return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            setLoginMessage("Vui lòng đăng nhập để thêm vào giỏ hàng");
            return;
        }

        try {
            await axios.post(
                "http://localhost:5000/api/cart/add",
                { productId: product._id, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            window.dispatchEvent(new Event("cartUpdated"));
            alert("Đã thêm vào giỏ hàng 🛒");

        } catch (err) {
            console.log(err);
        }
    };

    const handleBuyNow = async () => {

        // ❌ HẾT HÀNG
        if (isOutOfStock) {
            setErrorMessage("❌ Sản phẩm đã hết hàng");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            setLoginMessage("Vui lòng đăng nhập để mua sản phẩm");
            return;
        }

        await handleAddToCart();
        navigate("/cart");
    };

    return (
        <div className="product-detail-page">
            <div className="detail-container">

                {/* LEFT */}
                <div className="detail-left">
                    <div className="main-image">
                        <img src={selectedImage} alt={product.name} />
                    </div>

                    <div className="thumbnail-row">
                        {[product.image, product.image, product.image].map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt=""
                                className={selectedImage === img ? "active" : ""}
                                onClick={() => setSelectedImage(img)}
                            />
                        ))}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="detail-right">

                    <h1 className="product-title">{product.name}</h1>

                    {/* ✅ THÔNG BÁO HẾT HÀNG */}
                    {isOutOfStock && (
                        <div style={{ color: "red", fontWeight: "bold", marginBottom: 10 }}>
                            ❌ Sản phẩm đã hết hàng
                        </div>
                    )}

                    {product.isExpiringSoon && (
                        <div className="expiring-badge">🔥 Sắp hết giờ</div>
                    )}

                    <div className="price-highlight-box">

                        <div className="price-left">

                            {product.discount > 0 ? (
                                <>
                                    <span className="price-label">Online Giá Rẻ Quá</span>

                                    <span className="new-price">
{product.price?.toLocaleString()}đ
                                    </span>

                                    <span className="old-price">
                                        {product.originalPrice?.toLocaleString()}đ
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="price-label">Giá sản phẩm</span>

                                    <span className="new-price">
                                        {product.originalPrice?.toLocaleString()}đ
                                    </span>
                                </>
                            )}

                            <span className="vat-note">Giá đã bao gồm VAT</span>
                        </div>

                        {product.discount > 0 && (
                            <div className="price-right">
                                <div className="countdown-label">Kết thúc sau:</div>
                                <div className="countdown-time">{timeLeft}</div>
                                <div className="countdown-date">{endDateText}</div>
                            </div>
                        )}

                    </div>

                    <div className="button-group">

                        <button
                            className="installment"
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                        >
                            🛒 Thêm vào giỏ
                        </button>

                        <button
                            className="buy-now"
                            onClick={handleBuyNow}
                            disabled={isOutOfStock}
                        >
                            MUA NGAY {product.discount > 0
                                ? product.price?.toLocaleString()
                                : product.originalPrice?.toLocaleString()}đ
                        </button>
                    </div>

                    <div className="product-description">
                        <h3>Mô tả sản phẩm</h3>
                        <p>{product.description}</p>
                    </div>
                    
                </div>

            </div>
        </div>
    );
}

export default ProductDetail;