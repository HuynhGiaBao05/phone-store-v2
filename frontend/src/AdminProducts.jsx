import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminProducts.css";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

function AdminProducts() {

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [sortPrice, setSortPrice] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [preview, setPreview] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 5;
    const [existingImages, setExistingImages] = useState([]);

    const [newProduct, setNewProduct] = useState({
        name: "",
        category: "",
        brand: "",
        originalPrice: "",
        discount: "",
        stock: "",
        description: "",
        promotion: "",
        promoEndDate: "",
        images: []
    });

    // ================= FETCH =================

    const fetchProducts = async () => {
        const res = await axios.get("http://localhost:5000/api/products?limit=100");
        setProducts(res.data.products || res.data);
    };

    const fetchCategories = async () => {
        const res = await axios.get("http://localhost:5000/api/categories");
        setCategories(res.data);
    };

    const fetchBrands = async () => {
        const res = await axios.get("http://localhost:5000/api/brands");
        setBrands(res.data);
    };
useEffect(() => {
  return () => {
    preview.forEach(url => URL.revokeObjectURL(url));
  };
}, [preview]);
    useEffect(() => {
    const loadData = async () => {
        await fetchProducts();
        await fetchCategories();
        await fetchBrands();
    };

    loadData();

    // 🔥 THÊM ĐOẠN NÀY
    const interval = setInterval(() => {
        fetchProducts();
    }, 5000); // 5s

    return () => clearInterval(interval);

}, []);

    // ================= FILTER =================

    let filteredProducts = [...products];

    if (selectedCategory !== "all") {
        filteredProducts = filteredProducts.filter(
            (p) => (p.category?._id || p.category) === selectedCategory
        );
    }

    filteredProducts = filteredProducts.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (sortPrice === "asc") {
        filteredProducts.sort((a, b) => (a.originalPrice || 0) - (b.originalPrice || 0));
    }

    if (sortPrice === "desc") {
        filteredProducts.sort((a, b) => (b.originalPrice || 0) - (a.originalPrice || 0));
    }

    // ================= PAGINATION =================

    const indexOfLast = currentPage * productsPerPage;
    const indexOfFirst = indexOfLast - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
// ================= DELETE =================

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa?")) return;
await axios.delete(`http://localhost:5000/api/products/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        fetchProducts();
    };

    // ================= SAVE =================

    const handleSave = async () => {
        try {
            if (!newProduct.name || !newProduct.category || !newProduct.brand) {
                toast.error("Vui lòng nhập đầy đủ Tên, Danh mục và Thương hiệu!");
                return;
            }
         const formData = new FormData();

if (!editingProduct && existingImages.length + newProduct.images.length < 3) {
  toast.error("Phải chọn ít nhất 3 ảnh!");
  return;
}

existingImages.forEach(img => {
  const filename = img.includes("/uploads/")
    ? img.split("/uploads/")[1]
    : img;

  formData.append("existingImages", filename);
});
            formData.append("name", newProduct.name);
            formData.append("category", newProduct.category);
            formData.append("brand", newProduct.brand);
            formData.append("originalPrice", Number(newProduct.originalPrice));
            formData.append("discount", Number(newProduct.discount || 0));
            formData.append("stock", Number(newProduct.stock || 0));
            formData.append("description", newProduct.description || "");
            formData.append("promotion", newProduct.promotion || "");
            if (newProduct.promoEndDate) formData.append("promoEndDate", newProduct.promoEndDate);
            newProduct.images.forEach(img => {
    if (img instanceof File) {
        formData.append("images", img); // 🔥 chỉ gửi file mới
    }
});
            if (editingProduct) {
                await axios.put(
                    `http://localhost:5000/api/products/${editingProduct._id}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );
            } else {
                await axios.post(
                    "http://localhost:5000/api/products/create",
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );
            }

            toast.success("Lưu sản phẩm thành công!");
            setShowModal(false);
            setEditingProduct(null);
            fetchProducts();
            setNewProduct({
  name: "",
  category: "",
  brand: "",
  originalPrice: "",
  discount: "",
  stock: "",
  description: "",
  promotion: "",
  promoEndDate: "",
  images: []
});
        } catch (error) {
            console.log("🔥 ERROR:", error.response?.data || error);
            alert(error.response?.data?.message || "Lỗi khi lưu sản phẩm!");
        }
    };

    // ================= IMAGE =================

   const handleImageChange = (e) => {
  const files = Array.from(e.target.files);

  // 🔥 chỉ append file mới
  setNewProduct(prev => ({
    ...prev,
    images: [...prev.images, ...files]
  }));

    const newPreview = files.map(file => URL.createObjectURL(file));

setPreview(prev => [...prev, ...newPreview]);

};

    return (
        <div className="admin-products">

            <h2 className="page-title">Quản lý sản phẩm</h2>

            {/* FILTER */}
<div className="filter-bar">
                <input
                    placeholder="🔍 Tìm sản phẩm..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                />

                <select
                    value={selectedCategory}
                    onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="all">Tất cả</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>

                <select
                    value={sortPrice}
                    onChange={(e) => {
                        setSortPrice(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">Sắp xếp giá</option>
                    <option value="asc">Giá tăng ↑</option>
                    <option value="desc">Giá giảm ↓</option>
                </select>

                <button className="btn-primary" onClick={() => {
                    setEditingProduct(null);
                    setPreview([]);
                    setNewProduct({
                        name: "",
                        category: "",
                        brand: "",
                        originalPrice: "",
                        discount: "",
                        stock: "",
                        description: "",
                        promotion: "",
                        promoEndDate: "",
                        images: []
                    });
                    setExistingImages([]); 
                    setShowModal(true);
                }}>
                    + Thêm sản phẩm
                </button>
            </div>

            {/* TABLE */}
            <div className="table-card">
                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên</th>
                            <th>Giá</th>
                            <th>Tồn kho</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
<tbody>
                        {currentProducts.map((p) => {
                            console.log("IMAGE:", p.images);
                            const finalPrice =
                                p.discount > 0
                                    ? p.originalPrice * (1 - p.discount / 100)
                                    : p.originalPrice;

                            return (
                               <tr key={p._id}>
  <td>
    {p.images?.[0] && (
  <img src={p.images[0]} className="product-img" alt="" />
)}
  </td>

  <td>{p.name}</td>
<td>
{p.discount > 0 && (
                                            <span className="old-price">
                                                {p.originalPrice?.toLocaleString()} ₫
                                            </span>
                                        )}
                                        <span className="price">
                                            {finalPrice?.toLocaleString()} ₫
                                        </span>
                                        {p.discount > 0 && (
                                            <span className="discount">-{p.discount}%</span>
                                        )}
                                    </td>
                                    <td>{p.stock}</td>
                                    <td className="actions">
                                        <button className="btn-edit" onClick={() => {
                                            setEditingProduct(p);
                                            setExistingImages(p.images || []);

                                    setPreview(
                                    (p.images || []).map(img =>
                                        img.startsWith("http")
                                        ? img
                                        : `http://localhost:5000/${img}`
                                    )
                                    );

                                    setNewProduct({
                                       name: p.name || "",
                                                category:
                                            p.category && typeof p.category === "object"
                                                ? p.category._id
                                                : p.category || "",
                                                  brand:
                                            p.brand && typeof p.brand === "object"
                                                ? p.brand._id
                                                : p.brand || "",
                                                originalPrice: p.originalPrice || "",
                                                discount: p.discount || "",
                                                stock: p.stock || "",
                                                description: p.description || "",
                                                promotion: p.promotion || "",
                                                promoEndDate: p.promoEndDate
                                                    ? p.promoEndDate.slice(0, 16)
                                                    : "",
                                                 images: []                                          });
setShowModal(true);
                                        }}>
                                            Sửa
                                        </button>

                                        <button className="btn-delete" onClick={() => handleDelete(p._id)}>
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="pagination">
                    <button disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}>←</button>

                    <span>{currentPage}</span>
<button disabled={currentPage >= totalPages}
onClick={() => setCurrentPage(currentPage + 1)}>→</button>
                </div>
            </div>

            {showModal &&
                createPortal(
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                            <h3>{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>

                            <div className="product-form-grid">

                                <input className="field-name"
                                    placeholder="Tên sản phẩm"
                                    value={newProduct.name}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, name: e.target.value })
                                    }
                                />

                                <select className="field-category"
                                    value={newProduct.category}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, category: e.target.value })
                                    }
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>

                                <select className="field-brand"
                                    value={newProduct.brand}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, brand: e.target.value })
                                    }
                                >
                                    <option value="">Chọn thương hiệu</option>
                                    {brands.map((b) => (
<option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>

                                <input className="field-price"
                                    type="number"
                                    placeholder="Giá gốc"
                                    value={newProduct.originalPrice}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, originalPrice: e.target.value })
                                    }
                                />

                                <input className="field-discount"
                                    type="number"
                                    placeholder="Giảm giá (%)"
value={newProduct.discount}
                                    onChange={(e) =>
setNewProduct({ ...newProduct, discount: e.target.value })
                                    }
                                />

                                {Number(newProduct.discount) > 0 && (
                                    <input className="field-date"
                                        type="datetime-local"
                                        value={newProduct.promoEndDate}
                                        onChange={(e) =>
                                            setNewProduct({ ...newProduct, promoEndDate: e.target.value })
                                        }
                                    />
                                )}

                                <input className="field-stock"
                                    type="number"
                                    placeholder="Tồn kho"
                                    value={newProduct.stock}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, stock: e.target.value })
                                    }
                                />

                               <div className="field-image">
  <input type="file" multiple onChange={handleImageChange} />

  <div style={{ display: "flex", gap: 10 }}>
    {preview.map((img, i) => (
<div key={i} className="img-wrapper">
  <img src={img} className="preview-img" />

  <button
    className="remove-btn"
    onClick={() => {
      setPreview(preview.filter((_, index) => index !== i));

      setNewProduct(prev => ({
        ...prev,
        images: prev.images.filter((_, index) => index !== i)
      }));
    }}
  >
    ×
  </button>
</div>
    ))}
  </div>
</div>

                            </div>

                            <textarea
                                placeholder="Mô tả sản phẩm"
                                value={newProduct.description}
                                onChange={(e) =>
                                    setNewProduct({ ...newProduct, description: e.target.value })
                                }
                            />

                            <textarea
placeholder="Nội dung khuyến mãi"
                                value={newProduct.promotion}
                                onChange={(e) =>
                                    setNewProduct({ ...newProduct, promotion: e.target.value })
                                }
                            />


                            <div className="modal-actions">
                                <button className="btn-primary" onClick={handleSave}>Lưu</button>
                                <button className="btn-delete" onClick={() => setShowModal(false)}>Hủy</button>
                            </div>

                        </div>
                    </div>,
                    document.body
                )
            }

        </div>
    );
}

export default AdminProducts;