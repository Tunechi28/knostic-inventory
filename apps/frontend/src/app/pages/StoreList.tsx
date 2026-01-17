import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  quantity: number;
  price: number;
}

function StoreList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    limit: 10
  });

  useEffect(() => {
    fetchStores();
  }, [page, search]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/stores?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }

      const data = await response.json();
      setStores(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStoreValue = (products: Product[]) => {
    return products.reduce((total, product) => total + (product.quantity * product.price), 0);
  };

  if (loading && stores.length === 0) {
    return <div className="container"><div className="loading">Loading stores...</div></div>;
  }

  return (
    <div className="container">
      <h1>Stores</h1>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Link to="/stores/new" className="btn btn-primary">Add Store</Link>
      </div>

      {error && <div className="error">{error}</div>}

      {stores.length === 0 && !loading ? (
        <div className="card">
          <p>No stores found. {search ? 'Try adjusting your search.' : 'Create your first store!'}</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {stores.map((store) => (
            <div key={store.id} className="card">
              <h3>
                <Link to={`/stores/${store.id}`}>{store.name}</Link>
              </h3>
              <p>{store.description}</p>
              {store.address && <p><strong>Address:</strong> {store.address}</p>}
              <p><strong>Owner:</strong> {store.user.email}</p>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{store.products.length}</div>
                  <div className="stat-label">Products</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    ${calculateStoreValue(store.products).toFixed(2)}
                  </div>
                  <div className="stat-label">Inventory Value</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/stores/${store.id}`} className="btn btn-primary">
                  View Details
                </Link>
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

export default StoreList;