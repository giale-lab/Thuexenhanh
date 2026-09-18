import React, { useState, useEffect } from 'react';
import { collection, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { CarDetailModal } from '../../cars.jsx';
import { Loader } from 'lucide-react';

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader className="spin" size={24} /></div>;

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Quản lý xe ({cars.length} xe)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cars.map(c => (
          <div key={c.id} style={{ background: 'var(--m-surface)', border: '1px solid var(--m-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--m-dark)' }}>{c.basicInfo?.brand} {c.basicInfo?.model} {c.basicInfo?.year}</div>
              <div style={{ fontSize: 13, color: 'var(--m-subtle)', marginTop: 4 }}>Biển số: <span style={{fontFamily:'monospace'}}>{c.basicInfo?.plate || c.id}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelectedCar(c)} style={{ background: 'var(--m-bg)', color: 'var(--m-dark)', border: '1px solid var(--m-border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Xem chi tiết</button>
              <button onClick={() => {
                window.showConfirm('Bạn có chắc chắn muốn xóa xe này khỏi hệ thống vĩnh viễn?', async () => {
                  try {
                    await deleteDoc(doc(db, 'cars', c.id));
                    window.showAlert('Đã xóa xe thành công!');
                  } catch (err) {
                    window.showAlert('Lỗi xóa: ' + err.message);
                  }
                });
              }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
      
      {selectedCar && <CarDetailModal car={selectedCar} adminMode={true} currentUser={currentUser} onClose={() => setSelectedCar(null)} onEdit={() => { window.showAlert('Vui lòng quay lại giao diện cá nhân để sửa xe.'); setSelectedCar(null); }} />}
    </div>
  );
}