import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StoreList from './pages/StoreList';
import StoreDetail from './pages/StoreDetail';
import StoreNew from './pages/StoreNew';
import ProductList from './pages/ProductList';
import ProductNew from './pages/ProductNew';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Simple auth check
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<ProductList />} />
          <Route path="stores" element={<StoreList />} />
          <Route path="stores/new" element={<StoreNew />} />
          <Route path="stores/:storeId" element={<StoreDetail />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductNew />} />
          <Route path="products/:productId" element={<ProductDetail />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;