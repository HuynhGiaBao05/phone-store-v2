import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminBanner.css";


function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
const [editingId, setEditingId] = useState(null);
const [now, setNow] = useState(Date.now());
const [preview, setPreview] = useState(null);
const disabledIdsRef = useRef(new Set());
useEffect(() => {
  const interval = setInterval(() => {
    setNow(Date.now());
  }, 1000);

  return () => clearInterval(interval);
}, []);
  const [images, setImages] = useState([]); // 🔥 nhiều ảnh (coming soon)
const [fileKey, setFileKey] = useState(Date.now()); 
  const filteredProducts = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // 🔥 token
  const token =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("staffToken");

  const [form, setForm] = useState({
    title: "",
    image: "",
    type: "PRODUCT",
    productId: "",
    link: "",
    launchDate: ""
  });

  // ================= LOAD PRODUCT =================
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data.products || []));
  }, []);
//== REVOKE OBJECT URL
useEffect(() => {
  if (!form.image) {
    setPreview(null); // ✅ THÊM DÒNG NÀY
    return;
  }

  const url = URL.createObjectURL(form.image);
  setPreview(url);

  return () => URL.revokeObjectURL(url);
}, [form.image]);
  // ================= GET =================
 const fetchBanners = () => {
  axios
    .get("http://localhost:5000/api/banners")
    .then((res) => {
      setBanners(res.data);
      disabledIdsRef.current.clear(); // ✅ reset tracking
    });
};
  useEffect(() => {
  fetchBanners();
}, []);
  //== UPDATE STATUS

  useEffect(() => {
  const interval = setInterval(() => {
    if (document.hidden) return;
    const now = new Date();

    setBanners((prev) =>
      prev.map((b) => {
   if (
  b._id &&
  b.type === "COMING_SOON" &&
  b.launchDate &&
  new Date(b.launchDate) < now &&
  b.isActive &&
  !disabledIdsRef.current.has(b._id)
) {
  disabledIdsRef.current.add(b._id);

  setTimeout(() => {
  if (!document.hidden) {
    axios.put(`http://localhost:5000/api/banners/${b._id}`, {
      isActive: false
    });
  }
}, 0);

  return { ...b, isActive: false };
}

        return b; // 🔥 THIẾU DÒNG NÀY
      })
    );
  }, 10000);

  return () => clearInterval(interval);
}, []);
const resetForm = () => {
  setEditingId(null);
  setTitle("");
  setDescription("");
  setImages([]);
  setSearch("");
  setPreview(null);

  setForm({
    title: "",
    image: "",
    type: "PRODUCT",
    productId: "",
    link: "",
    launchDate: ""
  });
};
  // ================= CREATE =================
