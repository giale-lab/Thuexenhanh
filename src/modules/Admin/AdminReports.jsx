import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { ShieldAlert, MessageSquare, AlertTriangle, Check, Loader } from 'lucide-react';

export function AdminReports({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('reports');

  useEffect(() => {
    let r1 = false, r2 = false, r3 = false;
    const check = () => { if (r1 && r2 && r3) setLoading(false); };

    const u1 = onSnapshot(collection(db, 'reports'), snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
      r1 = true; check();
    });
    const u2 = onSnapshot(collection(db, 'community_reports'), snap => {
      setCommunityReports(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
      r2 = true; check();
    });
    const u3 = onSnapshot(collection(db, 'feedbacks'), snap => {
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
      r3 = true; check();
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  const handleResolve = async (collectionName, id, field = 'status', value = 'resolved') => {
    window.showConfirm('Đánh dấu là đã xử lý?', async () => {
      await updateDoc(doc(db, collectionName, id), { [field]: value, resolvedAt: new Date().toISOString(), resolvedBy: currentUser.email });
      window.showAlert('Đã cập nhật trạng thái.');
    });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader className="spin" size={24} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--m-border)', paddingBottom: 12 }}>
        <button onClick={() => setSubTab('reports')} style={{ background: subTab==='reports'?'var(--m-blue)':'transparent', color: subTab==='reports'?'#fff':'var(--m-mid)', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>Báo cáo xe</button>
        <button onClick={() => setSubTab('community')} style={{ background: subTab==='community'?'var(--m-blue)':'transparent', color: subTab==='community'?'#fff':'var(--m-mid)', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>Vi phạm cộng đồng</button>
        <button onClick={() => setSubTab('feedbacks')} style={{ background: subTab==='feedbacks'?'var(--m-blue)':'transparent', color: subTab==='feedbacks'?'#fff':'var(--m-mid)', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>Góp ý</button>
      </div>

      {subTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.length === 0 ? <p>Không có báo cáo.</p> : reports.map(r => (
            <div key={r.id} style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)' }}>
              <div style={{ fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16}/> {r.reason}</div>
              <p style={{ margin: '8px 0', fontSize: 14 }}>{r.details}</p>
              <div style={{ fontSize: 12, color: 'var(--m-subtle)', marginBottom: 12 }}>Xe ID: {r.carId} • Tố cáo bởi: {r.reporterEmail || r.reporterId} • {new Date(r.createdAt).toLocaleString()}</div>
              {r.status === 'pending' ? (
                <button onClick={() => handleResolve('reports', r.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Đánh dấu đã xử lý</button>
              ) : <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}><Check size={14} style={{ verticalAlign: 'middle' }}/> Đã xử lý</span>}
            </div>
          ))}
        </div>
      )}

      {subTab === 'community' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {communityReports.length === 0 ? <p>Không có báo cáo vi phạm.</p> : communityReports.map(r => (
            <div key={r.id} style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)' }}>
              <div style={{ fontWeight: 600, color: '#9333ea', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={16}/> {r.reason}</div>
              <p style={{ margin: '8px 0', fontSize: 14 }}>{r.details}</p>
              {r.evidence && <img src={r.evidence} alt="Bằng chứng" style={{ maxWidth: 200, borderRadius: 8, marginTop: 8 }} />}
              <div style={{ fontSize: 12, color: 'var(--m-subtle)', margin: '12px 0' }}>SĐT/Email vi phạm: {r.violatorInfo} • Tố cáo bởi: {r.reporterEmail || r.reporterId} • {new Date(r.createdAt).toLocaleString()}</div>
              {r.status === 'pending' ? (
                <button onClick={() => handleResolve('community_reports', r.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Đánh dấu đã xử lý</button>
              ) : <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}><Check size={14} style={{ verticalAlign: 'middle' }}/> Đã xử lý</span>}
            </div>
          ))}
        </div>
      )}

      {subTab === 'feedbacks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feedbacks.length === 0 ? <p>Không có góp ý.</p> : feedbacks.map(r => (
            <div key={r.id} style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)' }}>
              <div style={{ fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={16}/> Khách hàng góp ý</div>
              <p style={{ margin: '8px 0', fontSize: 14 }}>{r.content}</p>
              <div style={{ fontSize: 12, color: 'var(--m-subtle)', marginBottom: 12 }}>Từ: {r.userEmail || r.userId} • {new Date(r.createdAt).toLocaleString()}</div>
              {(!r.status || r.status === 'new') ? (
                <button onClick={() => handleResolve('feedbacks', r.id, 'status', 'read')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Đánh dấu đã xem</button>
              ) : <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}><Check size={14} style={{ verticalAlign: 'middle' }}/> Đã xem</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}