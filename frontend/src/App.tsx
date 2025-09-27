// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth pages
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import CompletePage from "./pages/auth/CompletePage";
import FailPage from "./pages/auth/FailPage";
import ChatPage from "./components/client/Chat/ChatPage";

// Admin layout & pages
import MainLayout from "./layouts/admin/MainLayout";
import DashboardPage from "./pages/admin/Dashboard/DashboardPage";
import UsersPage from "./pages/admin/Users/UsersPage";
import ProductsPage from "./pages/admin/Products/ProductsPage";
import ProductDetailPageAdmin from "./pages/admin/Products/ProductsDetailPage";
import SuppliersPage from "./pages/admin/Supplier/SupplierPage";
import SupplierDetailPage from "./pages/admin/Supplier/SupplierDetailPage";
import PurchaseOrdersPage from "./pages/admin/PurchaseOrders/PurchaseOrdersPage";
import OrdersPage from "./pages/admin/Orders/OrdersPage";
import InventoryLogsPage from "./pages/admin/Inventorylog/InventoryLogPage";
import CategoryPageAdmin from "./pages/admin/Category/CategoryPage";
import CategoryDetailPage from "./pages/admin/Category/CategoryDetailPage";
import LogPage from "./pages/admin/Loginlog/LogPage";
import OrderDetailPage from "./pages/admin/Orders/OrdersDetailPage";

// Customer layout & pages
import ClientMainLayout from "./layouts/client/ClientMainLayout";
import HomePage from "./pages/customer/Home/HomePage";
import CategoriesPage from "./pages/customer/Categories/CategoriesPage";
import ProductDetailPageCustomer from "./pages/customer/Products/ProductDetailPage"; // Customer
import ProductPage from "./pages/customer/Products/ProductPage";
import SearchPage from "./pages/customer/Search/SearchPage";
import CartPage from "./pages/customer/Cart/CartPage";
import CheckoutPage from "./pages/customer/Checkout/CheckoutPage";
import ThankYouPage from "./pages/customer/Checkout/ThankYouPage";
import OrderHistoryPage from "./pages/customer/Historis/OrderHistoryPage";
import YourOrdersPage from "./pages/customer/Historis/YourOrdersPage";
import ProductDiscountPage from "./pages/customer/Products/ProductDiscountPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* Auth routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/complete" element={<CompletePage />} />
        <Route path="/register/failpage" element={<FailPage />} />

        {/* Admin routes */}
        <Route path="/admin/*" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />

          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPageAdmin />} />

          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailPage />} />

          <Route path="categories" element={<CategoryPageAdmin />} />
          <Route path="categories/:id" element={<CategoryDetailPage />} />

          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="inventory-logs" element={<InventoryLogsPage />} />
          <Route path="logs" element={<LogPage />} />
        </Route>

        {/* Customer routes */}
        <Route path="/" element={<ClientMainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:slug" element={<CategoriesPage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="product/:slug" element={<ProductDetailPageCustomer />} />
          <Route path="products/discount" element={<ProductDiscountPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="thankyou" element={<ThankYouPage />} />
          <Route path="/orders" element={<YourOrdersPage />} />
          <Route path="/orders/history" element={<OrderHistoryPage />} />
          <Route path="chat" element={<ChatPage role="customer" customerId={1} />} />
        </Route>

        {/* Redirect all unknown routes */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