const handleCreate = async () => {
  setLoading(true);

  try {
    if (form.type === "COMING_SOON" && !form.launchDate) {
  toast.error("Phải chọn ngày ra mắt!");
  setLoading(false);
  return;
}
if (form.type === "PROMO" && !form.link) {
  toast.error("Phải nhập link!");
  setLoading(false);
  return;
}
if (form.type === "PRODUCT" && !form.productId) {
  toast.error("Phải chọn sản phẩm!");
  setLoading(false);
  return;
}
if (form.type === "COMING_SOON" && !title.trim()) {
  toast.error("Thiếu tiêu đề!");
  setLoading(false);
  return;
}
    const formData = new FormData();

    if (form.type === "COMING_SOON") {
  formData.append("title", title);
  formData.append("description", description);
}
    formData.append("type", form.type);

    if (form.productId) {
      formData.append("productId", form.productId);
    }
    
    if (form.launchDate) {
  formData.append("launchDate", form.launchDate);
}
    if (form.link) {
      formData.append("link", form.link);
    }

    if (form.image) {
      formData.append("image", form.image);
    }

    images.forEach((img) => {
      formData.append("images", img);
    });

    await axios.post("http://localhost:5000/api/banners", formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // ✅ TOAST
    toast.success("🎉 Thêm banner thành công!");
window.scrollTo({ top: 0, behavior: "smooth" });
    // ✅ RESET FORM (QUAN TRỌNG)
    resetForm();
    fetchBanners();
    setFileKey(Date.now());
    
  } catch (err) {
    console.log(err);
    toast.error("❌ Thêm thất bại!");
    } finally {
  setLoading(false); // 🔥 bắt buộc
}
  
};

// ================= EDIT =================
const handleEdit = (b) => {
  setEditingId(b._id);

  setForm({
    title: b.title || "",
    image: "",
    type: b.type,
    productId: b.productId || "",
    link: b.link || "",
    launchDate: b.launchDate
  ? new Date(b.launchDate).toISOString().slice(0, 16)
  : ""
  });

  setTitle(b.title || "");
  setDescription(b.description || "");
  setImages([]);
setPreview(null);
  // 🔥 set search product name
  if (b.productId && products.length > 0) {
    const found = products.find(p => p._id === b.productId);
    if (found) setSearch(found.name);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  
};

// ================= UPDATE =================
const handleUpdate = async (id) => {
  setLoading(true);

  try {
    const formData = new FormData();

    if (form.type === "COMING_SOON") {
  formData.append("title", title);
  formData.append("description", description);
}
    formData.append("type", form.type);

    if (form.productId) formData.append("productId", form.productId);
    if (form.link) formData.append("link", form.link);
    if (form.image) formData.append("image", form.image);
    if (form.launchDate) formData.append("launchDate", form.launchDate);

    images.forEach((img) => formData.append("images", img));

    await axios.put(
      `http://localhost:5000/api/banners/${id}`,
      formData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    toast.success("Đã cập nhật!");
    window.scrollTo({ top: 0, behavior: "smooth" });
    resetForm();
    fetchBanners();
  } catch (err) {
    toast.error("Lỗi!");
  } finally {
    setLoading(false);
  }
};
  // ================= DELETE =================
  const handleDelete = async (id) => {
      if (!window.confirm("Xoá banner này?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/banners/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchBanners();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= TOGGLE =================
const toggleActive = async (id, current) => {
  try {
    await axios.put(
      `http://localhost:5000/api/banners/${id}`,
      { isActive: !current },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // 🔥 update state local luôn (mượt hơn fetch lại)
    setBanners((prev) =>
      prev.map((b) =>
        b._id === id ? { ...b, isActive: !current } : b
      )
    );

    toast.success("Cập nhật trạng thái!");
  } catch (err) {
    toast.error("Lỗi toggle!");
  }
};
//=== DRAG AND DROP ===
const handleDragEnd = async (result) => {
  if (!result.destination) return;

  const items = Array.from(banners);
  const [moved] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, moved);

const updated = items.map((b, index) => ({
  ...b,
  order: index
}));

setBanners(updated);
  // 🔥 gửi order lên backend
  await axios.put(
    "http://localhost:5000/api/banners/reorder",
    {
      banners: updated.map((b) => ({
  id: b._id,
  order: b.order
}))
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
};
const editingBanner = banners.find((b) => b._id === editingId);
const previewImage =
  editingBanner?.image || editingBanner?.images?.[0];
  return (
<div className="banner-container">
        <h2>
  {editingId ? " Đang sửa banner" : " Quản lý Banner"}
</h2>

      {/* ================= FORM ================= */}
<div className="banner-form">
        {/* ================= 1. ẢNH BANNER ================= */}
        <input
         key={fileKey}
          type="file"
          onChange={(e) =>
            setForm({
              ...form,
              image: e.target.files[0]
            })
          }
        />

      
{(preview || previewImage) && (
  <img
    src={
      preview
        ? preview
        : `http://localhost:5000/uploads/${previewImage}`
    }
    width="150"
  />
)}
  {form.type === "COMING_SOON" && (
  <>
    <input
      type="text"
      placeholder="Tiêu đề banner"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />

    <input
      type="text"
      placeholder="Mô tả banner"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
  </>
)}
        {/* ================= TYPE ================= */}
       <select
  value={form.type} // 🔥 THÊM DÒNG NÀY
  onChange={(e) => {
  const type = e.target.value;

  setForm({
    ...form,
    type,
    productId: "",
    link: "",
    launchDate: ""
  });

  setSearch(""); // reset search product
}}
>

          <option value="PRODUCT">PRODUCT</option>
          <option value="PROMO">PROMO</option>

          {/* 🔥 FIX: thêm type mới */}
          <option value="COMING_SOON">COMING SOON</option>
        </select>

        {/* ===================================== */}
        {/* 🔥 PRODUCT (SP ĐANG BÁN) */}
        {/* ===================================== */}
        {form.type === "PRODUCT" && (
          <>
<div className="search-box">
              {/* 🔍 SEARCH */}
              <input
  className="search-input"
  placeholder="🔍 Tìm sản phẩm..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setShowDropdown(true);
  }}
  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
/>

              {/* DROPDOWN */}
              {showDropdown && search && (
                <div className="search-dropdown">
                  {filteredProducts.slice(0, 10).map((p) => (
                    <div
                      key={p._id}
                      onClick={() => {
                        setForm({ ...form, productId: p._id });
                        setSearch(p.name);
                         setTitle(p.name);
                        setShowDropdown(false);
                      }}
                      className="dropdown-item"
                    >
                      {p.name} - {p.price?.toLocaleString()}đ
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===================================== */}
        {/* 🔥 COMING SOON (SP CHƯA BÁN) */}
        {/* ===================================== */}
        {form.type === "COMING_SOON" && (
          <>
            
          <input
  type="datetime-local"
  value={form.launchDate || ""}
  onChange={(e) =>
    setForm({ ...form, launchDate: e.target.value })
  }
/>
           

            {/* 🔥 MULTI IMAGE (MAX 3) */}
            <input
            key={fileKey}
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files).slice(0, 3);
                setImages(files);
              }}
            />
          </>
        )}

        {/* ===================================== */}
        {/* 🔥 PROMO */}
        {/* ===================================== */}
        {form.type === "PROMO" && (
  <input
  value={form.link}
  placeholder="Link bài báo (https://...)"
  onChange={(e) =>
    setForm({
      ...form,
      link: e.target.value,
      productId: ""
    })
  }
/>
)}

      <button
  disabled={loading}
  onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
>
  {loading ? "Đang xử lý..." : editingId ? "Cập nhật" : "➕ Thêm banner"}
</button>
      </div>

      {/* ================= LIST ================= */}
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="banners">
    {(provided) => (
      <div
        className="banner-list"
        ref={provided.innerRef}
        {...provided.droppableProps}
      >
        {[...banners]
  .sort((a, b) => {
  if (a.type === "COMING_SOON" && b.type === "COMING_SOON") {
    return new Date(a.launchDate) - new Date(b.launchDate);
  }

  if (a.type === "COMING_SOON") return -1;
  if (b.type === "COMING_SOON") return 1;

  return (a.order || 0) - (b.order || 0);
})
  .map((b, index) => (
          <Draggable key={b._id} draggableId={b._id} index={index}>
            {(provided) => (
              <div
                className="banner-item"
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >{b.launchDate && (
  <div style={{ fontSize: 12, color: "#999" }}>
    ⏰ {new Date(b.launchDate).toLocaleString()}
  </div>
)}

{b.launchDate && (() => {
const diff = Math.max(0, new Date(b.launchDate) - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return (
    <div style={{ color: "red", fontSize: 12 }}>
      ⏱ {days}d {hours}h {minutes}m {seconds}s
    </div>
  );
})()}
                {/* CONTENT GIỮ NGUYÊN */}
                
                <img
                  src={
                    b.image
                      ? `http://localhost:5000/uploads/${b.image}`
                      : b.images?.[0]
                      ? `http://localhost:5000/uploads/${b.images[0]}`
                      : "/placeholder.png"
                  }
                />

                <div className="banner-info">
                  <div className="banner-title">{b.title}</div>

                  <div className={`badge ${b.type === "COMING_SOON" ? "coming_soon" : b.type.toLowerCase()}`}>
                    {b.type}
                  </div>
                </div>

                <div className="banner-actions">
                  <button className="btn-delete" onClick={() => handleDelete(b._id)}>
                    Xoá
                  </button>
                  <button onClick={() => handleEdit(b)}>
                  Sửa
                </button>
                  <button
                    className="btn-active"
                    onClick={() => toggleActive(b._id, b.isActive)}
                  >
                    {b.isActive ? "Đang bật" : "Đang tắt"}
                  </button>
                </div>

              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
</div>
  );
}

export default AdminBanner;