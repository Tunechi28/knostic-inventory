import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function StoreNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const store = await response.json();
        navigate(`/stores/${store.id}`);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create store');
      }
    } catch (err) {
      setError('Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/stores" className="btn btn-secondary">← Back to Stores</Link>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Create New Store</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Store Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter store name"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your store"
              rows={3}
              maxLength={1000}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address (optional)</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter store address"
              maxLength={200}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StoreNew;
