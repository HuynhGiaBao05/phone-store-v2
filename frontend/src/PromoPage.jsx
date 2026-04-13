import { useParams } from "react-router-dom";

function PromoPage() {
  const { slug } = useParams();

  // 🔥 demo nội dung theo slug
  if (slug === "macbook-neo") {
    return (
      <div style={{ padding: 40 }}>
        <h1>🔥 MacBook Neo</h1>
        <p>Sắp ra mắt với chip M5 siêu mạnh 🚀</p>
        <img src="/banner-mac.jpg" width="400" />
      </div>
    );
  }

  return <div>Không tìm thấy trang</div>;
}

export default PromoPage;