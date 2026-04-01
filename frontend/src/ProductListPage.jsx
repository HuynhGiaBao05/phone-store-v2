import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { formatMoney } from "./utils/formatMoney";
import "./CategoryPage.css";

function ProductListPage({ type }) {
    const [products, setProducts] = useState([]);
    const [sort, setSort] = useState("newest");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const API_BASE = "http://localhost:5000";

    useEffect(() => {
        axios.get(`${API_BASE}/api/products`).then((res) => {
            let data = res.data.products || [];

            if (type === "sale") {
                data = data.filter((p) => p.discount > 0);
            }

            if (type === "featured") {
                data = data.slice(0, 20);
            }

            setProducts(data);
        });
    }, [type]);

    // SORT
    const sortedProducts = [...products].sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // PAGINATION
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentProducts = sortedProducts.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    return (
        <div className="category-page">

            {/* ===== BANNER ===== */}
            <div className="category-banner">
                <h1>
                    {type === "sale"
                        ? "SẢN PHẨM KHUYẾN MÃI"
                        : "SẢN PHẨM BÁN CHẠY"}
                </h1>
            </div>

            {/* ===== TOOLBAR ===== */}
            <div className="category-toolbar">
                <button className="filter-btn">Lọc</button>

                <div className="sort-group">
                    <span>Sắp xếp theo:</span>
                    <button onClick={() => setSort("newest")}>Mới nhất</button>
                    <button onClick={() => setSort("price-asc")}>Giá tăng</button>
                    <button onClick={() => setSort("price-desc")}>Giá giảm</button>
                </div>
            </div>

            {/* ===== GRID ===== */}
            <div className="category-grid">
                {currentProducts.map((p) => (
                    <Link
                        to={`/product/${p._id}`}
                        key={p._id}
                        className="category-card"
                    >
                        {p.discount > 0 && (
                            <span className="sale-badge">-{p.discount}%</span>
                        )}

                        <img src={p.image} alt={p.name} />
                        <h3>{p.name}</h3>

                        <div className="price-box">
                            <span className="new-price">
                                {formatMoney(p.price)} đ
</span>

                            {p.discount > 0 && (
                                <>
                                    <span className="old-price">
                                        {formatMoney(p.originalPrice)} đ
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

            {/* ===== PAGINATION ===== */}
            <div className="pagination">
                <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ←
                </button>

                <button className="active">
                    {currentPage}
                </button>

                <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    →
                </button>
            </div>
        </div>
    );
}

export default ProductListPage;
