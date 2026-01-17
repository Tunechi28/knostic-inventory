import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

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

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  description: string;
  createdAt: string;
  status: string;
}

function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({
    type: 'STOCK_IN',
    quantity: 0,
    description: ''
  });

  useEffect(() => {
    if (productId) {
      fetchProductData();
      fetchProductHistory();
    }
  }, [productId]);

  const fetchProductData = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const data = await response.json();
      setProduct(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductHistory = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Error fetching product history:', err);
    }
  };

  const handleStockUpdate = async () => {
    if (!productId || stockUpdate.quantity <= 0) return;

    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
        },
        body: JSON.stringify(stockUpdate),
      });

      if (response.ok) {
        setShowStockModal(false);
        setStockUpdate({ type: 'STOCK_IN', quantity: 0, description: '' });
        await fetchProductData();
        await fetchProductHistory();
      } else {
        alert('Failed to update stock');
      }
    } catch (err) {
      alert('Error updating stock');
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading product details...</div></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <Link to="/products" className="btn btn-secondary">Back to Products</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="error">Product not found</div>
        <Link to="/products" className="btn btn-secondary">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/products" className="btn btn-secondary">← Back to Products</Link>
      </div>

      <div className="grid grid-2">
        <div className="card">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="product-detail-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {!product.imageUrl && (
            <div className="product-detail-placeholder">
              {product.name.charAt(0)}
            </div>
          )}

          <span className="product-category">{product.category}</span>
          <h1 style={{ marginTop: '0.5rem' }}>{product.name}</h1>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ margin: '0.5rem 0' }}><strong>SKU:</strong> {product.sku}</p>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Store:</strong>{' '}
              <Link to={`/stores/${product.store.id}`}>{product.store.name}</Link>
            </p>
          </div>

          <div className="product-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
            <span className="product-price" style={{ fontSize: '1.75rem' }}>
              ${Number(product.price).toFixed(2)}
            </span>
            <span className={`stock-badge ${product.quantity < 10 ? 'low' : 'ok'}`}>
              {product.quantity} in stock
            </span>
          </div>

          {product.description && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
              <strong>Description:</strong>
              <p style={{ marginTop: '0.5rem', color: '#4a5568', lineHeight: '1.7' }}>
                {product.description}
              </p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowStockModal(true)}
            >
              Update Stock
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Stock Movement History</h2>
          {history.length === 0 ? (
            <p style={{ color: '#64748b' }}>No stock movements recorded yet.</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {history.map((transaction) => (
                <div key={transaction.id} style={{
                  borderBottom: '1px solid #f1f5f9',
                  padding: '1rem 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {transaction.type.replace('_', ' ')}
                    </span>
                    <span className={`stock-badge ${transaction.type === 'STOCK_OUT' ? 'low' : 'ok'}`}>
                      {transaction.type === 'STOCK_OUT' ? '-' : '+'}{transaction.quantity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>
                  {transaction.description && (
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#475569' }}>
                      {transaction.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStockModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '400px', margin: '2rem' }}>
            <h3 style={{ marginTop: 0 }}>Update Stock</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Operation Type:
              </label>
              <select
                value={stockUpdate.type}
                onChange={(e) => setStockUpdate({ ...stockUpdate, type: e.target.value })}
              >
                <option value="STOCK_IN">Stock In</option>
                <option value="STOCK_OUT">Stock Out</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                value={stockUpdate.quantity}
                onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Description (optional):
              </label>
              <textarea
                value={stockUpdate.description}
                onChange={(e) => setStockUpdate({ ...stockUpdate, description: e.target.value })}
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Reason for stock update..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowStockModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStockUpdate}
                disabled={stockUpdate.quantity <= 0}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
