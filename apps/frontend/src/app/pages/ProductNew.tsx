import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

interface Store {
  id: string;
  name: string;
}

function ProductNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedStoreId = searchParams.get('storeId') || '';

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    price: '',
    quantity: '',
    description: '',
    imageUrl: '',
    storeId: preselectedStoreId,
  });

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden'];

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (preselectedStoreId) {
      setFormData(prev => ({ ...prev, storeId: preselectedStoreId }));
    }
  }, [preselectedStoreId]);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.data);
        if (data.data.length > 0 && !preselectedStoreId) {
          setFormData(prev => ({ ...prev, storeId: data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          description: formData.description || undefined,
          imageUrl: formData.imageUrl || undefined,
          storeId: formData.storeId,
        }),
      });

      if (response.ok) {
        const product = await response.json();
        navigate(`/products/${product.id}`);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create product');
      }
    } catch (err) {
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loadingStores) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (stores.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <h2>No Stores Available</h2>
          <p>You need to create a store before adding products.</p>
          <Link to="/stores" className="btn btn-primary">Go to Stores</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/products" className="btn btn-secondary">← Back to Products</Link>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Add New Product</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="storeId">Store</label>
            <select
              id="storeId"
              name="storeId"
              value={formData.storeId}
              onChange={handleChange}
              required
            >
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Product Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Initial Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                required
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={3}
              maxLength={1000}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (optional)</label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductNew;
