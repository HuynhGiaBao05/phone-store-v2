import "./App.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { formatMoney } from "./utils/formatMoney";
import { useState, useEffect } from "react";
import axios from "axios";

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [saleProducts, setSaleProducts] = useState([]);
  // ================= GET CATEGORIES =================
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
  axios
    .get("http://localhost:5000/api/products")
    .then((res) => {
      const products = res.data.products || [];

      const sale = products.filter((p) => p.discount > 0);

      setSaleProducts(sale);
    })
    .catch((err) => console.log(err));
}, []);
  // ================= GET FEATURED =================
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/orders/top-products-home")
      .then((res) => setFeaturedProducts(res.data))
      .catch((err) => console.log(err));
  }, []);

  // ================= GET PRODUCTS BY CATEGORY =================
  useEffect(() => {
    if (categories.length === 0) return;

    categories.forEach((cat) => {
            axios
        .get(`http://localhost:5000/api/products?category=${cat._id}&limit=100`)
        .then((res) => {
          setCategoryProducts((prev) => ({
            ...prev,
            [cat.slug]: res.data.products || [], 
          }));
        })
        .catch((err) => console.log(err));
    });
  }, [categories]);

  const heroSlides = ["slide1.png", "slide2.png", "slide3.png","slide4.png","slide5.png","slide6.png","slide7.png","slide8.png"];

  const API_BASE = "http://localhost:5000";

