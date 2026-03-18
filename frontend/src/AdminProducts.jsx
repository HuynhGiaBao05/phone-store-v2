import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminProducts.css";

function AdminProducts() {

  // ================= STATE =================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]); // ⭐ brand list

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortPrice, setSortPrice] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [preview, setPreview] = useState(null);

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
    image: null
  });

  // ================= FETCH =================

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchProducts = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/products"
    );

    setProducts(res.data.products || res.data);

  };

  const fetchCategories = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/categories"
    );

    setCategories(res.data);

  };

  const fetchBrands = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/brands"
    );

    setBrands(res.data);

  };

  // ================= FILTER =================

  let filteredProducts = [...products];

  if (selectedCategory !== "all") {

    filteredProducts = filteredProducts.filter(
      (p) => p.category?._id === selectedCategory
    );

  }

  filteredProducts = filteredProducts.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (sortPrice === "asc") {

    filteredProducts.sort(
      (a, b) => (a.originalPrice || 0) - (b.originalPrice || 0)
    );

  }

  if (sortPrice === "desc") {

    filteredProducts.sort(
      (a, b) => (b.originalPrice || 0) - (a.originalPrice || 0)
    );

  }

  // ================= DELETE =================

  const handleDelete = async (id) => {

    if (!window.confirm("Bạn có chắc muốn xóa?")) return;

    await axios.delete(
      `http://localhost:5000/api/products/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      }
    );

    fetchProducts();

  };

  // ================= SAVE =================

  const handleSave = async () => {

  try {

    const formData = new FormData();

    // ⭐ REQUIRED
    formData.append("name", newProduct.name);
    formData.append("category", newProduct.category);
    formData.append("brand", newProduct.brand);

    // ⭐ FIX NUMBER
    formData.append("originalPrice", Number(newProduct.originalPrice));
    formData.append("discount", Number(newProduct.discount || 0));
    formData.append("stock", Number(newProduct.stock || 0));

    // ⭐ OPTIONAL
    formData.append("description", newProduct.description || "");
    formData.append("promotion", newProduct.promotion || "");

    // ⭐ CHỈ GỬI KHI CÓ
    if (newProduct.promoEndDate) {
      formData.append("promoEndDate", newProduct.promoEndDate);
    }

    // ⭐ IMAGE
    if (newProduct.image instanceof File) {
      formData.append("image", newProduct.image);
    }

    // ⭐ DEBUG
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    if (editingProduct) {

      await axios.put(
        `http://localhost:5000/api/products/${editingProduct._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

    } else {

      await axios.post(
        "http://localhost:5000/api/products/create",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

    }

    setShowModal(false);
    setEditingProduct(null);
    
    fetchProducts();
;
  } catch (error) {

    console.log("🔥 ERROR:", error.response?.data || error);

  }

};

  // ================= IMAGE PREVIEW =================

  const handleImageChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setNewProduct({
      ...newProduct,
      image: file
    });

    setPreview(URL.createObjectURL(file));

  };

  return (

    <div className="admin-products">

      <h2 className="page-title">Quản lý sản phẩm</h2>

      {/* ================= FILTER BAR ================= */}

      <div className="filter-bar">

        <input
          placeholder="🔍 Tìm sản phẩm..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={(e)=>setSelectedCategory(e.target.value)}
        >

          <option value="all">Tất cả</option>

          {categories.map((c)=>(
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}

        </select>

        <select
          value={sortPrice}
          onChange={(e)=>setSortPrice(e.target.value)}
        >

          <option value="">Sắp xếp giá</option>
          <option value="asc">Giá tăng ↑</option>
          <option value="desc">Giá giảm ↓</option>

        </select>

        <button
          className="btn-primary"
          onClick={()=>setShowModal(true)}
        >
          + Thêm sản phẩm
        </button>

      </div>

      {/* ================= TABLE ================= */}

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

            {filteredProducts.map((p)=>{

              const finalPrice =
                p.discount > 0
                  ? p.price
                  : p.originalPrice;

              return(

                <tr key={p._id}>

                  <td>
                    <img
                      src={p.image}
                      className="product-img"
                      alt=""
                    />
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
                      <span className="discount">
                        -{p.discount}%
                      </span>
                    )}

                  </td>

                  <td>{p.stock}</td>

                  <td className="actions">

                    <button
                      className="btn-edit"
                      onClick={()=>{

                        setEditingProduct(p);
                        setShowModal(true);

                      }}
                    >
                      Sửa
                    </button>

                    <button
                      className="btn-delete"
                      onClick={()=>handleDelete(p._id)}
                    >
                      Xóa
                    </button>

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

      {/* ================= MODAL ================= */}

{showModal && (

  <div
    className="modal-overlay"
    onClick={()=>setShowModal(false)}
  >

    <div
      className="modal-content"
      onClick={(e)=>e.stopPropagation()}
    >

      <h3>{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>

      {/* ⭐ GRID 2 CỘT */}
      <div className="product-form-grid">

        {/* LEFT */}
        <div>

          <input
            placeholder="Tên sản phẩm"
            value={newProduct.name}
            onChange={(e)=>
              setNewProduct({...newProduct,name:e.target.value})
            }
          />

          <select
            value={newProduct.category}
            onChange={(e)=>
              setNewProduct({...newProduct,category:e.target.value})
            }
          >
            <option value="">Chọn danh mục</option>

            {categories.map(c=>(
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={newProduct.brand}
            onChange={(e)=>
              setNewProduct({...newProduct,brand:e.target.value})
            }
          >
            <option value="">Chọn thương hiệu</option>

            {brands.map(b=>(
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Giá gốc"
            value={newProduct.originalPrice}
            onChange={(e)=>
              setNewProduct({...newProduct,originalPrice:e.target.value})
            }
          />

        </div>

        {/* RIGHT */}
        <div>

          <input
            type="number"
            placeholder="Giảm giá (%)"
            value={newProduct.discount}
            onChange={(e)=>
              setNewProduct({...newProduct,discount:e.target.value})
            }
          />

          {Number(newProduct.discount) > 0 && (

            <input
              type="datetime-local"
              value={newProduct.promoEndDate}
              onChange={(e)=>
                setNewProduct({...newProduct,promoEndDate:e.target.value})
              }
            />

          )}

          <input
            type="number"
            placeholder="Tồn kho"
            value={newProduct.stock}
            onChange={(e)=>
              setNewProduct({...newProduct,stock:e.target.value})
            }
          />

          <input
            type="file"
            onChange={handleImageChange}
          />

          {preview && (
            <img
              src={preview}
              className="preview-img"
              alt=""
            />
          )}

        </div>

      </div>

      {/* TEXTAREA */}
      <textarea
        placeholder="Mô tả sản phẩm"
        value={newProduct.description}
        onChange={(e)=>
          setNewProduct({...newProduct,description:e.target.value})
        }
      />

      <textarea
        placeholder="Nội dung khuyến mãi"
        value={newProduct.promotion}
        onChange={(e)=>
          setNewProduct({...newProduct,promotion:e.target.value})
        }
      />

      <div className="modal-actions">

        <button
          className="btn-primary"
          onClick={handleSave}
        >
          Lưu
        </button>

        <button
          className="btn-delete"
          onClick={()=>setShowModal(false)}
        >
          Hủy
        </button>

      </div>

    </div>

  </div>

)}

    </div>

  );

}

export default AdminProducts;