import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminCategories.css";
import { toast } from "react-toastify";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  const fetchCategories = async () => {
    const res = await axios.get("http://localhost:5000/api/categories");
    setCategories(res.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategory.trim()) return;

    await axios.post("http://localhost:5000/api/categories", {
      name: newCategory,
    });

    setNewCategory("");
    fetchCategories();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;

    await axios.delete(`http://localhost:5000/api/categories/${id}`);
    fetchCategories();
  };

  return (
    <div className="admin-category-card">
      <h2 className="page-title">Quản lý danh mục</h2>

      <div className="admin-category-card">
        <div className="category-form">
          <input
            type="text"
            placeholder="Nhập tên danh mục..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={handleCreate} className="btn-primary">
            Thêm danh mục
          </button>
        </div>

        <table className="category-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Slug</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>
                  <span className="slug-badge">{c.slug}</span>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="btn-delete"
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

export default AdminCategories;