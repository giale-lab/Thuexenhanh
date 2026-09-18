import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { Car, ShieldCheck, Loader, Search, X, MapPin } from 'lucide-react';

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-subtle)' }}><Loader className="spin" size={28} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--m-dark)' }}>Quản lý người dùng ({filteredUsers.length})</h3>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={18} color="var(--m-subtle)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT, địa chỉ..."
            style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: 'var(--m-surface)' }}
            onFocus={e => e.target.style.borderColor = 'var(--m-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--m-border)'}
          />
        </div>
        <select
          value={userRoleFilter}
          onChange={e => setUserRoleFilter(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none', background: 'var(--m-surface)', fontWeight: 500, color: 'var(--m-dark)', minWidth: 180 }}
        >
          <option value="all">Tất cả người dùng</option>
          <option value="has_car">Đang có xe (Chủ xe)</option>
          <option value="no_car">Chưa có xe (Khách)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filteredUsers.map(u => {
          const cCount = cars.filter(c => c.ownerId === u.id).length;
          const roleLabel = u.role?.startsWith('admin_') ? { label: 'Admin', bg: '#fef3c7', color: '#92400e' }
            : cCount > 0 ? { label: 'Chủ xe', bg: 'var(--m-primary-light)', color: 'var(--m-primary)' }
            : { label: 'Khách', bg: 'var(--m-bg)', color: 'var(--m-mid)' };
          const locationStr = [u.location?.district, u.location?.province].filter(Boolean).join(', ');
          
          return (
          <div key={u.id} style={{ background: 'var(--m-surface)', border: '1px solid var(--m-border)', borderRadius: 'var(--r-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: roleLabel.bg, color: roleLabel.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                {(u.name || u.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--m-dark)' }}>{u.name || 'Chưa cập nhật'}</span>
                  <span style={{ background: roleLabel.bg, color: roleLabel.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{roleLabel.label}</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--m-mid)', lineHeight: 1.6, marginBottom: 12 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                  {u.phone && <div>{u.phone}</div>}
                  {locationStr && <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--m-subtle)', marginTop: 4 }}><MapPin size={14} /> {locationStr}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--m-border)', paddingTop: 12 }}>
                  {cCount > 0 && <span style={{ background: 'var(--m-primary-light)', color: 'var(--m-primary)', padding: '4px 10px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Car size={14} /> {cCount} xe</span>}
                  
                  {u.cccdImage && (
                    <button onClick={() => setCccdModal(u)} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fde68a'} onMouseLeave={e => e.currentTarget.style.background = '#fef3c7'}>
                      <ShieldCheck size={14} /> Xem CCCD
                    </button>
                  )}
                  {u.cccdNumber && !u.cccdImage && <span style={{ fontFamily: 'monospace', background: 'var(--m-bg)', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: 'var(--m-mid)' }}>CCCD: {u.cccdNumber}</span>}
                  {u.phone && (
                    <a href={`https://zalo.me/${u.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ background: 'var(--m-blue-bg)', color: 'var(--m-blue)', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      Nhắn Zalo
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>);
        })}
      </div>
      {filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--m-subtle)', padding: 60, background: 'var(--m-surface)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--m-border)' }}>
          <Search size={40} color="var(--m-border)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 500 }}>Không tìm thấy người dùng phù hợp.</div>
        </div>
      )}

      {cccdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--m-surface)', borderRadius: 'var(--r-lg)', padding: 24, maxWidth: 500, width: '100%', position: 'relative', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
               <h3 style={{ margin: 0, fontSize: 18, color: 'var(--m-dark)' }}>CCCD: {cccdModal.name}</h3>
               <button onClick={() => setCccdModal(null)} style={{ background: 'var(--m-bg)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--m-dark)' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 14, marginBottom: 16, color: 'var(--m-mid)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Số CCCD: <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: 'var(--m-dark)' }}>{cccdModal.cccdNumber || 'Chưa cập nhật'}</span>
            </div>
            {cccdModal.cccdImage ? (
              <img src={cccdModal.cccdImage} style={{ width: '100%', borderRadius: 'var(--r-md)', objectFit: 'contain', background: 'var(--m-bg)' }} alt="CCCD" />
            ) : (
              <div style={{ width: '100%', padding: 40, background: 'var(--m-bg)', borderRadius: 'var(--r-md)', textAlign: 'center', color: 'var(--m-subtle)' }}>Không có ảnh CCCD</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}