import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Layout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT payload (base64)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email || '');
      } catch {
        setUserEmail('');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="layout">
      {/* Top Navigation Bar */}
      <header className="header">
        <div className="header-main">
          <NavLink to="/" className="header-logo">
            <span className="logo-icon">📦</span>
            <span className="logo-text">Knostichub</span>
          </NavLink>

          <form className="header-search" onSubmit={handleSearch}>
            <select className="search-category">
              <option value="">All</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Home & Garden">Home & Garden</option>
            </select>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
          </form>

          <nav className="header-nav">
            <button className="header-account" onClick={handleLogout}>
              <span className="account-label">Hello, {userEmail || 'User'}</span>
              <span className="account-action">Sign Out</span>
            </button>
          </nav>
        </div>

        <div className="header-secondary">
          <nav className="nav-links">
            <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              All Products
            </NavLink>
            <NavLink to="/stores" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Stores
            </NavLink>
            <span className="nav-divider">|</span>
            <span className="nav-info">Inventory Management System</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Knostichub</h4>
            <p>Your complete inventory management solution</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Product Management</li>
              <li>Store Management</li>
              <li>Stock Tracking</li>
              <li>Analytics</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li>API Documentation</li>
              <li>Help Center</li>
              <li>Contact Support</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Knostichub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
