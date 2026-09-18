import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { Car, ShieldCheck, Loader } from 'lucide-react';

export function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  
  const [cccdModal, setCccdModal] = useState(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCars = onSnapshot(collection(db, 'cars'), snap => {
      setCars(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubUsers(); unsubCars(); };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const searchStr = `${u.name||''} ${u.email||''} ${u.phone||''} ${u.location?.province||''} ${u.location?.district||''}`.toLowerCase();
      const matchesSearch = searchStr.includes(userSearch.toLowerCase());
      if (!matchesSearch) return false;
      const cCount = cars.filter(c => c.ownerId === u.id).length;
      if (userRoleFilter === 'has_car' && cCount === 0) return false;
      if (userRoleFilter === 'no_car' && cCount > 0) return false;
      return true;
    });
  }, [users, cars, userSearch, userRoleFilter]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader className="spin" size={24} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
          placeholder="Tìm theo tên, email, SĐT, địa chỉ..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--m-border)', fontSize: 14, outline: 'none' }}
        />
        <select
          value={userRoleFilter}
          onChange={e => setUserRoleFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--m-border)', fontSize: 14, outline: 'none', background: '#fff' }}
        >
          <option value="all">Tất cả người dùng</option>
          <option value="has_car">Đang có xe</option>
          <option value="no_car">Chưa có xe</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredUsers.map(u => {
          const cCount = cars.filter(c => c.ownerId === u.id).length;
          const roleLabel = u.role?.startsWith('admin_') ? { label: 'Admin', bg: '#fef3c7', color: '#92400e' }
            : cCount > 0 ? { label: 'Chủ xe', bg: '#dbeafe', color: '#1d4ed8' }
            : { label: 'Khách', bg: '#f3f4f6', color: '#4b5563' };
          const locationStr = [u.location?.province, u.location?.district].filter(Boolean).join(' - ');
          
          return (
          <div key={u.id} style={{ background: 'var(--m-surface)', border: '1px solid var(--m-border)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--m-primary-light)', color: 'var(--m-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                {(u.name || u.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--m-dark)' }}>{u.name || 'Chưa cập nhật'}</span>
                  <span style={{ background: roleLabel.bg, color: roleLabel.color, padding: '2px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 700 }}>{roleLabel.label}</span>
                  {u.phone && (
                    <a href={`https://zalo.me/${u.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Zalo
                    </a>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--m-subtle)', lineHeight: 1.7 }}>
                  <span>{u.email}</span>
                  {u.phone && <span style={{ marginLeft: 10 }}>• {u.phone}</span>}
                  {locationStr && <span style={{ marginLeft: 10 }}>• {locationStr}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--m-subtle)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span>Tham gia: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}</span>
                  {cCount > 0 && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}><Car size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{cCount} xe</span>}
                  {u.cccdImage && (
                    <button onClick={() => setCccdModal(u)} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={12} /> Xem CCCD
                    </button>
                  )}
                  {u.cccdNumber && <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>Số: {u.cccdNumber}</span>}
                </div>
              </div>
            </div>
          </div>);
        })}
        {filteredUsers.length === 0 && <div style={{ textAlign: 'center', color: 'var(--m-subtle)', padding: 40 }}>Không tìm thấy người dùng.</div>}
      </div>

      {cccdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 500, width: '90%', position: 'relative' }}>
            <button onClick={() => setCccdModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            <h3 style={{ margin: '0 0 16px' }}>CCCD: {cccdModal.name}</h3>
            <div style={{ fontSize: 14, marginBottom: 12 }}>Số CCCD: <strong>{cccdModal.cccdNumber}</strong></div>
            <img src={cccdModal.cccdImage} style={{ width: '100%', borderRadius: 8 }} alt="CCCD" />
          </div>
        </div>
      )}
    </div>
  );
}