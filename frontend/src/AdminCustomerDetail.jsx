import { useEffect, useState } from "react";
import api from "./api";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

function AdminCustomerDetail() {

  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/api/customers/${id}`);

      console.log("DETAIL:", res.data); // debug

      setData(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchCustomer();
}, [id]);

  if (!data) return <p>Loading...</p>;

  const customer = data.customer || data;
const orders = data.orders || [];
console.log("CUSTOMER DATA:", data);

  return (
    <div>
      <h2>Chi tiết khách hàng</h2>

      {/* 🧑 INFO */}
      <div>
        <h3>🧑 Thông tin</h3>
        <p>Tên: {customer?.fullName}</p>
        <p>Email: {customer?.email}</p>
        <p>SĐT: {customer?.phone}</p>
        <p>Địa chỉ: {customer?.address}</p>
        <p>Trạng thái: {customer?.status}</p>
        <p>Staff: {customer?.assignedTo?.fullName || "Chưa có"}</p>
      </div>

      {/* 💰 STATS */}
      <div>
        <h3>💰 Thống kê</h3>
        <p>Tổng chi tiêu: {(customer?.totalSpent || 0).toLocaleString()} ₫</p>
<p>Tổng đơn: {customer?.totalOrders || 0}</p>
<p>
  Trung bình:{" "}
  {customer?.totalOrders > 0
    ? (customer.totalSpent / customer.totalOrders).toLocaleString()
    : 0} ₫
</p>
      </div>

      {/* 📦 ORDERS */}
      <div>
        <h3>📦 Lịch sử đơn</h3>

        {orders?.map(o => (
          <div key={o._id}>
            {o._id} - {o.totalAmount} ₫ - {o.status}
          </div>
        ))}
      </div>

    </div>
  );
}

export default AdminCustomerDetail;