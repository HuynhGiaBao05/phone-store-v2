import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminActivityLogs.css";

function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
const logsPerPage = 10;
const [filter, setFilter] = useState(""); // 🔍 lọc action
const [search, setSearch] = useState(""); // 🔍 tìm user
  useEffect(() => {
    fetchLogs();
  }, []);
  useEffect(() => {
  setCurrentPage(1);
}, [filter, search]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users/activity-logs",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      setLogs(res.data);
    } catch (err) {
      console.log(err);
    }
  };
// 🔍 FILTER + SEARCH
const filteredLogs = logs
  .filter((log) =>
    filter ? log.action.includes(filter) : true
  )
  .filter((log) =>
    search
      ? log.user?.fullName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        log.user?.email
          ?.toLowerCase()
          .includes(search.toLowerCase())
      : true
  );

// 🔢 PAGINATION
const indexOfLast = currentPage * logsPerPage;
const indexOfFirst = indexOfLast - logsPerPage;
const currentLogs = filteredLogs.slice(indexOfFirst, indexOfLast);

const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  return (
    <div className="admin-logs">
      <h2 className="page-title">Activity Logs</h2>
    {/* 🔍 FILTER + SEARCH */}
<div className="log-actions">
  <select onChange={(e) => setFilter(e.target.value)}>
    <option value="">All</option>
    <option value="CREATE">Create</option>
    <option value="UPDATE">Update</option>
    <option value="DELETE">Delete</option>
  </select>

  <input
    type="text"
    placeholder="Tìm theo tên hoặc email..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="log-search"
  />
</div>
      <div className="table-card">
        <table className="log-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
        {currentLogs.map((log) => (
           <tr key={log._id}>
  <td>
            {log.user?.fullName} <br />
            <span className="email">
            {log.user?.email}
            </span>
        </td>

        {/* ACTION */}
        <td>
            <span
            className={`log-action ${
                log.action.includes("CREATE")
                ? "create"
                : log.action.includes("UPDATE")
                ? "update"
                : "delete"
            }`}
            >
            {log.action}
            </span>
        </td>

        {/* DESCRIPTION */}
        <td>{log.description}</td>

        {/* TIME */}
        <td>
            {new Date(log.createdAt).toLocaleString("vi-VN")}
        </td>
        </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
  >
    ⬅ Prev
  </button>

  <span>
    Page {currentPage} / {totalPages}
  </span>

  <button
    onClick={() =>
      setCurrentPage((prev) =>
        Math.min(prev + 1, totalPages)
      )
    }
    disabled={currentPage === totalPages}
  >
    Next ➡
  </button>
</div>
      </div>
    </div>
  );
}

export default AdminActivityLogs;