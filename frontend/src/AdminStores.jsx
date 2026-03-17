import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminStores.css";

function AdminStores() {

  // ================= STATE =================

  const [stores, setStores] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ⭐ FORM DATA
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    district: "",
    phone: ""
  });

  const token = localStorage.getItem("adminToken");

  // ==========================================
  // ⭐ LOAD STORE LIST
  // ==========================================
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/stores/admin",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setStores(res.data);

    } catch (err) {

      console.log("❌ Lỗi lấy stores:", err);

    }

  };

  // ==========================================
  // ⭐ CREATE / UPDATE STORE
  // ==========================================
  const handleSubmit = async () => {

    if (!form.name || !form.address) {
      alert("Nhập đầy đủ thông tin");
      return;
    }

    try {

      // ⭐ UPDATE
      if (editingId) {

        await axios.put(
          `http://localhost:5000/api/stores/${editingId}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      }

      // ⭐ CREATE
      else {

        await axios.post(
          "http://localhost:5000/api/stores",
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      }

      // ⭐ RESET FORM
      setForm({
        name: "",
        address: "",
        city: "",
        district: "",
        phone: ""
      });

      setEditingId(null);

      fetchStores();

    } catch (err) {

      console.log("❌ Lỗi lưu store:", err);

    }

  };

  // ==========================================
  // ⭐ EDIT STORE
  // ==========================================
  const handleEdit = (store) => {

    setForm({
      name: store.name || "",
      address: store.address || "",
      city: store.city || "",
      district: store.district || "",
      phone: store.phone || ""
    });

    setEditingId(store._id);

  };

  // ==========================================
  // ⭐ DELETE STORE (SOFT DELETE)
  // ==========================================
  const handleDelete = async (id) => {

    if (!window.confirm("Bạn có chắc muốn xóa chi nhánh?")) return;

    try {

      await axios.delete(
        `http://localhost:5000/api/stores/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchStores();

    } catch (err) {

      console.log("❌ Lỗi xóa store:", err);

    }

  };

  return (

    <div className="admin-store-page">

      <h2>Quản lý chi nhánh</h2>


      {/* ==========================================
          ⭐ FORM ADD / EDIT STORE
      ========================================== */}

      <div className="store-form">

        <input
          placeholder="Tên chi nhánh"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Địa chỉ"
          value={form.address}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />

        <input
          placeholder="Thành phố"
          value={form.city}
          onChange={(e) =>
            setForm({ ...form, city: e.target.value })
          }
        />

        <input
          placeholder="Quận / Huyện"
          value={form.district}
          onChange={(e) =>
            setForm({ ...form, district: e.target.value })
          }
        />

        <input
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        {/* ⭐ BUTTON ADD / UPDATE */}
        <button onClick={handleSubmit}>
          {editingId ? "Cập nhật chi nhánh" : "Thêm chi nhánh"}
        </button>

      </div>


      {/* ==========================================
          ⭐ STORE TABLE
      ========================================== */}

      <table className="store-table">

        <thead>

          <tr>

            <th>Tên</th>

            <th>Địa chỉ</th>

            <th>Thành phố</th>

            {/* ⭐ THÊM CỘT DISTRICT */}
            <th>Quận / Huyện</th>

            {/* ⭐ THÊM CỘT PHONE */}
            <th>SĐT</th>

            <th>Hành động</th>

          </tr>

        </thead>


        <tbody>

          {stores.map(store => (

            <tr key={store._id}>

              <td>{store.name}</td>

              <td>{store.address}</td>

              <td>{store.city}</td>

              {/* ⭐ HIỂN THỊ DISTRICT */}
              <td>{store.district}</td>

              {/* ⭐ HIỂN THỊ PHONE */}
              <td>{store.phone}</td>

              <td>

                {/* EDIT */}
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(store)}
                >
                  Sửa
                </button>

                {/* DELETE */}
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(store._id)}
                >
                  Xóa
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default AdminStores;