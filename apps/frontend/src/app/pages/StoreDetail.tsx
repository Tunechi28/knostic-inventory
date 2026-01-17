import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Store {
  id: string;
  name: string;
  description: string;
  address: string;
  user: {
    email: string;
  };
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  sku: string;
}

interface InventoryValue {
  store: {
    id: string;
    name: string;
  };
  summary: {
    totalValue: number;
    totalProducts: number;
    totalQuantity: number;
  };
  breakdown: Array<{
    category: string;
    totalValue: number;
    totalQuantity: number;
    productCount: number;
  }>;
}

function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [inventoryValue, setInventoryValue] = useState<InventoryValue | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsPage, setProductsPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
      fetchInventoryValue();
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId, productsPage, categoryFilter, searchFilter]);

  const fetchStoreData = async () => {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch store details');
      }

      const data = await response.json();
      setStore(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryValue = async () => {
    try {
      const response = await fetch(`/api/stores/${storeId}/inventory-value`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInventoryValue(data);
      }
    } catch (err) {
      console.error('Error fetching inventory value:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: productsPage.toString(),
        limit: '10',
        ...(categoryFilter && { category: categoryFilter }),
        ...(searchFilter && { search: searchFilter }),
      });

      const response = await fetch(`/api/stores/${storeId}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading store details...</div></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <Link to="/stores" className="btn btn-secondary">Back to Stores</Link>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container">
        <div className="error">Store not found</div>
        <Link to="/stores" className="btn btn-secondary">Back to Stores</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/stores" className="btn btn-secondary">← Back to Stores</Link>
      </div>

      <div className="card">
        <h1>{store.name}</h1>
        <p>{store.description}</p>
        {store.address && <p><strong>Address:</strong> {store.address}</p>}
        <p><strong>Owner:</strong> {store.user.email}</p>
      </div>

      {inventoryValue && (
        <div className="card">
          <h2>Inventory Summary</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">${inventoryValue.summary.totalValue.toFixed(2)}</div>
              <div className="stat-label">Total Value</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{inventoryValue.summary.totalProducts}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{inventoryValue.summary.totalQuantity}</div>
              <div className="stat-label">Total Quantity</div>
            </div>
          </div>

          {inventoryValue.breakdown.length > 0 && (
            <div>
              <h3>By Category</h3>
              <div className="grid grid-3">
                {inventoryValue.breakdown.map((category) => (
                  <div key={category.category} className="card">
                    <h4>{category.category}</h4>
                    <p><strong>Value:</strong> ${category.totalValue.toFixed(2)}</p>
                    <p><strong>Products:</strong> {category.productCount}</p>
                    <p><strong>Quantity:</strong> {category.totalQuantity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>Products</h2>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Home & Garden">Home & Garden</option>
          </select>
          <Link to={`/products/new?storeId=${storeId}`} className="btn btn-primary">
            Add Product
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="loading">No products found</div>
        ) : (
          <div className="grid grid-2">
            {products.map((product) => (
              <div key={product.id} className="card">
                <h3>
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                </h3>
                <p><strong>SKU:</strong> {product.sku}</p>
                <p><strong>Category:</strong> {product.category}</p>
                <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
                <p>
                  <strong>Stock:</strong> 
                  <span style={{ 
                    color: product.quantity < 10 ? '#dc2626' : '#059669',
                    fontWeight: 'bold'
                  }}>
                    {product.quantity} units
                  </span>
                </p>
                {product.description && <p>{product.description}</p>}
                <Link to={`/products/${product.id}`} className="btn btn-primary">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreDetail;