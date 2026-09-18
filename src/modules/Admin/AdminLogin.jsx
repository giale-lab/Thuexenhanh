import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { Shield, Loader, Lock, Mail } from 'lucide-react';

export function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', userCred.user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role && userData.role.startsWith('admin_')) {
          onLoginSuccess({ uid: userCred.user.uid, ...userData });
        } else {
          setError('Tài khoản của bạn không có quyền truy cập trang quản trị.');
          auth.signOut();
        }
      } else {
        setError('Không tìm thấy thông tin tài khoản.');
        auth.signOut();
      }
    } catch (err) {
      console.error(err);
      setError('Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 24, width: '100%', maxWidth: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Shield size={32} />
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, color: '#0f172a' }}>Admin Đăng nhập</h1>
        <p style={{ margin: '0 0 32px', color: '#64748b', fontSize: 14 }}>Hệ thống quản trị nội bộ Thuê Xe Nhanh</p>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 20, textAlign: 'left', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              placeholder="Email quản trị viên" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', height: 48, padding: '0 16px 0 44px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 15, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', height: 48, padding: '0 16px 0 44px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 15, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', height: 48, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
          >
            {loading ? <Loader className="spin" size={20} /> : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>&larr; Quay lại trang chủ App</a>
        </div>
      </div>
    </div>
  );
}