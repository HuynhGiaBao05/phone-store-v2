import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import "./AdminBrands.css";
import { toast } from "react-toastify";

function AdminBrands() {

  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState("");

  const fetchBrands = async () => {
    const res = await axios.get("http://localhost:5000/api/brands");
    setBrands(res.data);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreate = async () => {
    if (!newBrand) {
      toast.error("Vui lòng nhập tên thương hiệu");
      return;
    }

    await axios.post("http://localhost:5000/api/brands", {
      name: newBrand,
    });

    setNewBrand("");
    fetchBrands();
  };

  const handleDelete = async (id) => {
  if (!window.confirm("Bạn có chắc muốn xóa?")) return;

  await axios.delete(`http://localhost:5000/api/brands/${id}`);
  fetchBrands();
};

  return (
  <div className="admin-brands">
    <div className="brand-header">
      <h2>Quản lý thương hiệu</h2>
    </div>

    <div className="brand-card">
      <div className="brand-form">
        <input
          type="text"
          placeholder="Nhập tên thương hiệu..."
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
        />
        <button onClick={handleCreate} className="btn-primary">
          + Thêm
        </button>
      </div>

      <table className="brand-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Slug</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
  {brands.map((b) => (
    <tr key={b._id}>
      <td>{b.name}</td>
      <td>{b.slug}</td>
      <td>
        <button
          className="btn-delete"
          onClick={() => handleDelete(b._id)}
        >
          Xóa
        </button>
      </td>
    </tr>
  ))}
</tbody>
      </table>
    </div>
  </div>
);
}

export default AdminBrands;