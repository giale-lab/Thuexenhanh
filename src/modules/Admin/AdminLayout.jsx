import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, Car, Users, AlertTriangle, UserRoundCog, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { auth, logout } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.js";

import { AdminLogin } from './AdminLogin.jsx';
import { AdminStats } from './AdminStats.jsx';
import { AdminCars } from './AdminCars.jsx';
import { AdminUsers } from './AdminUsers.jsx';
import { AdminReports } from './AdminReports.jsx';
import { AdminStaff } from './AdminStaff.jsx';

export function AdminLayout() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(docRef);
        if (userDoc.exists()) {
          setCurrentUser({ uid: firebaseUser.uid, ...userDoc.data() });
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}><div className="spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #cbd5e1', borderTopColor: '#3b82f6' }} /></div>;
  }

  if (!currentUser || !currentUser.role?.startsWith('admin_')) {
    return <AdminLogin onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Thống kê', exact: true },
    { path: '/admin/cars', icon: <Car size={20} />, label: 'Quản lý xe' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Người dùng' },
    { path: '/admin/reports', icon: <AlertTriangle size={20} />, label: 'Báo cáo & Góp ý' },
  ];

  if (currentUser.role === 'admin_owner' || currentUser.role === 'admin_manager') {
    menuItems.push({ path: '/admin/staff', icon: <UserRoundCog size={20} />, label: 'Nhân sự & Phòng ban' });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path || location.pathname === path + '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <div style={{ 
        width: 260, 
        background: '#1e293b', 
        color: '#fff', 
        display: 'flex', 
        flexDirection: 'column',
        position: window.innerWidth <= 768 ? 'fixed' : 'relative',
        top: 0, bottom: 0, left: sidebarOpen || window.innerWidth > 768 ? 0 : -260,
        transition: 'left 0.3s ease',
        zIndex: 50
      }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <ShieldAlert size={28} color="#3b82f6" />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Admin Panel</h2>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Thuê Xe Nhanh</div>
          </div>
        </div>

        <div style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menuItems.map(item => {
              const active = isActive(item.path, item.exact);
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setSidebarOpen(false)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, 
                    padding: '12px 16px', borderRadius: 8, 
                    color: active ? '#fff' : '#cbd5e1', 
                    background: active ? '#3b82f6' : 'transparent',
                    textDecoration: 'none', fontWeight: 500, transition: 'all 0.2s'
                  }}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src={currentUser.avatar || '/guest-avatar.png'} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{currentUser.role}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile Header */}
        <div className="hide-desktop" style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 16 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Menu size={24} /></button>
            Admin Panel
          </div>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>Về App</button>
        </div>

        <div style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="hide-mobile">
            <h1 style={{ fontSize: 24, margin: 0, color: '#0f172a' }}>Quản trị Hệ thống</h1>
            <button onClick={() => navigate('/')} className="secondary" style={{ padding: '8px 16px', borderRadius: 8 }}>Quay lại App</button>
          </div>
          
          <Routes>
            <Route path="/" element={<AdminStats currentUser={currentUser} />} />
            <Route path="/cars" element={<AdminCars currentUser={currentUser} />} />
            <Route path="/users" element={<AdminUsers currentUser={currentUser} />} />
            <Route path="/reports" element={<AdminReports currentUser={currentUser} />} />
            <Route path="/staff" element={<AdminStaff currentUser={currentUser} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>

      <style>{`
        .hide-desktop { display: none; }
        @media (max-width: 768px) {
          .hide-desktop { display: flex !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
