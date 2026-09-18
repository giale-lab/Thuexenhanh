import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.js';
import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Trash2, UserPlus, Shield, Loader, Edit3 } from 'lucide-react';
import { ModuleFrame, Field } from '../Shared/UIKit.jsx';

// Các role cơ bản của Admin
const ADMIN_ROLES = [
  { value: 'admin_owner', label: 'Owner (Toàn quyền)' },
  { value: 'admin_manager', label: 'Manager (Quản lý)' },
  { value: 'admin_employee', label: 'Nhân viên' },
  { value: 'admin_collab', label: 'Cộng tác viên' }
];

export function AdminStaff({ currentUser }) {
  const [departments, setDepartments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newDept, setNewDept] = useState('');
  
  // State for creating new admin
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', role: 'admin_employee', departmentId: '' });

  useEffect(() => {
    // Lắng nghe danh sách phòng ban
    const unsubDept = onSnapshot(collection(db, 'departments'), (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setDepartments(data);
    });

    // Lắng nghe tất cả users và lọc ra role bắt đầu bằng admin_
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = [];
      snap.forEach(d => {
        const u = d.data();
        if (u.role && u.role.startsWith('admin_')) {
          data.push({ id: d.id, ...u });
        }
      });
      setAdmins(data);
      setLoading(false);
    });

    return () => {
      unsubDept();
      unsubUsers();
    };
  }, []);

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    try {
      const id = "DEPT-$(Date.now())";
      await setDoc(doc(db, 'departments', id), { name: newDept.trim(), createdAt: new Date().toISOString() });
      setNewDept('');
    } catch (e) {
      window.showAlert('Lỗi thêm phòng ban: ' + e.message);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (e) {
      window.showAlert('Lỗi xóa phòng ban: ' + e.message);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.email || !adminForm.name) {
      window.showAlert('Vui lòng điền tên và email');
      return;
    }
    
    try {
      const newId = "ADMIN-$(Date.now())";
      await setDoc(doc(db, 'users', newId), {
        email: adminForm.email,
        name: adminForm.name,
        role: adminForm.role,
        departmentId: adminForm.departmentId,
        createdAt: new Date().toISOString(),
        isPreCreatedAdmin: true
      });

      window.showAlert("Đã thêm nhân sự. Email: ${adminForm.email}. Yêu cầu họ đăng nhập bằng tài khoản này.");
      setShowAddAdmin(false);
      setAdminForm({ name: '', email: '', role: 'admin_employee', departmentId: '' });
    } catch (e) {
      window.showAlert('Lỗi thêm nhân sự: ' + e.message);
    }
  };

  const handleRemoveAdmin = async (id) => {
    if (!window.confirm('Bạn có chắc muốn gỡ quyền quản trị của tài khoản này?')) return;
    try {
      await setDoc(doc(db, 'users', id), { role: 'guest' }, { merge: true });
    } catch (e) {
      window.showAlert('Lỗi gỡ quyền: ' + e.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader className="spin" size={24} /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 20 }}>Quản lý Nhân sự & Phòng ban</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        
        {/* CỘT PHÒNG BAN */}
        <ModuleFrame style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={18} /> Phòng ban ({departments.length})</h3>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input 
              type="text" 
              value={newDept} 
              onChange={e => setNewDept(e.target.value)} 
              placeholder="Tên phòng ban mới..." 
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--m-border)' }}
            />
            <button className="primary" onClick={handleAddDept} style={{ padding: '8px 16px', borderRadius: 8 }}>Thêm</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.length === 0 && <p style={{ color: 'var(--m-subtle)', fontSize: 14 }}>Chưa có phòng ban nào.</p>}
            {departments.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--m-bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--m-border)' }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{d.name}</span>
                <button className="icon-button" style={{ color: 'var(--m-red)' }} onClick={() => handleDeleteDept(d.id)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </ModuleFrame>

        {/* CỘT NHÂN SỰ */}
        <ModuleFrame style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={18} /> Danh sách Admin ({admins.length})</h3>
            <button className="primary" onClick={() => setShowAddAdmin(!showAddAdmin)} style={{ padding: '6px 12px', fontSize: 13 }}>Thêm Nhân sự</button>
          </div>

          {showAddAdmin && (
            <form onSubmit={handleAddAdmin} style={{ background: 'var(--m-bg)', padding: 16, borderRadius: 8, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required type="text" placeholder="Họ tên..." value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--m-border)' }} />
              <input required type="email" placeholder="Email..." value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--m-border)' }} />
              
              <select value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--m-border)' }}>
                {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              
              <select value={adminForm.departmentId} onChange={e => setAdminForm({...adminForm, departmentId: e.target.value})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--m-border)' }}>
                <option value="">-- Chọn Phòng ban --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <button type="submit" className="primary" style={{ padding: 8 }}>Lưu tài khoản</button>
            </form>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {admins.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', padding: '12px', borderRadius: 8, border: '1px solid var(--m-border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name} <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>{ADMIN_ROLES.find(r => r.value === a.role)?.label || a.role}</span></div>
                  <div style={{ fontSize: 13, color: 'var(--m-subtle)' }}>{a.email}</div>
                  {a.departmentId && (
                    <div style={{ fontSize: 12, marginTop: 4, color: 'var(--m-mid)' }}>
                      Phòng: {departments.find(d => d.id === a.departmentId)?.name || a.departmentId}
                    </div>
                  )}
                </div>
                {a.id !== currentUser.uid && (
                  <button className="icon-button" style={{ color: 'var(--m-red)' }} onClick={() => handleRemoveAdmin(a.id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </ModuleFrame>
      </div>
    </div>
  );
}