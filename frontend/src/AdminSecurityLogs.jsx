import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminSecurityLogs.css";

function AdminSecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const logsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users/security-logs",
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

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // 🔢 PAGINATION
  const indexOfLast = currentPage * logsPerPage;
  const indexOfFirst = indexOfLast - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirst, indexOfLast);

  return (
    <div className="admin-logs">
      <h2 className="page-title">Security Logs</h2>

      {/* FILTER + SEARCH */}
      <div className="log-filter">
        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="SUCCESS">Success</option>
          <option value="FAIL">Fail</option>
          <option value="PENDING">Pending</option>
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
              <th>IP</th>
              <th>Device</th>
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

                <td>
                  <span
                    className={`log-badge ${
                      log.action.includes("SUCCESS")
                        ? "log-success"
                        : log.action.includes("FAIL")
                        ? "log-fail"
                        : log.action.includes("PENDING")
                        ? "log-pending"
                        : "log-default"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>

                <td>{log.ip}</td>

                <td title={log.userAgent}>
                  {log.userAgent?.slice(0, 40) || "Unknown"}
                </td>

                <td>
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination">
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
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

export default AdminSecurityLogs;