import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ComingSoon.css";
import { useNavigate } from "react-router-dom";

function ComingSoon() {
  const navigate = useNavigate();

  const location = useLocation();
  const banner = location.state?.banner;
  if (!banner) {
  return (
    <div className="coming-container">
      <h2>Không có dữ liệu banner 😢</h2>
    </div>
  );
}
const formatNumber = (n) => String(n).padStart(2, "0");
  const [timeLeft, setTimeLeft] = useState("");
const API_BASE = "http://localhost:5000";
const getImageUrl = (img) => {
  if (!img) return "/placeholder.png";

  if (Array.isArray(img)) {
    if (img.length === 0) return "/placeholder.png";
    img = img[0];
  }

  if (img.startsWith("http")) return img;

  return `${API_BASE}/uploads/${img}`;
};

  // 🔥 lấy từ banner
const launchDate = banner?.launchDate
  ? new Date(banner.launchDate)
  : null;

  useEffect(() => {
  if (!launchDate) return;

  const interval = setInterval(() => {
    const now = new Date();
    const diff = launchDate - now;

   if (diff <= 0) {
  setTimeLeft("Đã ra mắt 🚀");

  setTimeout(() => {
    if (banner.productId) {
      navigate(`/product/${banner.productId}`);
    }
  }, 2000);

  clearInterval(interval);
  return;
}

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setTimeLeft(
  `${format(days)}d ${format(hours)}h ${format(minutes)}m ${format(seconds)}s`
);
  }, 1000);

  return () => clearInterval(interval);
}, [launchDate]);

return (
  <div className="coming-container">

    <div className="coming-card">

      <h1 className="coming-title">🚀 Sản phẩm sắp ra mắt</h1>

      {/* ẢNH CHÍNH */}
      {banner?.image && (
        <img
          src={getImageUrl(banner.image)}
          alt="coming"
          className="coming-main-img"
        />
      )}

      {/* TITLE */}
      <h2 className="coming-product-title">
        {banner?.title || "Siêu phẩm mới"}
      </h2>

      {/* GALLERY */}
      <div className="coming-gallery">
        {banner?.images?.map((img, i) => (
<img key={i} src={getImageUrl(img)} alt="preview" />
        ))}
      </div>

      {/* DESCRIPTION */}
      <p className="coming-description">
        {banner?.description ||
          "Hãy chờ đón sản phẩm công nghệ đỉnh cao sắp ra mắt!"}
      </p>

      {/* TIME */}
      <p className="coming-time">{timeLeft}</p>

    </div>
  </div>
);
}

export default ComingSoon;