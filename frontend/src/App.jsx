import { Routes, Route } from "react-router-dom";

import UserLayout from "./UserLayout";

import Home from "./Home";
import IphonePage from "./IphonePage";
import Warranty from "./Warranty";
import ReturnPolicy from "./ReturnPolicy";
import Contact from "./Contact";

import AdminLogin from "./AdminLogin";
import ForgotPassword from "./ForgotPassword";

import AdminProducts from "./AdminProducts";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminCategories from "./AdminCategories";
import AdminBrands from "./AdminBrands";
import AdminReport from "./AdminReport";

import StaffLayout from "./StaffLayout";
import StaffOrders from "./StaffOrders";

import AdminLayout from "./AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import ScrollToTop from "./ScrollToTop";
import CategoryPage from "./CategoryPage";

import ProductDetail from "./ProductDetail";
import Checkout from "./Checkout";
import Cart from "./Cart";
import AdminStores from "./AdminStores";
import LoginUser from "./LoginUser";

import Profile from "./Profile";
import Orders from "./Orders";

import MfaWait from "./MfaWait";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <ScrollToTop />
            <ToastContainer position="top-right" autoClose={2000} />

      <Routes>

      {/* ===== USER LAYOUT (CÓ NAVBAR) ===== */}
      <Route element={<UserLayout />}>

        <Route path="/" element={<Home />} />
        <Route path="/iphone" element={<IphonePage />} />
        <Route path="/warranty" element={<Warranty />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<LoginUser />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Orders />} />

        {/* 👉 Sau này bạn thêm category page, product detail page cũng để trong đây */}

      </Route>

      {/* ===== KHÔNG CÓ NAVBAR ===== */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/mfa-wait" element={<MfaWait />} />


      {/* ===== ADMIN ===== */}
      <Route
        path="/admin-products"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-categories"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout>
              <AdminCategories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-brands"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout>
              <AdminBrands />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

        <Route
          path="/admin-orders"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <StaffOrders />   {/* 👈 dùng chung */}
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-stores"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminStores />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      <Route
        path="/admin-reports"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout>
              <AdminReport />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* ===== STAFF ===== */}
      <Route
        path="/staff-products"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <StaffLayout>
              <AdminProducts />
            </StaffLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-orders"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <StaffLayout>
              <StaffOrders />
            </StaffLayout>
          </ProtectedRoute>
        }
      />

        

    </Routes>
      </>



  );

}

export default App;