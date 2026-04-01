import { useEffect, useState } from "react";
import axios from "axios";

function RecentOrders() {

  const [orders, setOrders] = useState([]);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {

    const fetchOrders = async () => {
      try {

        const res = await axios.get(
          "http://localhost:5000/api/orders/recent-orders",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setOrders(res.data);

      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();

  }, []);

  return (
  <div>
    <h3>🧾 Recent Orders</h3>

    {orders.length === 0 ? (
      <p>Chưa có đơn hàng</p>
    ) : (
      orders.map((o) => (
        <div key={o._id} className="order-item">

          {/* ID */}
          <div>
            #{o._id.slice(-6)}
          </div>

          {/* USER */}
          <div>{o.user?.email}</div>

          {/* TOTAL */}
          <div>
            {Number(o.totalAmount).toLocaleString("vi-VN")} đ
          </div>

          {/* STATUS */}
          <div className={`status ${o.status}`}>
            {o.status}
          </div>

        </div>
      ))
    )}
  </div>
);
}

export default RecentOrders;