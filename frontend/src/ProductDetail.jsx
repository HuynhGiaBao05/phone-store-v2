import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductDetail.css";
import { toast } from "react-toastify";

function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const [loginMessage, setLoginMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
const getImageUrl = (img) => {
  if (!img) return "/placeholder.png";
  if (typeof img === "string" && img.startsWith("http")) return img;
  return `http://localhost:5000/uploads/${img}`;
};
    // ✅ THÊM CHECK HẾT HÀNG
    const isOutOfStock = product?.stock <= 0;

    useEffect(() => {
        axios
            .get(`http://localhost:5000/api/products/${id}`)
            .then((res) => {
  const product = res.data;

  // 🔥 THÊM ĐOẠN NÀY
  if (product.status === "COMING_SOON") {
    navigate(`/coming-soon/${product._id}`);
    return;
  }

  setProduct(product);
  setSelectedImage(product.images?.[0] || "/placeholder.png");
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

  // 🔥 FIX CHÍNH Ở ĐÂY
  setProduct(prev => ({
    ...prev,
    discount: 0,
    price: prev.originalPrice,
    isExpiringSoon: false,
    promoEndDate: null
  }));

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
  toast.warning(
    <div className="toast-login">
      <div>⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng</div>

      <button
        className="toast-login-btn"
        onClick={() =>
          navigate("/login", {
            state: {
              from: window.location.pathname
            }
          })
        }
      >
        👉 Đăng nhập
      </button>
    </div>
  );
  return;

}


        try {
            await axios.post(
                "http://localhost:5000/api/cart/add",
                { productId: product._id, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            window.dispatchEvent(new Event("cartUpdated"));
            toast.success("Đã thêm vào giỏ hàng 🛒");

        } catch (err) {
  console.log("ADD CART ERROR:", err.response?.data);
  toast.error(err.response?.data?.message || "Lỗi thêm giỏ hàng");
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
  toast.warning(
    <div className="toast-login">
      <div>⚠️ Vui lòng đăng nhập để mua hàng</div>

      <button
        className="toast-login-btn"
        onClick={() =>
          navigate("/login", {
            state: {
              from: window.location.pathname
            }
          })
        }
      >
        👉 Đăng nhập
      </button>
    </div>
  );
  return;
}



        await handleAddToCart();
        navigate("/cart");
    };
// 🔥 tính sao trung bình
const avgRating =
  product?.reviews?.length > 0
    ? (
        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      ).toFixed(1)
    : 0;
    // 🔥 tính % từng sao (THÊM ĐOẠN NÀY)
const starStats = [5,4,3,2,1].map(star => {
  const count = product?.reviews?.filter(r => r.rating === star).length || 0;

  const percent = product?.reviews?.length
    ? ((count / product.reviews.length) * 100).toFixed(1)
    : 0;

  return { star, percent };
});
    return (
        console.log("PROMOTION:", product.promotion),
        console.log("REVIEWS:", product.reviews),
        <div className="product-detail-page">
            <div className="detail-container">

                {/* LEFT */}
                <div className="detail-left">
                    <div className="main-image">
                        {selectedImage && (
 <img
  src={selectedImage}
  onError={(e) => (e.target.src = "/placeholder.png")}
  alt={product.name}
/>
)}
                    </div>
                        <div className="thumbnail-row">
{product.images?.map((img, index) => (
                                <img
                                    key={index}
                                    src={getImageUrl(img)}
                                    onError={(e) => (e.target.src = "/placeholder.png")}
                                    alt=""
                                    className={selectedImage === img ? "active" : ""}
                                    onClick={() => setSelectedImage(getImageUrl(img))}
                                />
                            ))}
                        </div>
                    {/* ================= ĐÁNH GIÁ ================= */}
<div style={{ marginTop: 40 }}>

  <h3>Đánh giá sản phẩm</h3>

  {/* ⭐ TRUNG BÌNH */}
  <div style={{ fontSize: 24, color: "orange" }}>
    ⭐ {avgRating} / 5
  </div>
{product?.reviews?.length === 0 && (
<div>Chưa có đánh giá</div>
)}

{product?.reviews?.map((r, index) => (
  <div key={index} style={{
    borderTop: "1px solid #eee",
    padding: 10
  }}>
    <b>{r.user?.name || "User"}</b>

    <div style={{ color: "orange" }}>
      {"★".repeat(r.rating)}
    </div>

    <div>{r.comment}</div>

    {/* 🔥 ẢNH */}
    <div style={{ display: "flex", gap: 10 }}>
      {r.images?.map((img, i) => (
  <img
    key={i}
    src={getImageUrl(img)}
    onError={(e) => (e.target.src = "/placeholder.png")}
    style={{ width: 60 }}
  />
))}
    </div>

    <div style={{ fontSize: 12, color: "#999" }}>
      {new Date(r.createdAt).toLocaleDateString()}
    </div>
  </div>
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
                    {/* 🔥 KHUYẾN MÃI */}
{product.promotion && (
  <div className="product-promotion">
  <h3>🎁 Khuyến mãi</h3>

  {product.promotion
    .split("\n")
    .filter(line => line.trim() !== "" && !/^\d+$/.test(line))
    .map((line, index) => (
      <div key={index}>• {line}</div>
    ))}
</div>
)}
                   
                </div>

            </div>
        </div>
    );
}

export default ProductDetail;