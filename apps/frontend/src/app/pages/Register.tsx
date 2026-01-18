import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          storeName: storeName || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <span className="logo-icon">📦</span>
          <span className="logo-text">Knostichub</span>
        </div>

        <div className="auth-card">
          <h1>Create account</h1>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleRegister}>
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
              <label htmlFor="storeName">Store Name (optional)</label>
              <input
                id="storeName"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Awesome Store"
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
                placeholder="At least 6 characters"
              />
              <span className="input-hint">Passwords must be at least 6 characters.</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Re-enter password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Creating account...' : 'Create your account'}
            </button>
          </form>

          <div className="auth-terms">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="auth-link-button">
            Sign in
          </Link>
        </div>

        <div className="demo-credentials">
          <h4>Demo Accounts Available</h4>
          <p>You can also sign in with existing demo accounts:</p>
          <code>store1@example.com</code>
          <code>store2@example.com</code>
          <code>store3@example.com</code>
          <p className="password-hint">Password: <strong>password123</strong></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
