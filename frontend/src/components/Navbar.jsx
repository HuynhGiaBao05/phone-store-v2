import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";
import { FaUserCircle } from "react-icons/fa";

function Navbar() {

    const [categories, setCategories] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [open, setOpen] = useState(false);

    const [cartCount, setCartCount] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const API_BASE = "http://localhost:5000";

    // ================= LOAD CATEGORY =================
    useEffect(() => {
        axios
            .get(`${API_BASE}/api/categories`)
            .then((res) => setCategories(res.data))
            .catch((err) => console.log(err));
    }, []);

    // ================= CART COUNT =================
    const fetchCartCount = async () => {
        if (!token) return;

        try {
            const res = await axios.get(`${API_BASE}/api/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const items = res.data.items || [];

            const totalQty = items.reduce(
                (sum, item) => sum + item.quantity,
                0
            );

            setCartCount(totalQty);

        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchCartCount();

        const handleUpdate = () => fetchCartCount();
        window.addEventListener("cartUpdated", handleUpdate);

        return () => window.removeEventListener("cartUpdated", handleUpdate);
    }, []);

    // ================= LOGO CLICK =================
    const handleLogoClick = (e) => {
        if (location.pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // ================= CART =================
    const handleCartClick = () => {
        if (!token || role !== "USER") {
            setShowLoginModal(true);
            return;
        }
        navigate("/cart");
    };

    // ================= LOGOUT =================
    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    // ================= SEARCH =================
    useEffect(() => {

        const delay = setTimeout(async () => {

            const keyword = searchTerm.trim().toLowerCase();

            if (!keyword) {
                setResults([]);
                return;
            }

            try {
                setLoading(true);
const res = await axios.get(
                    `${API_BASE}/api/products/search`,
                    { params: { q: keyword } }
                );

                setResults(res.data || []);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }

        }, 400);

        return () => clearTimeout(delay);

    }, [searchTerm]);

    return (
        <>
            <header className="navbar">

                <div className="nav-inner">

                    {/* LOGO */}
                    <Link to="/" className="logo" onClick={handleLogoClick}>
                        BaoPhone
                    </Link>

                    {/* CATEGORY */}
                    <nav>
                        {categories.map((c) => (
                            <Link
                                key={c._id}
                                to={`/category/${c.slug}`}
                                className="nav-link"
                            >
                                {c.name}
                            </Link>
                        ))}
                    </nav>

                    {/* ICONS */}
                    <div className="icons">

                        {/* SEARCH */}
                        <span
                            className="icon-btn"
                            onClick={() => setShowSearch(true)}
                        >
                            🔍
                        </span>

                        {/* CART */}
                        <span
                            className="icon-btn cart-icon"
                            onClick={handleCartClick}
                        >
                            🛒
                            {cartCount > 0 && (
                                <span className="cart-badge">
                                    {cartCount}
                                </span>
                            )}
                        </span>

                        {/* USER */}
                        {token && role === "USER" ? (

                            <div className="user-menu">

                                <FaUserCircle
                                    size={28}
                                    className="user-icon"
                                    onClick={() => setOpen(!open)}
                                />

                                {open && (
                                    <div className="dropdown">

                                        <p onClick={() => navigate("/profile")}>
                                            Thông tin cá nhân
                                        </p>

                                        <p onClick={() => navigate("/orders")}>
                                            Đơn hàng của tôi
                                        </p>

                                        <p onClick={handleLogout}>
Đăng xuất
                                        </p>

                                    </div>
                                )}

                            </div>

                        ) : (
                            <span
                                className="login-link"
                                onClick={() => navigate("/login")}
                            >
                                Đăng nhập
                            </span>
                        )}

                    </div>

                </div>

            </header>

            {/* LOGIN MODAL */}
            {showLoginModal && (
                <div className="cart-login-overlay">
                    <div className="cart-login-box">

                        <h3>🔐 Yêu cầu đăng nhập</h3>
                        <p>Vui lòng đăng nhập để tiếp tục</p>

                        <div className="cart-login-buttons">

                            <button onClick={() => setShowLoginModal(false)}>
                                Trở về
                            </button>

                            <button onClick={() => navigate("/login")}>
                                Đăng nhập
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* SEARCH OVERLAY */}
            {showSearch && (
                <div className="search-overlay">

                    <div className="search-header">

                        <span>🔍</span>

                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />

                        <button
                            onClick={() => {
                                setShowSearch(false);
                                setSearchTerm("");
                                setResults([]);
                            }}
                        >
                            ✕
                        </button>

                    </div>

                    <div className="search-results">

                        {loading && <p>Đang tìm...</p>}

                        {results.length === 0 && searchTerm && !loading && (
                            <p>Không tìm thấy sản phẩm</p>
                        )}

                        {results.map((item) => (
                            <Link
                                key={item._id}
                                to={`/product/${item._id}`}
                                className="search-item"
                                onClick={() => setShowSearch(false)}
                            >

                                {/* ✅ THUMBNAIL NHỎ */}
                                <img
className="search-thumb"
                                    src={
                                        item.image?.startsWith("http")
                                            ? item.image
                                            : `${API_BASE}/uploads/${item.image}`
                                    }
                                    alt={item.name}
                                />

                                {/* INFO */}
                                <div className="search-info">

                                    <p className="search-name">
                                        {item.name}
                                    </p>

                                    <span className="search-price">
                                        {item.price?.toLocaleString()} đ
                                    </span>

                                    {/* ⭐ FEATURED */}
                                    {item.isFeatured && (
                                        <small className="search-badge">
                                            ⭐ Nổi bật
                                        </small>
                                    )}

                                </div>

                            </Link>
                        ))}

                    </div>

                </div>
            )}

        </>
    );
}

export default Navbar;