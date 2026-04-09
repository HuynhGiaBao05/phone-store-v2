import { useEffect, useState } from "react";
import axios from "axios";
import "./StaffOrders.css";
import React from "react";

function StaffOrders() {

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  // 🔥 lưu order đang mở
const [expandedOrder, setExpandedOrder] = useState(null);
const path = window.location.pathname;

const isAdmin = path.startsWith("/admin");

const token = isAdmin
  ? localStorage.getItem("adminToken")
  : localStorage.getItem("staffToken");
const [currentPage, setCurrentPage] = useState(1);
const ordersPerPage = 20;
  // ===== FETCH ORDERS =====
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrders(res.data);

    } catch (err) {

      console.log("Lỗi lấy orders:", err);

    }

  };

  // ===== UPDATE STATUS =====
  const updateStatus = async (id, status) => {
    console.log("STATUS:", status);

    try {

      await axios.put(
        `http://localhost:5000/api/orders/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchOrders();

    } catch (err) {

      console.log("Lỗi update status:", err);

    }

  };

  // ===== FILTER =====
  const filteredOrders =
  (filter === "ALL"
    ? orders
    : orders.filter((o) => o.status === filter)
  )
    .filter(order => order && order._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
    const indexOfLast = currentPage * ordersPerPage;
const indexOfFirst = indexOfLast - ordersPerPage;
const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className="orders-container">

      {/* HEADER */}
      <div className="orders-header">
        <h2>Quản lý đơn hàng</h2>
      </div>

      {/* FILTER */}
      <div className="orders-filter">

        <button
          className={filter === "ALL" ? "active" : ""}
          onClick={() => setFilter("ALL")}
        >
          Tất cả
        </button>

        <button
          className={filter === "PENDING" ? "active pending" : ""}
          onClick={() => setFilter("PENDING")}
        >
          PENDING
        </button>

        <button
          className={filter === "SHIPPING" ? "active shipping" : ""}
          onClick={() => setFilter("SHIPPING")}
        >
          SHIPPING
        </button>

        <button
          className={filter === "DELIVERED" ? "active delivered" : ""}
          onClick={() => setFilter("DELIVERED")}
        >
          DELIVERED
        </button>

        <button
          className={filter === "CANCELLED" ? "active cancelled" : ""}
          onClick={() => setFilter("CANCELLED")}
        >
          CANCELLED
        </button>

      </div>

      {/* TABLE */}
      <div className="orders-card">

    
        <div className="table-wrapper">
  <table className="orders-table">

          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
            </tr>
          </thead>

          <tbody>

{currentOrders.map((order) => (
  <React.Fragment key={order._id}>
    {/* 🔥 ROW CHÍNH */}
    <tr
  onClick={() =>
    setExpandedOrder(
      expandedOrder === order._id ? null : order._id
    )
  }
  style={{
    cursor: "pointer",
    background:
      order.paymentStatus === "UNPAID" ? "#fff5f5" : "#f0fff4"
  }}
>
  <td>#{order._id.slice(-6)}</td>
  <td>{order.user?.fullName?.trim() || "Khách lẻ"}</td>
  <td>
  {order.shippingInfo?.phone &&
   order.shippingInfo.phone.length > 5
    ? order.shippingInfo.phone
    : "N/A"}
</td>
  <td>
  {order.totalAmount
    ? order.totalAmount.toLocaleString() + " ₫"
    : "0 ₫"}
</td>

  <td>
    {order.paymentStatus === "PAID"
      ? "✅ Đã thanh toán"
      : "❌ Chưa thanh toán"}
  </td>

  <td>
    <span className={`status-badge ${order.status.toLowerCase()}`}>
      {order.status}
    </span>
  </td>

  <td>
    <select
      value={order.status}
      onClick={(e) => e.stopPropagation()} // 🔥 FIX BUG CLICK
      onChange={(e) =>
        updateStatus(order._id, e.target.value)
      }
    >
      <option value="PENDING">PENDING</option>
      <option value="CONFIRMED">CONFIRMED</option>
      <option value="SHIPPING">SHIPPING</option>
      <option value="DELIVERED">DELIVERED</option>
      <option value="CANCELLED">CANCELLED</option>
    </select>
  </td>
</tr>

    {/* 🔥 ROW CHI TIẾT */}
    {expandedOrder === order._id && (
  <tr>
    <td colSpan="7">
      <div style={{
        background: "#fafafa",
        padding: 20,
        borderRadius: 10
      }}>

        <h4>📦 Chi tiết đơn hàng</h4>

        {order.items.map(item => (
          <div key={item._id} style={{
            display: "flex",
            gap: 10,
            marginBottom: 10
          }}>
            <img
              src={`http://localhost:5000/uploads/${item.product?.image}`}
              alt={item.product?.name}
              style={{ width: 60 }}
            />

            <div>
              {item.product?.name} x{item.quantity}
            </div>

            <div style={{ marginLeft: "auto", color: "red" }}>
              {(item.price * item.quantity).toLocaleString()}đ
            </div>
          </div>
        ))}

        <hr />

        <div><b>Người nhận:</b> {order.user?.fullName}</div>
        <div><b>SĐT:</b> {order.shippingInfo?.phone}</div>
        <div><b>Địa chỉ:</b> {order.shippingInfo?.address}</div>

        <div>
          <b>Hình thức:</b>{" "}
          {order.deliveryMethod === "DELIVERY"
  ? "🚚 Giao tận nơi"
  : order.deliveryMethod === "STORE"
  ? "🏪 Nhận tại cửa hàng"
  : "❓ Không xác định"}
        </div>

        <div><b>Thanh toán:</b> {order.paymentMethod}</div>

      </div>
    </td>
  </tr>
)}
  </React.Fragment>
))}

          </tbody>

        </table>
        </div>
<div style={{ marginTop: 20, textAlign: "center" }}>
  <button
    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
  >
    ← Prev
  </button>

  <span style={{ margin: "0 10px" }}>
    Trang {currentPage} / {totalPages}
  </span>

  <button
    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
  >
    Next →
  </button>
</div>
        {filteredOrders.length === 0 && (
          <p className="no-data">Không có đơn hàng</p>
        )}

      </div>

    </div>

  );

}

export default StaffOrders;