const getImageUrl = (img) => {
  if (!img) return "/placeholder.png";

  if (img.startsWith("http")) return img;

  return `${API_BASE}/uploads/${img}`;
};

  return (
    <div className="app">

      {/* ================= HERO ================= */}
      <section className="hero">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 1500 }}
          loop
        >
          {heroSlides.map((img, index) => (
            <SwiperSlide key={index}>
              <img src={img} alt="banner" />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="featured">
        <div className="section-header">
  <h2 className="section-title">⭐ SẢN PHẨM BÁN CHẠY</h2>

  <Link to="/featured" className="view-more">
  Xem tất cả →
</Link>
  
</div>
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={30}
          slidesPerView={5}
          breakpoints={{
            1024: { slidesPerView: 5 },
            768: { slidesPerView: 3 },
            0: { slidesPerView: 1 },
          }}
        >
          {featuredProducts.map((item) => (
            <SwiperSlide key={item._id}>
              <Link to={`/product/${item._id}`} className="product-card">

                {item.discount > 0 && (
                  <span className="sale-badge">
                    -{item.discount}%
                  </span>
                )}

                <img src={getImageUrl(item.image)} alt={item.name} />
                <h3>{item.name}</h3>

               <div className="price-box">
                <span className="new-price">
                  {formatMoney(item.price)} đ
                </span>

                <div className="old-price-wrapper">
                  {item.discount > 0 ? (
                    <>
                      <span className="old-price">
                        {formatMoney(item.originalPrice)} đ
                      </span>
                      <span className="discount">
                        -{item.discount}%
                      </span>
                    </>
                  ) : (
                    <span className="no-discount"></span>
                  )}
                </div>
              </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

          {/* ================= SALE ================= */}
<section className="featured">
    <div className="section-header">
        <h2 className="section-title">🔥 SẢN PHẨM KHUYẾN MÃI</h2>

        <Link to="/sale" className="view-more">
  Xem tất cả →
</Link>
    </div>

    <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={30}
        slidesPerView={5}
        breakpoints={{
            1024: { slidesPerView: 5 },
            768: { slidesPerView: 3 },
            0: { slidesPerView: 1 },
        }}
    >
        {saleProducts.map((item) => (
            <SwiperSlide key={item._id}>
                <Link to={`/product/${item._id}`} className="product-card">
                    <span className="sale-badge">-{item.discount}%</span>

                    <img src={getImageUrl(item.image)} alt={item.name} />
                    <h3>{item.name}</h3>

                    <div className="price-box">
                        <span className="new-price">
                            {formatMoney(item.price)} đ
                        </span>

                        <div className="old-price-wrapper">
                            <span className="old-price">
                                {formatMoney(item.originalPrice)} đ
                            </span>
                            <span className="discount">
                                -{item.discount}%
                            </span>
                        </div>
                    </div>
                </Link>
            </SwiperSlide>
        ))}
    </Swiper>
</section>

      {/* ================= CATEGORY SECTIONS ================= */}
      {categories.map((cat) => {
        const products = categoryProducts[cat.slug] || [];
        if (products.length === 0) return null;

        return (
          <section key={cat._id} className="category-section">
           <div className="section-header">
            <h2 className="section-title">
               {cat.name}
            </h2>

            <Link
              to={`/category/${cat.slug}`}
              className="view-more"
            >
              Xem tất cả →
            </Link>
          </div>

            <div className="product-grid">
              {products
                .sort((a, b) =>
                  new Date(b.createdAt) - new Date(a.createdAt)
                )
                .slice(0, 4)
                .map((p) => (
                  <Link
                    key={p._id}
                    to={`/product/${p._id}`}
                    className="product-card"
                  >
                    {p.discount > 0 && (
                      <span className="sale-badge">
                        -{p.discount}%
                      </span>
                    )}

                    <img src={getImageUrl(p.image)} alt={p.name} />
                    <h3>{p.name}</h3>

                    <div className="price-box">
                      <span className="new-price">
                        {p.price?.toLocaleString()} đ
                      </span>

                      {p.discount > 0 && (
                        <>
                          <span className="old-price">
                            {p.originalPrice?.toLocaleString()} đ
                          </span>
                          <span className="discount">
                            -{p.discount}%
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        );
      })}
{/* ================= ABOUT SHOP ================= */}
<section className="about-section">

  <div className="about-container">

    <div className="about-image">
      <img src="/about-phone.png" alt="BaoPhone Store" />
    </div>

    <div className="about-content">
      <h5 className="about-subtitle">VỀ BAOPHONE</h5>

      <h2 className="about-title">
        Công nghệ chính hãng – Giá tốt – Phục vụ tận tâm
      </h2>

      <p className="about-text">
        BaoPhone chuyên cung cấp iPhone, MacBook, iPad, Apple Watch
        và phụ kiện chính hãng với mức giá cạnh tranh nhất thị trường.
        Chúng tôi cam kết sản phẩm chất lượng, bảo hành rõ ràng
        và hỗ trợ khách hàng tận tâm.
      </p>

      <p className="about-text">
        Với đội ngũ tư vấn chuyên nghiệp và hệ thống bán hàng
        hiện đại, BaoPhone mang đến trải nghiệm mua sắm
        nhanh chóng – tiện lợi – an toàn.
      </p>

      <button className="about-btn">
        Tìm hiểu thêm →
      </button>

    </div>

  </div>

</section>

{/* ================= REVIEW SECTION ================= */}
<section className="review-section">

  <h2 className="review-title">
    Vì sao khách hàng chọn BảoHuỳnhStore?
  </h2>

  <div className="review-grid">

    <div className="review-card">
      <p className="review-text">
        Thiết kế hiện đại, sản phẩm chất lượng, bảo hành rõ ràng.
        Tôi rất hài lòng khi mua tại đây.
      </p>
      <div className="review-user">Uyn Nhi</div>
    </div>

    <div className="review-card">
      <p className="review-text">
        Shop uy tín, giao hàng nhanh, giá tốt hơn nhiều nơi khác.
      </p>
      <div className="review-user">Lionel Messi</div>
    </div>

    <div className="review-card">
      <p className="review-text">
        Nhân viên tư vấn nhiệt tình, hỗ trợ nhanh chóng.
      </p>
      <div className="review-user">Mai Chi</div>
    </div>
  </div>
<div className="copyright">
        <p>5ec0nd, 2024, All Right Reserved</p>
    </div>
</section>



    </div>
  );
}

export default Home;