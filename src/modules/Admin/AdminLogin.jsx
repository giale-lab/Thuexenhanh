import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.js';
import { Shield, Loader } from 'lucide-react';
import { ModuleFrame, Field } from '../Shared/UIKit.jsx';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      window.showAlert('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role && data.role.startsWith('admin_')) {
          navigate('/admin');
        } else {
          window.showAlert('Tài khoản không có quyền truy cập Admin.');
          await auth.signOut();
        }
      } else {
        window.showAlert('Lỗi: Không tìm thấy hồ sơ người dùng.');
        await auth.signOut();
      }
    } catch (err) {
      console.error(err);
      window.showAlert('Đăng nhập thất bại. Vui lòng kiểm tra lại Email/Mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
      <ModuleFrame style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', background: '#e0e7ff', color: '#4f46e5', padding: 16, borderRadius: '50%', marginBottom: 24 }}>
          <Shield size={32} />
        </div>
        <h2 style={{ fontSize: 24, margin: '0 0 8px', color: 'var(--m-dark)' }}>Quản trị viên</h2>
        <p style={{ color: 'var(--m-subtle)', marginBottom: 32 }}>Đăng nhập để truy cập hệ thống quản trị</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          <Field label="Email">
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@thuexenhanh.vn"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--m-border)' }}
            />
          </Field>
          <Field label="Mật khẩu">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--m-border)' }}
            />
          </Field>
          
          <button 
            type="submit" 
            className="primary" 
            disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 16, marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            {loading ? <Loader size={20} className="spin" /> : 'Đăng nhập'}
          </button>
        </form>
        <div style={{ marginTop: 24 }}>
          <button onClick={() => navigate('/trang-chu')} style={{ background: 'none', border: 'none', color: 'var(--m-primary)', cursor: 'pointer', fontWeight: 600 }}>Quay lại trang chủ</button>
        </div>
      </ModuleFrame>
    </div>
  );
}

export { AdminLogin };