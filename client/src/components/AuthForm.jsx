import { useState } from 'react';

export default function AuthForm({ mode, onSubmit, loading, onSwitchMode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const isLogin = mode === 'login';

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    
    // Validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    
    if (!isLogin && trimmedName.length < 2) {
      setValidationError('Name must be at least 2 characters');
      return;
    }
    
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    if (trimmedPassword.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    
    onSubmit({ name: trimmedName, email: trimmedEmail, password: trimmedPassword });
  };

  return (
    <div className="card auth-card">
      <h2 className="card-title">{isLogin ? 'Welcome back' : 'Create account'}</h2>
      <p className="card-subtitle">Realtime one-to-one chat with JWT security.</p>
      {validationError && (
        <div style={{ padding: '0.75rem', marginBottom: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {validationError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="form">
        {!isLogin && (
          <label className="form-field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required={!isLogin}
            />
          </label>
        )}
        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="form-field">
          <span>Password {!isLogin && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>(min. 6 characters)</span>}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Strong password"
            minLength="6"
            required
          />
        </label>
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Working...' : isLogin ? 'Login' : 'Sign up'}
        </button>
      </form>
      <button className="btn ghost" type="button" onClick={onSwitchMode}>
        {isLogin ? 'Need an account? Sign up' : 'Already registered? Login'}
      </button>
    </div>
  );
}
