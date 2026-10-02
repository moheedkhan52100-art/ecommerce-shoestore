import Login from "./pages/Login";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Account from "./pages/Account";
import ProductDetails from "./pages/ProductDetails";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Support from "./pages/Support";
import AdminManagement from "./pages/AdminManagement";
import { ThemeProvider } from "./context/ThemeContext";
import StoreHeader from "./components/StoreHeader";
import StoreFooter from "./components/StoreFooter";
import SupportChat from "./components/SupportChat";
import StoreToast from "./components/StoreToast";
import { StoreSettingsProvider } from "./context/StoreSettingsContext";

function StorefrontLayout({ children, shopNavigation = false }) {
  return (
    <>
      <StoreHeader shopNavigation={shopNavigation} />
      {children}
      <StoreFooter />
      <SupportChat />
    </>
  );
}

function ProtectedRoute({ children }) {
  return localStorage.getItem("token") && localStorage.getItem("admin") ? (
    <AdminLayout>{children}</AdminLayout>
  ) : (
    <Navigate to="/login" replace />
  );
}

function UserRoute({ children }) {
  const location = useLocation();
  return localStorage.getItem("token") && localStorage.getItem("user") ? (
    children
  ) : (
    <Navigate to="/user/login" replace state={{ from: location }} />
  );
}

function App() {
  return (
    <ThemeProvider>
      <StoreSettingsProvider>
      <BrowserRouter>
        <StoreToast />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/user/login" element={<Login />} />
          <Route
            path="/user"
            element={
              <UserRoute>
                <Home />
              </UserRoute>
            }
          />
          <Route
            path="/user/account"
            element={
              <UserRoute>
                <StorefrontLayout>
                  <Account />
                </StorefrontLayout>
              </UserRoute>
            }
          />
          <Route path="/product/:id" element={<StorefrontLayout><ProductDetails /></StorefrontLayout>} />
          <Route path="/shop" element={<StorefrontLayout shopNavigation><Shop /></StorefrontLayout>} />
          <Route path="/cart" element={<StorefrontLayout><Cart /></StorefrontLayout>} />
          <Route path="/checkout" element={<UserRoute><StorefrontLayout><Checkout /></StorefrontLayout></UserRoute>} />
          <Route path="/wishlist" element={<StorefrontLayout><Wishlist /></StorefrontLayout>} />
          <Route path="/support" element={<StorefrontLayout><Support /></StorefrontLayout>} />
          <Route path="/" element={<><Home /><SupportChat /></>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage"
            element={
              <ProtectedRoute>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/add"
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/edit/:id"
            element={
              <ProtectedRoute>
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </StoreSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
