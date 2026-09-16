import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from "./firebase";
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import "./styles.css";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Line } from 'recharts';

import { isWeekendRange, ADMIN_EMAILS, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from './core.js';
import { AppLogo, SearchLocationPicker, ErrorBoundary, LazyImage, SkeletonCard, ImageSlider, ModuleFrame, StatusBadge, Field, Toggle, LocationPicker, DepositField, FilterCheckboxGroup, FilterToggle, FilterSelect, Stat, ImageUploadOptimizer, InfoPanel, MapModal, handleOpenMap } from './shared.jsx';
import { Overview, CarCard, CarDetailModal, AddCarForm, DateTimePickerModal, BlockedDatesManager } from './cars.jsx';
import { LoginScreen, AccountSettingsScreen, QuyCheModal, TopUpModal, OwnerWizard, SetLocationPopup, UpgradeModal, FaqModal, CommunityModal, DataProtectionPolicy } from './auth.jsx';

function AdminDashboard({ cars, currentUser, onClose, onDeleteCar }) {
  const [tab, setTab] = useState('stats');
  const [selectedCar, setSelectedCar] = useState(null);
  const [requests, setRequests] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [resolvingReportId, setResolvingReportId] = useState(null);
  const [communityReports, setCommunityReports] = useState([]);
  const [loadingCommunityReports, setLoadingCommunityReports] = useState(true);
  const [resolvingCommunityId, setResolvingCommunityId] = useState(null);

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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'upgrade_requests'), (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(data);
      setLoadingReqs(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setUsers(data);
      setLoadingUsers(false);
    }, (error) => {
      console.warn("Không thể tải users trong Dashboard", error);
      setLoadingUsers(false);
    });

    const unsubReports = onSnapshot(collection(db, 'reports'), (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(data);
      setLoadingReports(false);
    }, (error) => {
      console.warn("Không thể tải reports", error);
      setLoadingReports(false);
    });

    const unsubFeedbacks = onSnapshot(collection(db, 'feedbacks'), (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFeedbacks(data);
    }, (error) => {
      console.warn("Không thể tải feedbacks", error);
    });

    const unsubCommunityReports = onSnapshot(collection(db, 'community_reports'), (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCommunityReports(data);
      setLoadingCommunityReports(false);
    }, () => setLoadingCommunityReports(false));

    return () => {
      unsubUsers();
      unsubReports();
      unsubCommunityReports();
    };
  }, []);

  const handleApprove = async (req) => {
    if (!req.carId) {
      window.showAlert('Không có ID xe để kích hoạt. Vui lòng xác nhận thủ công.');
      return;
    }
    setApprovingId(req.id);
    try {
      const carRef = doc(db, 'cars', req.carId);
      const planId = req.carData?.plan;
      let expiryISO = null;
      if (planId === '1m') {
        const d = new Date(); d.setMonth(d.getMonth() + 1);
        expiryISO = d.toISOString();
      } else if (planId === '3m') {
        const d = new Date(); d.setMonth(d.getMonth() + 3);
        expiryISO = d.toISOString();
      }
      await updateDoc(carRef, {
        'status.isVerified': true,
        'status.verifiedPlan': planId,
        'status.verifiedExpiry': expiryISO,
        updatedAt: new Date().toISOString().slice(0, 10)
      });
      await updateDoc(doc(db, 'upgrade_requests', req.id), { status: 'approved' });
      
      // Admin Log: Approve Profile/Request
      try {
        await addDoc(collection(db, "admin_logs"), {
          admin_id: currentUser.uid,
          admin_email: currentUser.email || "",
          action_type: 'APPROVE_PROFILE',
          target_user_id: req.carData?.ownerId || "unknown",
          target_car_id: req.carId || "unknown",
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("Lỗi ghi Admin Log:", err);
      }
      
      window.showAlert('✅ Đã kích hoạt Gói Tối ưu cho xe ' + (req.carData?.plate || req.carId));
      
      // Auto-open mailto link for admin to send email
      const statusText = (status) => {
        switch (status) {
          case 'available': return 'Sẵn sàng';
          case 'maintenance': return 'Bảo dưỡng';
          case 'rented': return 'Đang thuê';
          default: return 'Không xác định';
        }
      };

      const handleOpenMap = (location) => {
        if (location) {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`, '_blank');
        }
      };
      
      const carInfo = cars.find(c => c.id === req.carId);
      const ownerEmail = carInfo?.ownerInfo?.email || req.carData?.ownerEmail;
      if (ownerEmail) {
        const ownerName = carInfo?.ownerInfo?.name || req.carData?.ownerName || 'bạn';
        const plate = carInfo?.basicInfo?.plate || req.carData?.plate || req.carId;
        const subject = encodeURIComponent(`Thông báo: Xe ${plate} đã được kích hoạt Gói Tối Ưu`);
        const body = encodeURIComponent(`Chào ${ownerName},\n\nYêu cầu kích hoạt Gói Tối Ưu cho xe ${plate} của bạn đã được duyệt thành công.\n\nTrân trọng,\nBQT Thuê Xe Nhanh`);
        window.open(`mailto:${ownerEmail}?subject=${subject}&body=${body}`, '_blank');
      }
    } catch (err) {
      console.error(err);
      window.showAlert('Lỗi kích hoạt: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (reqId) => {
    setRejectingId(reqId);
    try {
      await updateDoc(doc(db, 'upgrade_requests', reqId), { status: 'rejected' });
      window.showAlert('Dã từ chối yêu cầu.');
    } catch (err) {
      window.showAlert('Lỗi: ' + err.message);
    } finally {
      setRejectingId(null);
    }
  };

  const handleResolveReport = async (reportId) => {
    setResolvingReportId(reportId);
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      window.showAlert('Đã đánh dấu báo cáo là đã xử lý.');
    } catch (err) {
      window.showAlert('Lỗi: ' + err.message);
    } finally {
      setResolvingReportId(null);
    }
  };

  const handleDeleteCarFromReport = async (carId, reportId) => {
    window.showConfirm('Bạn có chắc chắn muốn XÓA xe này khỏi hệ thống không?', async () => {
      try {
        await deleteDoc(doc(db, 'cars', carId));
        await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
        window.showAlert('Đã xóa xe vi phạm thành công!');
      } catch (err) {
        window.showAlert('Lỗi xóa xe: ' + err.message);
      }
    });
  };

  const handleViewCccd = async (u) => {
    try {
      await addDoc(collection(db, "admin_logs"), {
        admin_id: currentUser.uid,
        admin_email: currentUser.email || "",
        action_type: 'VIEW_CCCD',
        target_user_id: u.id,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Lỗi ghi log", e);
    }
    if (u.cccdImage) {
      window.open(u.cccdImage, '_blank');
    }
  };

  const ownerCount = users.filter(u => u.role === 'owner').length;
  const guestCount = users.filter(u => u.role === 'guest').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  const filteredUsers = users.filter(u => {
    const cCount = cars.filter(c => c.ownerId === u.id).length;
    const matchRole = userRoleFilter === 'all' || (userRoleFilter === 'has_car' && cCount > 0) || (userRoleFilter === 'no_car' && cCount === 0);
    const q = userSearch.toLowerCase();
    const locationStr = [u.location?.province, u.location?.district].filter(Boolean).join(' ').toLowerCase();
    const matchQ = !q
      || (u.name || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (u.phone || '').toLowerCase().includes(q)
      || locationStr.includes(q);
    return matchRole && matchQ;
  });

  const statusBadge = (status) => {
    if (status === 'approved') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Đã duyệt</span>;
    if (status === 'rejected') return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Từ chối</span>;
    return <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Chờ duyệt</span>;
  };

  return (
    <div className="app-shell" style={{ maxWidth: 1000, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header */}
      <ModuleFrame className="topbar">
        <div className="brand-mark">
          <Shield size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Trang Quản trị</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--m-subtle)' }}>Xin chào, {currentUser.name} · {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </ModuleFrame>

      {/* Tabs */}
      <ModuleFrame className="tabs" style={{ marginBottom: 12 }}>
        <button className={tab === 'stats' ? 'selected' : ''} onClick={() => setTab('stats')}><TrendingUp size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Thống kê</button>
        <button className={tab === 'cars' ? 'selected' : ''} onClick={() => setTab('cars')}><Car size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Quản lý xe</button>
        <button className={tab === 'users' ? 'selected' : ''} onClick={() => setTab('users')}><Users size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Người dùng</button>
        <button className={tab === 'reports' ? 'selected' : ''} onClick={() => setTab('reports')}>
          <AlertTriangle size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Báo cáo xe
          {reports.filter(r => r.status === 'pending').length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 11, padding: '1px 6px', marginLeft: 5 }}>{reports.filter(r => r.status === 'pending').length}</span>}
        </button>
        <button className={tab === 'community' ? 'selected' : ''} onClick={() => setTab('community')}>
          <Shield size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Cộng đồng
          {communityReports.filter(r => r.status === 'pending').length > 0 && <span style={{ background: '#8b5cf6', color: '#fff', borderRadius: 99, fontSize: 11, padding: '1px 6px', marginLeft: 5 }}>{communityReports.filter(r => r.status === 'pending').length}</span>}
        </button>
        <button className={tab === 'feedbacks' ? 'selected' : ''} onClick={() => setTab('feedbacks')}>
          <MessageSquare size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Góp ý
          {feedbacks.filter(r => r.status === 'new').length > 0 && <span style={{ background: 'var(--m-primary)', color: '#fff', borderRadius: 99, fontSize: 11, padding: '1px 6px', marginLeft: 5 }}>{feedbacks.filter(r => r.status === 'new').length}</span>}
        </button>
      </ModuleFrame>

      {/* Stats Tab */}
      {tab === 'stats' && (
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
        )}

        {/* Cars Tab */}

      {tab === 'cars' && (
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
                      const carDocId = c.id;
                      console.log('[AdminDelete] Attempting to delete car ID:', carDocId, '| car object:', JSON.stringify({id: c.id, brand: c.basicInfo?.brand, plate: c.basicInfo?.plate}));
                      try {
                        await deleteDoc(doc(db, 'cars', carDocId));
                        console.log('[AdminDelete] Firestore deleteDoc SUCCESS for:', carDocId);
                        window.showAlert('Đã xóa xe thành công!');
                      } catch (err) {
                        console.error('[AdminDelete] Firestore deleteDoc FAILED:', err.code, err.message);
                        window.showAlert('Lỗi xóa: [' + err.code + '] ' + err.message);
                      }
                    });
                  }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

            {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại, địa chỉ..."
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
          {loadingUsers ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner"></div></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredUsers.map(u => {
                const cCount = cars.filter(c => c.ownerId === u.id).length;
                const roleLabel = u.role === 'admin' ? { label: 'Admin', bg: '#fef3c7', color: '#92400e' }
                  : cCount > 0 ? { label: 'Chủ xe', bg: '#dbeafe', color: '#1d4ed8' }
                  : { label: 'Khách', bg: '#f3f4f6', color: '#4b5563' };
                const locationStr = [u.location?.province, u.location?.district].filter(Boolean).join(' – ');
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
                        {u.phone ? (
                          <a href={`https://zalo.me/${u.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png" alt="Zalo" style={{ width: 12, height: 12 }} /> Đã liên kết Zalo
                          </a>
                        ) : (
                          <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>⚠️ Chưa có SĐT</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--m-subtle)', lineHeight: 1.7 }}>
                        <span>✉️ {u.email}</span>
                        {u.phone && <span style={{ marginLeft: 10 }}>📞 {u.phone}</span>}
                        {locationStr && <span style={{ marginLeft: 10 }}>📍 {locationStr}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--m-subtle)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span>Tham gia: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}</span>
                        {cCount > 0 && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}><Car size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{cCount} xe</span>}
                        {u.cccdImage && (
                          <button onClick={() => handleViewCccd(u)} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Báo cáo xe vi phạm</h3>
          {loadingReports ? (
            <p style={{ color: 'var(--m-subtle)', textAlign: 'center', padding: 40 }}>Đang tải...</p>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--m-subtle)' }}>
              <ShieldAlert size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Chưa có báo cáo nào.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map(rep => {
                const isResolved = rep.status === 'resolved';
                const catColor = {
                  '\ud83d\udcde S\u0110T kh\u00f4ng \u0111\u00fang': '#2563eb', '\ud83d\ude98 Bi\u1ec3n s\u1ed1 sai/gi\u1ea3': '#7c3aed',
                  '\ud83d\udcf7 \u1ea2nh xe kh\u00f4ng th\u1eadt': '#0891b2', '\ud83d\udcb0 Gi\u00e1 \u1ea3o / ph\u00ed \u1ea9n': '#d97706',
                  '\ud83d\udcdd Th\u00f4ng tin sai l\u1ec7ch': '#4b5563', '\u26a0\ufe0f L\u1eeba \u0111\u1ea3o / gian l\u1eadn': '#dc2626',
                  '\ud83d\udea9 N\u1ed9i dung kh\u00f4ng ph\u00f9 h\u1ee3p': '#9333ea'
                };
                return (
                  <div key={rep.id} style={{ background: 'var(--m-surface)', border: isResolved ? '1px solid var(--m-border)' : '1px solid #ef4444', borderRadius: 12, padding: 18, opacity: isResolved ? 0.75 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          {isResolved ? (
                            <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Đã xử lý</span>
                          ) : (
                            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Cần xử lý</span>
                          )}
                          {rep.reportCategory && (
                            <span style={{ background: '#ede9fe', color: catColor[rep.reportCategory] || '#6d28d9', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{rep.reportCategory}</span>
                          )}
                          <span style={{ fontSize: 12, color: 'var(--m-subtle)' }}>{rep.createdAt ? new Date(rep.createdAt).toLocaleString('vi-VN') : ''}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-dark)', marginBottom: 4 }}>
                          {rep.carName || 'Không rõ xe'}{rep.carPlate && <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '1px 7px', borderRadius: 6, fontSize: 13, marginLeft: 8 }}>{rep.carPlate}</span>}
                        </div>
                        {rep.reason && rep.reason !== rep.reportCategory && (
                          <div style={{ fontSize: 13, color: 'var(--m-mid)', lineHeight: 1.5, marginBottom: 6 }}>
                            <strong>Chi tiết:</strong> {rep.reason}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--m-subtle)' }}>
                          👤 {rep.userName || 'N/A'}
                          {rep.carId && <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 12 }}>ID: {rep.carId}</span>}
                        </div>
                      </div>
                      {!isResolved && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                          <button
                            onClick={() => handleResolveReport(rep.id)}
                            disabled={resolvingReportId === rep.id}
                            style={{ background: 'var(--m-surface)', color: 'var(--m-dark)', border: '1px solid var(--m-border)', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <Check size={15} /> Bỏ qua
                          </button>
                          <button
                            onClick={() => handleDeleteCarFromReport(rep.carId, rep.id)}
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <Trash2 size={15} /> Xóa xe
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Community Reports Tab */}
      {tab === 'feedbacks' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h2>Hòm thư góp ý ({feedbacks.length})</h2>
          {feedbacks.length === 0 ? (
            <p style={{ color: 'var(--m-subtle)' }}>Chưa có góp ý nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {feedbacks.map(f => (
                <div key={f.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--m-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: 15 }}>{f.userName}</strong>
                      <span style={{ fontSize: 12, color: 'var(--m-subtle)' }}>{f.userEmail} • {new Date(f.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    {f.status === 'new' && <span className="status-badge available">Mới</span>}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--m-dark)', margin: '8px 0', whiteSpace: 'pre-wrap' }}>{f.text}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {f.status === 'new' && (
                      <button className="primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={async () => {
                        await updateDoc(doc(db, 'feedbacks', f.id), { status: 'read' });
                        setFeedbacks(prev => prev.map(p => p.id === f.id ? { ...p, status: 'read' } : p));
                      }}>Đánh dấu đã đọc</button>
                    )}
                    <button className="icon-button" style={{ color: 'var(--m-red)' }} onClick={async () => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa góp ý này?")) {
                        await deleteDoc(doc(db, 'feedbacks', f.id));
                        setFeedbacks(prev => prev.filter(p => p.id !== f.id));
                      }
                    }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {tab === 'community' && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Báo cáo cộng đồng</h3>
          {loadingCommunityReports ? (
            <p style={{ color: 'var(--m-subtle)', textAlign: 'center', padding: 40 }}>Đang tải...</p>
          ) : communityReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--m-subtle)' }}>
              <Shield size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Chưa có báo cáo cộng đồng nào.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {communityReports.map(rep => {
                const isResolved = rep.status === 'resolved';
                const isDismissed = rep.status === 'dismissed';
                const reportTypeLabels = {
                  phone_fake: '📞 SĐT không đúng', plate_fake: '🚘 Biển số xe sai',
                  photo_fake: '📷 Ảnh xe giả', price_scam: '💰 Giá ảo/phí ẩn',
                  deposit_refused: '🔒 Bùng tiền cọc', fraud: '⚠️ Lừa đảo nghiêm trọng',
                  harassment: '🚫 Quấy rối/đe dọa', other: '❓ Khác'
                };
                return (
                  <div key={rep.id} style={{ background: 'var(--m-surface)', border: isResolved || isDismissed ? '1px solid var(--m-border)' : '1px solid #8b5cf6', borderRadius: 12, padding: 18, opacity: isResolved || isDismissed ? 0.75 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          {isResolved ? (
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Đã xử lý</span>
                          ) : isDismissed ? (
                            <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Bỏ qua</span>
                          ) : (
                            <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Cần xử lý</span>
                          )}
                          <span style={{ background: rep.targetType === 'owner' ? '#dbeafe' : '#fef3c7', color: rep.targetType === 'owner' ? '#1d4ed8' : '#92400e', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                            {rep.targetType === 'owner' ? '🚗 Chủ xe' : '👤 Khách thuê'}
                          </span>
                          <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 10px', borderRadius: 99, fontSize: 12 }}>
                            {reportTypeLabels[rep.reportType] || rep.reportType}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--m-subtle)', marginLeft: 'auto' }}>{rep.createdAt ? new Date(rep.createdAt).toLocaleString('vi-VN') : ''}</span>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
                          <strong>Mô tả:</strong> {rep.description}
                        </div>
                        {rep.evidenceText && (
                          <div style={{ fontSize: 13, color: 'var(--m-mid)', marginBottom: 4 }}>
                            <strong>Bằng chứng:</strong> {rep.evidenceText}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--m-mid)' }}>
                          <strong>Người báo cáo:</strong> {rep.userName}
                          {rep.contactBack && <span> · <strong>Liên hệ lại:</strong> {rep.contactBack}</span>}
                        </div>
                      </div>
                      {!isResolved && !isDismissed && (
                        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                          <button
                            onClick={async () => {
                              setResolvingCommunityId(rep.id);
                              try { await updateDoc(doc(db, 'community_reports', rep.id), { status: 'resolved' }); }
                              catch(e) { window.showAlert('Lỗi: ' + e.message); }
                              finally { setResolvingCommunityId(null); }
                            }}
                            disabled={resolvingCommunityId === rep.id}
                            style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <Check size={14} /> Đã xử lý
                          </button>
                          <button
                            onClick={async () => {
                              try { await updateDoc(doc(db, 'community_reports', rep.id), { status: 'dismissed' }); }
                              catch(e) { window.showAlert('Lỗi: ' + e.message); }
                            }}
                            style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <X size={14} /> Bỏ qua
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {selectedCar && <CarDetailModal car={selectedCar} adminMode={true} currentUser={currentUser} onClose={() => setSelectedCar(null)} onEdit={() => { window.showAlert('Vui lòng quay lại giao diện cá nhân để sửa xe.'); setSelectedCar(null); }} />}
    </div>
  );
}

export { AdminDashboard };

