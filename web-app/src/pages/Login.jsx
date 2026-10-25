import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e, isSignUp) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const { data, error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ text: error.message, type: 'danger' });
    } else if (data.user) {
      onLoginSuccess(data.session);
    }
    setLoading(false);
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow-lg border-0 p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <ShieldCheck size={48} className="text-primary mb-2" />
          <h4 className="fw-bold">Kirana Expiry Shield</h4>
          <p className="text-muted small">Store Owner Access Panel</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} small py-2`}>{message.text}</div>
        )}

        <form>
          <div className="mb-3">
            <label className="form-label small fw-bold">Email Address</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-bold">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          <button className="btn btn-primary w-100 mb-2 fw-bold" onClick={(e) => handleAuth(e, false)} disabled={loading}>
            {loading ? 'Processing...' : 'Secure Login'}
          </button>
          <button className="btn btn-outline-secondary w-100 small" onClick={(e) => handleAuth(e, true)} disabled={loading}>
            Create Admin Account
          </button>
        </form>
      </div>
    </div>
  );
}