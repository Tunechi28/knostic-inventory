import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <span className="logo-icon">📦</span>
          <span className="logo-text">InventoryHub</span>
        </div>

        <div className="auth-card">
          <h1>Sign in</h1>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider">
            <span>New to InventoryHub?</span>
          </div>

          <Link to="/register" className="auth-link-button">
            Create your account
          </Link>
        </div>

        <div className="demo-credentials">
          <h4>Quick Demo Access</h4>
          <p>Click to auto-fill credentials:</p>
          <div className="demo-buttons">
            <button onClick={() => fillDemoCredentials('store1@example.com')} className="demo-btn">
              TechMart Electronics
            </button>
            <button onClick={() => fillDemoCredentials('store2@example.com')} className="demo-btn">
              Fashion Forward
            </button>
            <button onClick={() => fillDemoCredentials('store3@example.com')} className="demo-btn">
              BookWorm Paradise
            </button>
          </div>
          <p className="password-hint">Password: <strong>password123</strong></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
