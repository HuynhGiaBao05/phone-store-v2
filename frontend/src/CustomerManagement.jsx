import { useEffect, useState } from "react";
import axios from "axios";
import "./CustomerManagement.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  
  const navigate = useNavigate();

  const path = window.location.pathname;

const isAdmin = path.startsWith("/admin");
const role = isAdmin ? "ADMIN" : "STAFF";
const token = isAdmin
  ? localStorage.getItem("adminToken")
  : localStorage.getItem("staffToken");

  // 🔥 load customer
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/customers?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setCustomers(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  

  // 🔥 update status
  const updateStatus = async (id, status) => {
    console.log("STATUS:", status);
    await axios.put(
      `http://localhost:5000/api/customers/${id}/status`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    fetchCustomers();
  };
  const [staffs, setStaffs] = useState([]);
const fetchStaffs = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5000/api/users/all",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // 🔥 chỉ lấy STAFF
    const data = res.data.data || res.data;

const staffList = data.filter(u => u.role === "STAFF");
setStaffs(staffList);

  } catch (err) {
    console.error(err);
  }
};
// load customers theo filter
useEffect(() => {
  fetchCustomers();
}, [statusFilter]);

// load staff chỉ 1 lần
useEffect(() => {
  if (role === "ADMIN") {
    fetchStaffs();
  }
}, [role]);

const assignCustomer = async (customerId, staffId) => {
  await axios.put(
    `http://localhost:5000/api/customers/assign/${customerId}`,
    { staffId },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  fetchCustomers();
};
  return (
    <div className="crm-container">
      <h2>📊 Customer Management</h2>

      {/* FILTER */}
      <div className="filter-box">
       <select onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="NEW">NEW</option>
          <option value="CARE">CARE</option>
          <option value="VIP">VIP</option>
          <option value="BLOCK">BLOCK</option>
        </select>
      </div>

      {/* TABLE */}
      <table className="crm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
             <th>Phone</th>
            <th>Status</th>
            {role === "ADMIN" && <th>Staff</th>}
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((c) => (
            <tr
  key={c._id}
  onClick={() => navigate(`/admin/customers/${c._id}`)}  // ⭐ CLICK
  style={{ cursor: "pointer" }}
>
              <td>{c.fullName}</td>
              <td>{c.email}</td>
              <td>{c.phone || "-"}</td> 

              <td>
                <span className={`status ${c.status}`}>
                  {c.status}
                </span>
              </td>

              {role === "ADMIN" && (
  <td>
    <select
  value={c.assignedTo?._id || ""}
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => assignCustomer(c._id, e.target.value)}
>
      <option value="">Chưa có</option>
      {staffs.map((s) => (
        <option key={s._id} value={s._id}>
          {s.fullName}
        </option>
      ))}
    </select>
  </td>
)}

<td>
  {role === "STAFF" && (
  <>
    <button
      onClick={(e) => {
        e.stopPropagation();
        updateStatus(c._id, "CARE");
      }}
    >
      CARE
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        updateStatus(c._id, "VIP");
      }}
    >
      VIP
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        updateStatus(c._id, "BLOCK");
      }}
    >
      BLOCK
    </button>
  </>
)}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerManagement;