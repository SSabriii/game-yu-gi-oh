import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'An error occurred.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      navigate('/lobby');
    } catch {
      setError('عذراً، لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-container">
        <div className="auth-logo">
           <h1>⚔ ديول ماسترز</h1>
           <p>ساحة معركة البطاقات عبر الإنترنت</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}
            >
              تسجيل الدخول
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError(''); }}
            >
              إنشاء حساب
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">اسم المستخدم</label>
              <input
                id="username-input"
                className="form-input"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
              <input
                id="password-input"
                className="form-input"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              className="btn-gold w-full mt-3"
              disabled={loading}
            >
              {loading ? '...' : tab === 'login' ? '⚔ دخول الساحة' : '✨ إنشاء الحساب'}
            </button>
          </form>

          <p className="text-center mt-3" style={{ fontSize: '0.8rem', color: '#888' }}>
            {tab === 'login'
              ? "ليس لديك حساب؟ انقر على إنشاء حساب أعلاه."
              : 'لديك حساب بالفعل؟ انقر على تسجيل الدخول أعلاه.'}
          </p>
        </div>
      </div>
    </div>
  );
}
