import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminReport.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AdminReport() {

  const token = localStorage.getItem("adminToken");

  // ================= STATE =================

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [monthlyOrders, setMonthlyOrders] = useState([]);

  // ⭐ year filter
  const [year, setYear] = useState(new Date().getFullYear());


  // ================= REVENUE BY MONTH =================

  const fetchRevenueByMonth = async () => {

    try {

      const res = await axios.get(
        `http://localhost:5000/api/orders/revenue-by-month?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // ⭐ tạo mảng 12 tháng mặc định
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: `Tháng ${i + 1}`,
        revenue: 0
      }));

      // ⭐ map dữ liệu từ backend
      res.data?.forEach(item => {

        const monthIndex = Number(item._id) - 1;

        if (monthIndex >= 0 && monthIndex < 12) {
          months[monthIndex].revenue = item.totalRevenue;
        }

      });

      setMonthlyRevenue(months);

    } catch (err) {

      console.log("❌ Lỗi revenue:", err);

    }

  };


  // ================= ORDERS BY MONTH =================

  const fetchOrdersByMonth = async () => {

    try {

      const res = await axios.get(
        `http://localhost:5000/api/orders/orders-by-month?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // ⭐ tạo dữ liệu mặc định 12 tháng
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: `Tháng ${i + 1}`,
        orders: 0
      }));

      res.data?.forEach(item => {

        const monthIndex = Number(item._id) - 1;

        if (monthIndex >= 0 && monthIndex < 12) {
          months[monthIndex].orders = item.totalOrders;
        }

      });

      setMonthlyOrders(months);

    } catch (err) {

      console.log("❌ Lỗi orders:", err);

    }

  };


  // ================= ADMIN STATS =================

  const fetchStats = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/orders/admin-stats",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setStats(res.data);

    } catch (err) {

      console.log("❌ Lỗi lấy stats:", err);

    }

  };


  // ================= LOAD DATA =================

  useEffect(() => {

    fetchStats();
    fetchRevenueByMonth();
    fetchOrdersByMonth();

  }, [year]); // ⭐ reload khi đổi năm



  return (

    <div className="admin-report">

      <h2 className="report-title">Báo cáo tổng quan</h2>


      {/* ================= YEAR FILTER ================= */}

      <div style={{ marginBottom: "20px" }}>

        <div className="year-filter">

          <label>📅 Năm:</label>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))} // ⭐ convert number
            className="year-select"
          >

            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>

          </select>

        </div>

      </div>



      {/* ================= DASHBOARD CARDS ================= */}

      <div className="report-cards">

        {/* TOTAL REVENUE */}
        <div className="report-card">

          <h4>Tổng doanh thu</h4>

          <p>
            {stats.totalRevenue?.toLocaleString()} ₫
          </p>

        </div>


        {/* TOTAL ORDERS */}
        <div className="report-card">

          <h4>Tổng đơn hàng</h4>

          <p>{stats.totalOrders}</p>

        </div>


        {/* TOTAL PRODUCTS */}
        <div className="report-card">

          <h4>Tổng sản phẩm</h4>

          <p>{stats.totalProducts}</p>

        </div>


        {/* TOTAL USERS */}
        <div className="report-card">

          <h4>Khách hàng</h4>

          <p>{stats.totalUsers}</p>

        </div>

      </div>



      {/* ================= REVENUE CHART ================= */}

      <div className="chart-card">

        <h3>📊 Doanh thu theo tháng (VNĐ)</h3>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={monthlyRevenue}>

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            {/* ⭐ chart revenue */}
            <Bar dataKey="revenue" fill="#3b82f6" />

          </BarChart>

        </ResponsiveContainer>

      </div>



      {/* ================= ORDERS CHART ================= */}

      <div className="chart-card">

        <h3>📦 Số lượng đơn hàng theo tháng</h3>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={monthlyOrders}>

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            {/* ⭐ chart orders */}
            <Bar dataKey="orders" fill="#10b981" />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

export default AdminReport;