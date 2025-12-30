import { useState } from 'react';

export default function AuthForm({ mode, onSubmit, loading, onSwitchMode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isLogin = mode === 'login';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, password });
  };

  return (
    <div className="card auth-card">
      <h2 className="card-title">{isLogin ? 'Welcome back' : 'Create account'}</h2>
      <p className="card-subtitle">Realtime one-to-one chat with JWT security.</p>
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
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Strong password"
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
