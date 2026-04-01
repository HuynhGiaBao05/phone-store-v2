import { useEffect, useState } from "react";
import axios from "axios";

function ActivityLogs() {

  // ===== STATE LƯU LOG =====
  const [logs, setLogs] = useState([]);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {

    const fetchLogs = async () => {
      try {

        const res = await axios.get(
          "http://localhost:5000/api/users/activity-logs",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setLogs(res.data.data || res.data);

      } catch (err) {
        console.error(err);
      }
    };

    fetchLogs();

  }, []);
return (
  <div>
    <h3>📜 Activity Logs</h3>

    {logs.length === 0 ? (
      <p>Không có hoạt động</p>
    ) : (
      Array.isArray(logs) && logs.map((log) => (
        <div key={log._id} className="log-item">

          <div className="log-user">
            {log.user?.fullName || "Unknown"}
          </div>

          <div className="log-action">
            {log.action}
          </div>

          <div className="log-time">
            {new Date(log.createdAt).toLocaleString()}
          </div>

        </div>
      ))
    )}
  </div>
);
}

export default ActivityLogs;