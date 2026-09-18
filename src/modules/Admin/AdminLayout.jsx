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
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--m-bg)' }}><div className="spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--m-border)', borderTopColor: 'var(--m-primary)' }} /></div>;
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
    <div style={{ display: 'flex', height: '100vh', background: 'var(--m-bg)', overflow: 'hidden', fontFamily: 'var(--font-family, system-ui, sans-serif)' }}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <div style={{ 
        width: 260, 
        background: 'var(--m-dark)', 
        color: 'var(--m-surface)', 
        display: 'flex', 
        flexDirection: 'column',
        position: window.innerWidth <= 768 ? 'fixed' : 'relative',
        top: 0, bottom: 0, left: sidebarOpen || window.innerWidth > 768 ? 0 : -260,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
        boxShadow: window.innerWidth <= 768 && sidebarOpen ? 'var(--shadow-xl)' : 'none'
      }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 10 }}>
             <ShieldAlert size={24} color="var(--m-surface)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Admin Panel</h2>
            <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>Thuê Xe Nhanh</div>
          </div>
        </div>

        <div style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {menuItems.map(item => {
              const active = isActive(item.path, item.exact);
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setSidebarOpen(false)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, 
                    padding: '12px 16px', borderRadius: 'var(--r-sm)', 
                    color: active ? 'var(--m-surface)' : 'rgba(255,255,255,0.7)', 
                    background: active ? 'var(--m-primary)' : 'transparent',
                    textDecoration: 'none', fontWeight: 600, fontSize: 14,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if(!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--m-surface)'; } }}
                  onMouseLeave={(e) => { if(!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src={currentUser.avatar || '/guest-avatar.png'} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
              <div style={{ fontSize: 12, color: 'var(--m-subtle)', textTransform: 'capitalize' }}>{currentUser.role.replace('admin_', '')}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--m-surface)', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--m-red)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile Header */}
        <div className="hide-desktop" style={{ background: 'var(--m-surface)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--m-border)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 16, color: 'var(--m-dark)' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'var(--m-bg)', border: 'none', cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 8, color: 'var(--m-dark)' }}><Menu size={22} /></button>
            Admin Panel
          </div>
          <button onClick={() => navigate('/')} style={{ background: 'var(--m-primary-light)', border: 'none', color: 'var(--m-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 12px', borderRadius: 20 }}>Về App</button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="hide-mobile">
            <h1 style={{ fontSize: 24, margin: 0, color: 'var(--m-dark)', fontWeight: 700, letterSpacing: '-0.5px' }}>Quản trị Hệ thống</h1>
            <button onClick={() => navigate('/')} className="secondary" style={{ padding: '8px 16px', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
               Quay lại App
            </button>
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
