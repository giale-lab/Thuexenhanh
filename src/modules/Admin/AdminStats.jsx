import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { Car, Users, User, Eye, Phone } from 'lucide-react';
import { ModuleFrame } from '../Shared/UIKit.jsx';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Line } from 'recharts';

export function AdminStats({ currentUser }) {
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let carsData = [];
    let usersData = [];
    let carsLoaded = false;
    let usersLoaded = false;

    const checkDone = () => {
      if (carsLoaded && usersLoaded) {
        setCars(carsData);
        setUsers(usersData);
        setLoading(false);
      }
    };

    const unsubCars = onSnapshot(collection(db, 'cars'), snap => {
      carsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      carsLoaded = true;
      checkDone();
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      usersLoaded = true;
      checkDone();
    });

    return () => {
      unsubCars();
      unsubUsers();
    };
  }, []);

  const ownerCount = users.filter(u => u.role === 'owner').length;
  const guestCount = users.filter(u => u.role === 'guest' || !u.role).length;
  const totalViews = cars.reduce((sum, car) => sum + (car.status?.viewCount || 0), 0);
  const totalContactClicks = cars.reduce((sum, car) => sum + (car.status?.contactClickCount || 0), 0);

  const chartData = useMemo(() => {
    const dates = {};
    const addDate = (dString, type) => {
      if (!dString) return;
      try {
        const date = new Date(dString).toISOString().split('T')[0];
        if (!dates[date]) dates[date] = { date, cars: 0, users: 0 };
        dates[date][type]++;
      } catch (e) {}
    };
    cars.forEach(c => addDate(c.createdAt, 'cars'));
    users.forEach(u => addDate(u.createdAt, 'users'));
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date));
  }, [cars, users]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải thống kê...</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
            { label: 'Tổng xe', value: cars.length, icon: <Car size={22} color="var(--m-primary)" />, bg: '#dcfce7' },
            { label: 'Chủ xe', value: ownerCount, icon: <User size={22} color="#2563eb" />, bg: '#dbeafe' },
            { label: 'Khách thuê', value: guestCount, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe' },
            { label: 'Lượt xem xe', value: totalViews, icon: <Eye size={22} color="#0284c7" />, bg: '#e0f2fe' },
            { label: 'Click Zalo/Gọi', value: totalContactClicks, icon: <Phone size={22} color="#ea580c" />, bg: '#ffedd5' },
          ].map((s, i) => (
          <ModuleFrame key={i} style={{ padding: "16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: s.bg, borderRadius: 10, padding: 10, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--m-dark)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--m-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
            </div>
          </ModuleFrame>
        ))}
      </div>

      <div style={{ marginTop: 24, background: '#fff', padding: 24, borderRadius: 12, border: '1px solid var(--m-border)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Tốc độ tăng trưởng theo thời gian</h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#9ca3af" />
              <YAxis tick={{fontSize: 12}} stroke="#9ca3af" axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Legend iconType="circle" wrapperStyle={{fontSize: 13, paddingTop: 10}} />
              <Line type="monotone" name="Xe mới đăng" dataKey="cars" stroke="var(--m-primary)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              <Line type="monotone" name="Người dùng mới" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}