import React, { useState, useEffect } from 'react';
import { collection, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { CarDetailModal } from '../../cars.jsx';
import { Loader, Trash2, Eye, ShieldCheck, MapPin } from 'lucide-react';
import { formatCurrency, statusText } from '../../core.js';

export function AdminCars({ currentUser }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);

  useEffect(() => {
    const unsubCars = onSnapshot(collection(db, 'cars'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCars(data);
      setLoading(false);
    });
    return () => unsubCars();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-subtle)' }}><Loader className="spin" size={28} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--m-dark)' }}>Quản lý xe ({cars.length} xe)</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {cars.map(c => {
          const image = c.images?.[0]?.thumb_url || c.images?.[0]?.url;
          const statusColors = c.rentalInfo?.status === 'available' 
            ? { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' } 
            : { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };

          return (
          <div key={c.id} style={{ background: 'var(--m-surface)', border: '1px solid var(--m-border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ height: 160, width: '100%', background: 'var(--m-bg)', position: 'relative' }}>
               {image ? (
                 <img src={image} alt="Car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader size={20} className="spin" color="var(--m-subtle)" /></div>
               )}
               <div style={{ position: 'absolute', top: 12, right: 12, background: statusColors.bg, color: statusColors.text, border: `1px solid ${statusColors.border}`, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                 {statusText(c.rentalInfo?.status || 'available')}
               </div>
               {c.status?.isVerified && (
                 <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--m-surface)', color: 'var(--m-primary)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                   <ShieldCheck size={14} /> Đã duyệt
                 </div>
               )}
            </div>
            
            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--m-dark)', marginBottom: 4 }}>
                {c.basicInfo?.brand} {c.basicInfo?.model} {c.basicInfo?.year}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--m-subtle)', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {c.rentalInfo?.pickupLocation?.split(',')[0]}</span>
                <span style={{ fontFamily: 'monospace', background: 'var(--m-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--m-dark)', fontWeight: 600 }}>{c.basicInfo?.plate || c.id.slice(0,6)}</span>
              </div>
              
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--m-primary)', marginBottom: 16 }}>
                 {formatCurrency(c.rentalInfo?.dayPrice)}<span style={{ fontSize: 13, color: 'var(--m-subtle)', fontWeight: 500 }}>/ngày</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto' }}>
                <button onClick={() => setSelectedCar(c)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--m-primary-light)', color: 'var(--m-primary)', border: 'none', borderRadius: 'var(--r-sm)', padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
                  <Eye size={16} /> Xem
                </button>
                <button onClick={() => {
                  window.showConfirm('Bạn có chắc chắn muốn xóa xe này khỏi hệ thống vĩnh viễn?', async () => {
                    try {
                      await deleteDoc(doc(db, 'cars', c.id));
                      window.showAlert('Đã xóa xe thành công!');
                    } catch (err) {
                      window.showAlert('Lỗi xóa: ' + err.message);
                    }
                  });
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 'var(--r-sm)', padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      
      {selectedCar && <CarDetailModal car={selectedCar} adminMode={true} currentUser={currentUser} onClose={() => setSelectedCar(null)} onEdit={() => { window.showAlert('Vui lòng quay lại giao diện cá nhân để sửa xe.'); setSelectedCar(null); }} />}
    </div>
  );
}