import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminUsers.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AdminUsers() {

  // ===============================
  // STATE
  // ===============================
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("adminToken");
  const [showModal, setShowModal] = useState(false);

  // search
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // ===============================
  // FILTER USERS
  // ===============================
  console.log("USERS DATA:", users);

const safeUsers = Array.isArray(users) ? users : [];

const filteredUsers = safeUsers.filter((u) =>
  u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
  u.email?.toLowerCase().includes(search.toLowerCase())
);
  

  // ===============================
  // PAGINATION
  // ===============================
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;

  const currentUsers = filteredUsers.slice(
    indexOfFirstUser,
    indexOfLastUser
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // ===============================
  // STATE: FORM TẠO USER
  // ===============================
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "STAFF"
  });

  // ===============================
  // FETCH USERS
  // ===============================
  const fetchUsers = async () => {
    try {

      const res = await axios.get(
        "http://localhost:5000/api/users/all",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(res.data.users || res.data.data || res.data || []);
    } catch (err) {

      console.log("Lỗi khi lấy danh sách user:", err);

    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ===============================
  // TOGGLE ACTIVE
  // ===============================
  const toggleActive = async (id) => {
    try {

      await axios.put(
        `http://localhost:5000/api/users/toggle-active/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchUsers();

    } catch (err) {

      console.log("Lỗi khi khóa/mở khóa:", err);

    }
  };

  // ===============================
  // UPDATE ROLE
  // ===============================
  const updateRole = async (id, newRole) => {
    try {

      await axios.put(
        `http://localhost:5000/api/users/update-role/${id}`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchUsers();

    } catch (err) {

      console.log("Lỗi khi cập nhật role:", err);

    }
  };

  // ===============================
  // DELETE USER
  // ===============================
  const deleteUser = async (id) => {
    try {

      const confirmDelete = window.confirm(
        "Bạn có chắc chắn muốn xóa user này?"
      );

      if (!confirmDelete) return;

      await axios.delete(
        `http://localhost:5000/api/users/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchUsers();

    } catch (err) {

      console.log("Lỗi khi xóa user:", err);

    }
  };

  // ===============================
  // CREATE USER
  // ===============================
  const createUser = async () => {

    try {

      await axios.post(
        "http://localhost:5000/api/users/create",
        newUser,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success("Tạo user thành công 🎉");

      setNewUser({
        fullName: "",
        email: "",
        password: "",
        role: "STAFF"
      });

      fetchUsers();
      setShowModal(false);

    } catch (err) {

      console.log("Lỗi khi tạo user:", err);
      toast.error("Tạo user thất bại ❌");

    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="admin-users">

      <div className="users-header">

        <h2 className="page-title">Quản lý người dùng</h2>

        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>

          <input
            type="text"
            placeholder="🔍 Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          <button
            className="btn btn-create"
            onClick={() => setShowModal(true)}
          >
            + Tạo nhân viên
          </button>

        </div>

      </div>

      <div className="table-card">

        <table className="user-table">

          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>

            {currentUsers.map((u) => (

              <tr key={u._id}>

                <td>{u.fullName}</td>
                <td>{u.email}</td>

                <td>
                  <select
                    className="role-select"
                    value={u.role}
                    onChange={(e) =>
                      updateRole(u._id, e.target.value)
                    }
                  >
                    <option value="USER">USER</option>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>

                <td>
                  {u.isActive ? "Hoạt động" : "Bị khóa"}
                </td>

                <td className="action-cell">

                  <button
                    className="btn btn-lock"
                    onClick={() => toggleActive(u._id)}
                  >
                    {u.isActive ? "Khóa" : "Mở"}
                  </button>

                  <button
                    className="btn btn-delete"
                    onClick={() => deleteUser(u._id)}
                  >
                    Xóa
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <div className="pagination">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ◀
          </button>

          {[...Array(totalPages)].map((_, index) => (

            <button
              key={index}
              className={currentPage === index + 1 ? "active" : ""}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>

          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            ▶
          </button>

        </div>

      </div>

      <ToastContainer position="top-right" autoClose={3000} />
      {showModal && (
  <div className="modal">
    <div className="modal-content">
      <h3>Tạo nhân viên</h3>

      <input
        placeholder="Họ tên"
        value={newUser.fullName}
        onChange={(e) =>
          setNewUser({ ...newUser, fullName: e.target.value })
        }
      />

      <input
        placeholder="Email"
        value={newUser.email}
        onChange={(e) =>
          setNewUser({ ...newUser, email: e.target.value })
        }
      />

      <input
        type="password"
        placeholder="Mật khẩu"
        value={newUser.password}
        onChange={(e) =>
          setNewUser({ ...newUser, password: e.target.value })
        }
      />

      <button onClick={createUser}>Tạo</button>
      <button onClick={() => setShowModal(false)}>Hủy</button>
    </div>
  </div>
)}
    </div>
  );
}

export default AdminUsers;