import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  sku: string;
  imageUrl: string | null;
  store: {
    id: string;
    name: string;
  };
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [lowStock, setLowStock] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    limit: 12
  });

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden'];

  useEffect(() => {
    fetchProducts();
  }, [page, search, category, lowStock]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(lowStock && { lowStock: 'true' }),
      });

      const response = await fetch(`/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return <div className="container"><div className="loading">Loading products...</div></div>;
  }

  return (
    <div className="container">
      <h1>Products</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              setLowStock(e.target.checked);
              setPage(1);
            }}
          />
          Low Stock Only
        </label>
        <Link to="/products/new" className="btn btn-primary">Add Product</Link>
      </div>

      {error && <div className="error">{error}</div>}

      {products.length === 0 && !loading ? (
        <div className="card">
          <p>No products found. {search || category ? 'Try adjusting your filters.' : 'Create your first product!'}</p>
        </div>
      ) : (
        <div className="grid grid-4">
          {products.map((product) => (
            <div key={product.id} className="card product-card">
              <div className="product-image">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`product-image-placeholder ${product.imageUrl ? 'hidden' : ''}`}>
                  {product.name.charAt(0)}
                </div>
              </div>
              <div className="product-content">
                <span className="product-category">{product.category}</span>
                <h3>
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                </h3>
                <p className="product-store">
                  <Link to={`/stores/${product.store.id}`}>{product.store.name}</Link>
                </p>
                <div className="product-footer">
                  <span className="product-price">${Number(product.price).toFixed(2)}</span>
                  <span className={`stock-badge ${product.quantity < 10 ? 'low' : 'ok'}`}>
                    {product.quantity} in stock
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {pagination.pages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductList;
