import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { ModuleFrame, Toggle, Stat } from '../Shared/UIKit.jsx';
import { LocationPicker, handleOpenMap } from '../Shared/Location.jsx';
import { CarCard } from '../Cars/CarCard.jsx';
import { TopUpModal } from '../Payment/Tokens.jsx';
import { OwnerWizard, DataProtectionPolicy } from './Onboarding.jsx';

function AccountSettingsScreen({ user, onClose, onSave, cars, onToggleFavorite, onAdmin }) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const currentView = useMemo(() => {
    const path = routerLocation.pathname;
    if (path === '/cai-dat/ho-so') return 'profile';
    if (path === '/cai-dat/xe-yeu-thich') return 'favorites';
    if (path === '/cai-dat/xe-da-mo') return 'unlocked_cars';
    if (path === '/cai-dat/danh-gia') return 'reviews';
    if (path === '/cai-dat/cong-dong') return 'community';
    if (path === '/cai-dat/gop-y') return 'feedback';
    if (path === '/cai-dat/chinh-sach') return 'policy';
    if (path === '/cai-dat/chinh-sach-chi-tiet') return 'policy_details';
    if (path === '/cai-dat/mien-tru') return 'disclaimer';
    if (path === '/cai-dat/tranh-chap') return 'ugc';
    return 'menu';
  }, [routerLocation.pathname]);
  const [name, setName] = useState(user.name || "");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showIdentityInfo, setShowIdentityInfo] = useState(false);
  const isProfileComplete = !user.isGuest && user.email && user.phone && user.cccdNumber;

  useEffect(() => {
    if (currentView === "feedback" && user?.uid) {
      const unsub = onSnapshot(query(collection(db, "feedbacks"), where("userId", "==", user.uid)), (snap) => {
        const data = [];
        snap.forEach(d => data.push({ id: d.id, ...d.data() }));
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMyFeedbacks(data);
      });
      return () => unsub();
    }
  }, [currentView, user?.uid]);
  
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    if (user.isGuest) {
      window.showAlert("Vui lòng đăng nhập bằng Google để gửi góp ý.");
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await addDoc(collection(db, "feedbacks"), {
        userId: user.uid,
        userName: user.name || user.email || "Unknown",
        userEmail: user.email || "",
        text: feedbackText.trim(),
        createdAt: new Date().toISOString(),
        status: "new"
      });
      window.showAlert("Cảm ơn bạn đã đóng góp ý kiến. Chúng tôi sẽ ghi nhận và cải thiện ứng dụng!");
      setFeedbackText("");
      goBackView();
    } catch (err) {
      console.error(err);
      window.showAlert("Có lỗi xảy ra khi gửi góp ý.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  const [phone, setPhone] = useState(user.phone || "");
  const [location, setLocation] = useState(user.location || "");
  const [cccdNumber, setCccdNumber] = useState(user.cccdNumber || "");
  const [taxCode, setTaxCode] = useState(user.taxCode || "");
  const [cccdImage, setCccdImage] = useState(user.cccdImage || "");
  const [saving, setSaving] = useState(false);
  const [isUploadingCccd, setIsUploadingCccd] = useState(false);
  const cccdInputRef = useRef(null);

  const [myReviews, setMyReviews] = useState([]);
  const [myCarReports, setMyCarReports] = useState([]);
  const [myCommunityReports, setMyCommunityReports] = useState([]);
  const [activeCommunityTab, setActiveCommunityTab] = useState('car_reports');
  const [loadingReviews, setLoadingReviews] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);



  const changeView = (view) => {
    const map = {
      profile: '/cai-dat/ho-so',
      favorites: '/cai-dat/xe-yeu-thich',
      unlocked_cars: '/cai-dat/xe-da-mo',
      reviews: '/cai-dat/danh-gia',
      community: '/cai-dat/cong-dong',
      feedback: '/cai-dat/gop-y',
      policy: '/cai-dat/chinh-sach',
      policy_details: '/cai-dat/chinh-sach-chi-tiet',
      disclaimer: '/cai-dat/mien-tru',
      ugc: '/cai-dat/tranh-chap',
      menu: '/cai-dat'
    };
    if (map[view]) navigate(map[view]);
  };

  const goBackView = () => {
    if (window.history.state && window.history.state.modal === "AccountSettingsScreen" && window.history.state.view !== "menu") {
      window.history.back();
    } else {
      changeView("menu");
    }
  };

  const handleAvatarClick = () => {
    if (user.isGuest) {
      window.showAlert("Vui lòng đăng nhập để sử dụng tính năng này");
      return;
    }
    window.showConfirm(
      "Thuê Xe Nhanh khuyến khích bạn sử dụng ảnh thật cá nhân để Chủ xe và Khách thuê dễ dàng hình dung và tin tưởng nhau hơn trong quá trình giao dịch.\n\nTiếp tục tải ảnh?",
      () => {
        fileInputRef.current?.click();
      }
    );
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      
      // Dùng chung cách nén ảnh bên tải xe lên
      const uploadResult = await Core.uploadToImgBB(file);
      const url = uploadResult.thumb_url; // Use thumb_url for avatar
      
      if (!user.isGuest) {
        await updateDoc(doc(db, "users", user.uid), { avatar: url });
      }
      onSave({ ...user, avatar: url });
    } catch (err) {
      console.error("Lỗi tải ảnh:", err);
      window.showAlert("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (currentView === "reviews" && !user.isGuest) {
      setLoadingReviews(true);
      Promise.all([
        getDocs(query(collection(db, "comments"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "reports"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "community_reports"), where("userId", "==", user.uid)))
      ]).then(([snapReviews, snapCarReports, snapCommunityReports]) => {
        setMyReviews(snapReviews.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setMyCarReports(snapCarReports.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setMyCommunityReports(snapCommunityReports.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }).catch(err => console.error("Lỗi lấy dữ liệu cộng đồng:", err))
      .finally(() => setLoadingReviews(false));
    }
  }, [currentView, user.uid, user.isGuest]);

  const handleSave = async () => {
    try {
      if (user.role === 'owner' && (!cccdNumber || !cccdImage)) {
        window.showAlert("Chủ xe bắt buộc phải cung cấp Số CCCD và Hình ảnh CCCD để xác thực pháp lý.");
        return;
      }
      setSaving(true);
      if (!user.isGuest) {
        await updateDoc(doc(db, "users", user.uid), {
          name,
          phone,
          location,
          cccdNumber,
          taxCode,
          cccdImage
        });
      }
      onSave({ ...user, name, phone, location, cccdNumber, taxCode, cccdImage });
      goBackView();
    } catch (error) {
      console.error("Lỗi cập nhật tài khoản:", error);
      window.showAlert("Lỗi cập nhật tài khoản: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCccdFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCccd(true);
      
      // Áp dụng watermark cho ảnh CCCD
      const watermarkedBase64 = await applyWatermark(file);
      if (!watermarkedBase64) throw new Error("Không thể xử lý ảnh CCCD");
      
      const response = await fetch(watermarkedBase64);
      const blob = await response.blob();
      const fileToUpload = new File([blob], `cccd_${Date.now()}.jpg`, { type: "image/jpeg" });
      
      const url = await uploadFile(fileToUpload, `private/${user.uid}/cccd_${Date.now()}.jpg`);
      setCccdImage(url);
    } catch (err) {
      console.error("Lỗi tải CCCD:", err);
      window.showAlert("Có lỗi xảy ra khi tải ảnh CCCD lên.");
    } finally {
      setIsUploadingCccd(false);
      if (cccdInputRef.current) cccdInputRef.current.value = "";
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    window.showAlert("Đã copy link trang web: " + window.location.origin);
  };

  const handleSwitchRole = () => {
    const newRole = user.role === 'owner' ? 'guest' : 'owner';

    if (newRole === 'owner') {
      const performSwitch = async () => {
        try {
          setSaving(true);
          if (!user.isGuest) {
            await updateDoc(doc(db, "users", user.uid), { role: newRole });
          }
          onSave({ ...user, role: newRole });
          if (!user.ownerWizardCompleted) {
            setShowWizard(true);
          }
        } catch (error) {
          console.error("Lỗi đổi vai trò:", error);
          window.showAlert("Lỗi đổi vai trò: " + error.message);
        } finally {
          setSaving(false);
        }
      };
      performSwitch();
    } else {
      const confirmMsg = `Bạn có chắc chắn muốn chuyển sang chế độ Khách thuê?`;
      window.showConfirm(confirmMsg, async () => {
        try {
          setSaving(true);
          if (!user.isGuest) {
            await updateDoc(doc(db, "users", user.uid), { role: newRole });
          }
          onSave({ ...user, role: newRole });
          window.showAlert(`Đã chuyển sang chế độ Khách thuê`);
          onClose();
        } catch (error) {
          console.error("Lỗi đổi vai trò:", error);
          window.showAlert("Lỗi đổi vai trò: " + error.message);
        } finally {
          setSaving(false);
        }
      });
    }
  };

  const favoriteCars = cars.filter(c => user.favorites?.includes(c.id));
  const unlockedCarList = cars.filter(c => (user.unlockedCars || []).includes(c.id));

  const handleLocationChange = async (newLocation) => {
    setLocation(newLocation);
    try {
      if (!user.isGuest) {
        await updateDoc(doc(db, "users", user.uid), { location: newLocation });
      }
      onSave({ ...user, location: newLocation });
    } catch (err) {
      console.error("Lỗi cập nhật vị trí:", err);
      window.showAlert("Lỗi cập nhật vị trí: " + err.message);
    }
  };

  return (
    <ModuleFrame className="account-screen" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {currentView === "menu" && (
        <div className="account-menu">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="icon-button" onClick={onClose}><ChevronLeft size={20}/></button>
              <h2 style={{ margin: 0, fontSize: 20 }}>Tài khoản</h2>
            </div>
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 8, padding: 4, border: '1px solid var(--m-border)' }}>
              <button 
                style={{ padding: '6px 12px', border: 'none', background: user.role !== 'owner' ? '#fff' : 'transparent', borderRadius: 6, fontSize: 13, fontWeight: user.role !== 'owner' ? 600 : 500, color: user.role !== 'owner' ? 'var(--m-primary)' : 'var(--m-subtle)', boxShadow: user.role !== 'owner' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => user.role === 'owner' && handleSwitchRole()}
              >Khách thuê</button>
              <button 
                style={{ padding: '6px 12px', border: 'none', background: user.role === 'owner' ? '#fff' : 'transparent', borderRadius: 6, fontSize: 13, fontWeight: user.role === 'owner' ? 600 : 500, color: user.role === 'owner' ? 'var(--m-primary)' : 'var(--m-subtle)', boxShadow: user.role === 'owner' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => user.role !== 'owner' && handleSwitchRole()}
              >Chủ xe</button>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--m-border)' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={user.avatar} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', opacity: isUploadingAvatar ? 0.5 : 1 }} />
              <button 
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--m-primary)', color: '#fff', border: '2px solid #fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              >
                {isUploadingAvatar ? <Loader size={14} className="spin" /> : <Edit3 size={14} />}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAvatarFile} accept="image/*" style={{ display: 'none' }} />
            </div>
            <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--m-dark)' }}>{user.name || user.email}</div>
            <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>Vai trò: {user.role === 'owner' ? 'Chủ xe' : 'Khách thuê'}</div>
            {user.createdAt && (
              <div style={{ fontSize: 12, color: 'var(--m-subtle)', marginTop: 4 }}>Tham gia từ: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            {user?.role?.startsWith('admin_') && onAdmin && (
              <button className="menu-btn" onClick={onAdmin} style={{ color: 'var(--m-primary)' }}>Trang Quản trị viên</button>
            )}
            
            <div style={{ padding: 16, background: 'linear-gradient(135deg, var(--m-primary) 0%, #1e3a8a 100%)', borderRadius: 12, color: '#fff', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 12px rgba(10, 49, 97, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
                  <BadgeCheck size={16} /> Token dịch vụ (Tokens)
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {user.tokens || 0} <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.8 }}>Token</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => setShowTopUp(true)} style={{ background: '#fff', color: 'var(--m-primary)', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} /> Nạp Token ngay
                </button>
              </div>
            </div>
            
            {showTopUp && <TopUpModal user={user} onClose={() => setShowTopUp(false)} onSave={onSave} />}
            <button className="menu-btn" onClick={() => changeView("profile")}>Cập nhật hồ sơ</button>
            <button className="menu-btn" onClick={() => changeView("favorites")}>Xe yêu thích ({favoriteCars.length})</button>
            <button className="menu-btn" onClick={() => changeView("unlocked_cars")}>Xe đã mở liên hệ ({unlockedCarList.length})</button>
            <button className="menu-btn" onClick={() => changeView("reviews")}>Xây dựng cộng đồng</button>
            <button className="menu-btn" onClick={() => changeView("feedback")}>Góp ý phát triển ứng dụng</button>
            <button className="menu-btn" onClick={handleCopyLink}>Giới thiệu bạn bè (Copy Link)</button>
            <button className="menu-btn" onClick={() => changeView("policy")}>Chính sách bảo vệ dữ liệu</button>
            <button className="menu-btn" onClick={() => changeView("disclaimer")}>Miễn trừ trách nhiệm & An toàn</button>
            <button className="menu-btn" onClick={() => changeView("ugc")}>Điều khoản xử lý tranh chấp (UGC)</button>
            <button className="menu-btn" style={{ color: 'var(--m-red)' }} onClick={() => {
              window.showConfirm("Bạn có chắc chắn muốn yêu cầu xóa tài khoản? Tài khoản sẽ bị khóa ngay lập tức và xóa vĩnh viễn sau 60 ngày.", async () => {
                try {
                  await updateDoc(doc(db, "users", user.uid), { status: 'INACTIVE_PENDING_DELETE' });
                  window.showAlert("Đã ghi nhận yêu cầu. Hệ thống sẽ tiến hành xóa dữ liệu theo quy định.");
                  await logout();
                  window.location.reload();
                } catch (e) {
                  window.showAlert("Lỗi yêu cầu xóa: " + e.message);
                }
              });
            }}>Xóa tài khoản</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--m-subtle)' }}>
            Phiên bản thử nghiệm v07.26.2
          </div>
        </div>
      )}

      {currentView === "profile" && (
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid var(--m-border)', boxShadow: 'var(--shadow-sm)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--m-border)' }}>
             <button className="icon-button" onClick={() => goBackView()}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Cập nhật hồ sơ</h2>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div className="search-box" style={{ margin: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', opacity: 0.8 }}>
              <label style={{ width: '90px', flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)', margin: 0 }}>Email</label>
              <input type="email" style={{ flex: 1, border: 'none', background: 'transparent', width: '100%', fontSize: 15, fontWeight: 500, color: 'var(--m-subtle)', outline: 'none', cursor: 'not-allowed' }} value={user.email || ""} readOnly />
             </div>
             <div className="search-box" style={{ margin: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ width: '90px', flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)', margin: 0 }}>Tên hiển thị</label>
              <input type="text" style={{ flex: 1, border: 'none', background: 'transparent', width: '100%', fontSize: 15, fontWeight: 500, color: 'var(--m-dark)', outline: 'none' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên hiển thị..." />
             </div>
             <div className="search-box" style={{ margin: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ width: '90px', flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                SĐT
              </label>
              <input type="tel" style={{ flex: 1, border: 'none', background: 'transparent', width: '100%', fontSize: 15, fontWeight: 500, color: 'var(--m-dark)', outline: 'none' }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập SĐT Zalo của bạn..." />
              {phone ? (
                (phone.trim().length >= 10 && phone.trim().startsWith('0')) ? (
                  <CheckCircle2 size={18} color="var(--m-green)" />
                ) : (
                  <XCircle size={18} color="var(--m-red)" />
                )
              ) : null}
             </div>
             
             <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
               <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)' }}>Khu vực:</label>
               <div style={{ border: '1px solid var(--m-border)', borderRadius: 'var(--r-md)', padding: '8px', background: '#f8fafc' }}>
                 <LocationPicker 
                   label="" 
                   value={location} 
                   onChange={handleLocationChange}
                 />
               </div>
               <p style={{ fontSize: 12, color: 'var(--m-subtle)', margin: 0, marginTop: 4 }}>Cập nhật khu vực sẽ tự động lưu.</p>
             </div>

             <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <h3 style={{ margin: 0, fontSize: 15, color: 'var(--m-dark)' }}>Thông tin Định danh Pháp lý</h3>
                 <button onClick={() => setShowIdentityInfo(true)} style={{ background: 'transparent', border: 'none', color: 'var(--m-primary)', cursor: 'pointer', padding: 0, display: 'flex' }} title="Tìm hiểu về định danh pháp lý">
                   <HelpCircle size={16} />
                 </button>
               </div>
               <p style={{ margin: 0, fontSize: 13, color: 'var(--m-subtle)' }}>Chủ xe bắt buộc cung cấp để đăng bài. Khách thuê không bắt buộc.</p>
               
               <div className="search-box" style={{ margin: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ width: '90px', flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)', margin: 0 }}>Số CCCD</label>
                <input type="text" style={{ flex: 1, border: 'none', background: 'transparent', width: '100%', fontSize: 15, fontWeight: 500, color: 'var(--m-dark)', outline: 'none' }} value={cccdNumber} onChange={(e) => setCccdNumber(e.target.value)} placeholder="Nhập 12 số CCCD..." maxLength={12} />
               </div>

               <div className="search-box" style={{ margin: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ width: '90px', flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)', margin: 0 }}>Mã số thuế</label>
                <input type="text" style={{ flex: 1, border: 'none', background: 'transparent', width: '100%', fontSize: 15, fontWeight: 500, color: 'var(--m-dark)', outline: 'none' }} value={taxCode} onChange={(e) => setTaxCode(e.target.value)} placeholder="Nhập mã số thuế (nếu có)..." />
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                 <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)' }}>Ảnh mặt trước CCCD / GPLX</label>
                 <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                   {cccdImage && (
                     <div style={{ position: 'relative', width: 100, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--m-border)' }}>
                       <img src={cccdImage} alt="CCCD" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <button onClick={() => setCccdImage("")} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} /></button>
                     </div>
                   )}
                   <button onClick={() => cccdInputRef.current?.click()} disabled={isUploadingCccd} style={{ padding: '8px 16px', border: '1px dashed var(--m-border)', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--m-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                     {isUploadingCccd ? <Loader size={16} className="spin" /> : <Upload size={16} />}
                     {cccdImage ? 'Tải ảnh khác' : 'Tải ảnh lên'}
                   </button>
                   <input type="file" ref={cccdInputRef} onChange={handleCccdFile} accept="image/*" style={{ display: 'none' }} />
                 </div>
                 <p style={{ margin: 0, fontSize: 12, color: 'var(--m-subtle)' }}>Ảnh sẽ tự động được đóng dấu watermark bảo mật trước khi lưu.</p>
               </div>
             </div>

             <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
              <button className="secondary" style={{ flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 600, borderRadius: 'var(--r-md)' }} onClick={() => goBackView()}>Hủy</button>
              <button className="primary" style={{ flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 600, borderRadius: 'var(--r-md)' }} onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
             </div>
           </div>
        </div>
      )}

      {currentView === "favorites" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => goBackView()}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Xe yêu thích</h2>
           </div>
           {favoriteCars.length === 0 ? (
             <p style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40 }}>Chưa có xe yêu thích nào.</p>
           ) : (
             <div className="car-grid">
               {favoriteCars.map(car => (
                 <CarCard key={car.id} car={car} isWeekend={false} currentUser={user} adminMode={false} onView={() => window.showAlert("Tính năng xem chi tiết đang phát triển")} onMap={handleOpenMap} liked={true} onToggleLike={() => onToggleFavorite(car.id)} />
               ))}
             </div>
           )}
        </div>
      )}

      {currentView === "unlocked_cars" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => goBackView()}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Xe đã mở liên hệ</h2>
           </div>
           {unlockedCarList.length === 0 ? (
             <p style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40 }}>Bạn chưa dùng Token để mở liên hệ xe nào.</p>
           ) : (
             <div className="car-grid">
               {unlockedCarList.map(car => (
                 <CarCard key={car.id} car={car} isWeekend={false} currentUser={user} adminMode={false} onView={() => window.showAlert("Tính năng xem chi tiết đang phát triển")} onMap={handleOpenMap} liked={user.favorites?.includes(car.id)} onToggleLike={() => onToggleFavorite(car.id)} />
               ))}
             </div>
           )}
        </div>
      )}

      {currentView === "reviews" && (
        <div style={{ paddingBottom: 40 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
             <button className="icon-button" onClick={() => goBackView()}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Xây dựng cộng đồng</h2>
           </div>
           
           <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
             {['car_reports', 'community_reports', 'reviews'].map(tab => {
               const labels = { car_reports: 'Báo cáo xe', community_reports: 'Báo cáo cộng đồng', reviews: 'Đánh giá' };
               return (
                 <button key={tab} onClick={() => setActiveCommunityTab(tab)} style={{ padding: '8px 16px', borderRadius: 99, border: 'none', background: activeCommunityTab === tab ? 'var(--m-primary)' : 'var(--m-surface)', color: activeCommunityTab === tab ? '#fff' : 'var(--m-mid)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                   {labels[tab]}
                 </button>
               );
             })}
           </div>

           {loadingReviews ? (
             <div style={{ textAlign: 'center', padding: 24, color: 'var(--m-subtle)' }}>Đang tải...</div>
           ) : (
             <>
               {activeCommunityTab === 'car_reports' && (
                 myCarReports.length === 0 ? (
                   <div style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40, padding: 24, background: 'var(--m-surface)', borderRadius: 12, border: '1px solid var(--m-border)' }}>
                     <AlertTriangle size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                     <p>Bạn chưa gửi báo cáo xe nào.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     {myCarReports.map(rep => {
                       const isResolved = rep.status === 'resolved';
                       return (
                         <div key={rep.id} style={{ background: '#fff', border: '1px solid var(--m-border)', borderRadius: 12, padding: 16 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                             <strong style={{ fontSize: 14 }}>{rep.carName || 'Xe vi phạm'}</strong>
                             {isResolved ? <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Đã xử lý</span> : <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Đang xử lý</span>}
                           </div>
                           {rep.reportCategory && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--m-primary)', marginBottom: 4 }}>{rep.reportCategory}</div>}
                           <div style={{ fontSize: 13, color: 'var(--m-mid)', marginBottom: 8 }}>{rep.reason}</div>
                           <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>{new Date(rep.createdAt).toLocaleDateString('vi-VN')}</div>
                         </div>
                       );
                     })}
                   </div>
                 )
               )}

               {activeCommunityTab === 'community_reports' && (
                 myCommunityReports.length === 0 ? (
                   <div style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40, padding: 24, background: 'var(--m-surface)', borderRadius: 12, border: '1px solid var(--m-border)' }}>
                     <ShieldAlert size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                     <p>Bạn chưa gửi báo cáo cộng đồng nào.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     {myCommunityReports.map(rep => {
                       const isResolved = rep.status === 'resolved';
                       return (
                         <div key={rep.id} style={{ background: '#fff', border: '1px solid var(--m-border)', borderRadius: 12, padding: 16 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                             <strong style={{ fontSize: 14 }}>{rep.category || 'Báo cáo'}</strong>
                             {isResolved ? <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Đã xử lý</span> : <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Đang xử lý</span>}
                           </div>
                           <div style={{ fontSize: 13, color: 'var(--m-mid)', marginBottom: 8 }}>{rep.content}</div>
                           <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>{new Date(rep.createdAt).toLocaleDateString('vi-VN')}</div>
                         </div>
                       );
                     })}
                   </div>
                 )
               )}

               {activeCommunityTab === 'reviews' && (
                 myReviews.length === 0 ? (
                   <div style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40, padding: 24, background: 'var(--m-surface)', borderRadius: 12, border: '1px solid var(--m-border)' }}>
                     <Star size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                     <p>Bạn chưa có đánh giá nào.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                     {myReviews.map(review => {
                        const targetCar = cars.find(c => c.id === review.carId);
                        return (
                          <div key={review.id} style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <strong style={{ fontSize: 14 }}>{targetCar ? (targetCar.basicInfo?.brand + ' ' + targetCar.basicInfo?.model) : 'Xe đã xóa'}</strong>
                              <span style={{ fontSize: 12, color: 'var(--m-subtle)' }}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={12} fill={star <= review.rating ? "var(--m-amber)" : "none"} color={star <= review.rating ? "var(--m-amber)" : "var(--m-border)"} strokeWidth={star <= review.rating ? 0 : 2} />
                              ))}
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--m-mid)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{review.text}</p>
                          </div>
                        );
                     })}
                   </div>
                 )
               )}
             </>
           )}
        </div>
      )}

      {currentView === "policy" && (
        <DataProtectionPolicy 
          currentUser={user} 
          onSave={onSave} 
          onBack={() => goBackView()} 
          onViewDetails={() => changeView("policy_details")} 
        />
      )}

      {currentView === "feedback" && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => goBackView()}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Hòm thư góp ý</h2>
           </div>
           <div style={{ fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, background: '#fff', padding: 20, borderRadius: 16, border: '1px solid var(--m-border)', boxShadow: 'var(--shadow-sm)' }}>
             <p style={{ marginBottom: 16 }}>Mọi ý kiến đóng góp của bạn đều rất quý giá, giúp chúng tôi phát triển ứng dụng tốt hơn mỗi ngày. Xin cảm ơn!</p>
             <textarea 
                className="search-box" 
                style={{ width: '100%', height: 120, resize: 'none', marginBottom: 16, padding: 12 }} 
                placeholder="Nhập nội dung góp ý của bạn..." 
                value={feedbackText} 
                onChange={e => setFeedbackText(e.target.value)} 
             />
             <button className="primary" style={{ width: '100%', opacity: isSubmittingFeedback || !feedbackText.trim() ? 0.5 : 1 }} disabled={isSubmittingFeedback || !feedbackText.trim()} onClick={handleSubmitFeedback}>
               {isSubmittingFeedback ? "Đang gửi..." : "Gửi góp ý"}
             </button>
           </div>
           
           {myFeedbacks.length > 0 && (
             <div style={{ marginTop: 24, padding: 20, background: '#fff', borderRadius: 16, border: '1px solid var(--m-border)', boxShadow: 'var(--shadow-sm)' }}>
               <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Lịch sử góp ý của bạn</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {myFeedbacks.map(f => (
                   <div key={f.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                       <span style={{ fontSize: 12, color: 'var(--m-subtle)' }}>{new Date(f.createdAt).toLocaleString('vi-VN')}</span>
                       {f.status === 'new' ? (
                         <span style={{ fontSize: 12, color: 'var(--m-amber)', fontWeight: 'bold' }}>Chờ xem</span>
                       ) : (
                         <span style={{ fontSize: 12, color: 'var(--m-primary)', fontWeight: 'bold' }}>Đã xem</span>
                       )}
                     </div>
                     <p style={{ margin: 0, fontSize: 14, color: 'var(--m-dark)' }}>{f.text}</p>
                   </div>
                 ))}
               </div>
             </div>
           )}

        </div>
      )}
      
      {currentView === "policy_details" && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => changeView("policy")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Chính sách bảo vệ dữ liệu</h2>
           </div>
           <div style={{ fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, background: '#fff', padding: 20, borderRadius: 16, border: '1px solid var(--m-border)', boxShadow: 'var(--shadow-sm)' }}>
             <h3 style={{marginTop: 0, color: 'var(--m-primary)', fontSize: 16}}>1. Chính sách bảo vệ dữ liệu cá nhân</h3>
             <p style={{ fontWeight: 600, marginBottom: 8 }}>1.1 Thu thập thông tin</p>
             <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
               <li><strong>Thông tin định danh:</strong> Họ tên, Số điện thoại, Email, Hình đại diện.</li>
               <li><strong>Thông tin xác thực:</strong> Giấy phép lái xe, CMND/CCCD (khi cần thiết).</li>
               <li><strong>Dữ liệu hoạt động:</strong> Lịch sử thuê xe, vị trí tìm kiếm xe, các đánh giá.</li>
             </ul>

             <p style={{ fontWeight: 600, marginBottom: 8 }}>1.2 Mục đích xử lý dữ liệu</p>
             <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
               <li><strong>Cung cấp dịch vụ:</strong> Kết nối Chủ xe và Khách thuê, hỗ trợ đặt xe.</li>
               <li><strong>Thực hiện nghĩa vụ pháp lý:</strong> Xác minh danh tính và điều kiện thuê xe theo đúng quy định.</li>
               <li><strong>Cải thiện dịch vụ:</strong> Gửi thông tin khuyến mãi và nâng cấp trải nghiệm người dùng.</li>
             </ul>

             <p style={{ fontWeight: 600, marginBottom: 8 }}>1.3 Cam kết bảo mật</p>
             <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
               <li>Mọi dữ liệu của bạn được lưu trữ an toàn và mã hóa trên hệ thống máy chủ (Firebase) theo tiêu chuẩn quốc tế.</li>
               <li>Chúng tôi <strong>không bán hay trao đổi</strong> dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích thương mại.</li>
             </ul>

             <h3 style={{color: 'var(--m-primary)', fontSize: 16, marginTop: 24}}>2. Điều Khoản Sử Dụng</h3>
             <p style={{ fontWeight: 600, marginBottom: 8 }}>2.1 Quyền và Trách nhiệm của Khách Thuê</p>
             <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
               <li>Khách thuê có trách nhiệm cung cấp thông tin trung thực (Bằng lái xe, CMND/CCCD hợp lệ).</li>
               <li>Khách thuê phải chịu trách nhiệm về mọi chi phí xăng xe, phí cầu đường, phạt vi phạm giao thông phát sinh trong thời gian thuê.</li>
               <li>Cam kết bảo quản tài sản của Chủ xe, không sử dụng xe vào mục đích vi phạm pháp luật.</li>
             </ul>

             <p style={{ fontWeight: 600, marginBottom: 8 }}>2.2 Quyền và Trách nhiệm của Chủ Xe</p>
             <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
               <li>Cung cấp xe đúng trạng thái, biển số, hình ảnh như đã đăng trên nền tảng.</li>
               <li>Xe phải đảm bảo an toàn kỹ thuật, có đầy đủ giấy tờ hợp lệ (Bảo hiểm, Đăng kiểm).</li>
               <li>Chủ xe có quyền từ chối cho thuê nếu phát hiện Khách thuê không đủ điều kiện an toàn hoặc giấy tờ không hợp lệ.</li>
             </ul>

             <p style={{ fontWeight: 600, marginBottom: 8 }}>2.3 Miễn trừ trách nhiệm của Nền tảng</p>
             <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
               <li>Thuê Xe Nhanh đóng vai trò là <strong>trung gian thông tin</strong> kết nối. Chúng tôi không phải là bên trực tiếp sở hữu phương tiện hoặc cung cấp dịch vụ vận tải.</li>
               <li>Chúng tôi <strong>không chịu trách nhiệm pháp lý</strong> đối với bất kỳ thiệt hại, mất mát tài sản hay tranh chấp nào phát sinh trực tiếp giữa Chủ Xe và Khách Thuê.</li>
             </ul>
           </div>
        </div>
      )}

      {currentView === "disclaimer" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => goBackView()}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Miễn trừ trách nhiệm & An toàn</h2>
           </div>
           
           <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--m-border)', marginBottom: 20 }}>
             <h3 style={{ fontSize: 16, color: 'var(--m-red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
               <ShieldAlert size={18} /> Miễn trừ trách nhiệm
             </h3>
             <ul style={{ paddingLeft: 20, fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
               <li>Nền tảng này hoạt động <strong>hoàn toàn như một trung gian thông tin</strong> kết nối Chủ xe và Khách thuê.</li>
               <li>Chúng tôi <strong>không xác minh danh tính, bằng lái, giấy tờ xe, hay tình trạng xe thực tế</strong> của bất kỳ cá nhân nào tham gia.</li>
               <li>Chúng tôi <strong>không can thiệp, không xử lý tranh chấp, không chịu trách nhiệm</strong> cho bất kỳ thiệt hại, mất mát, tai nạn, hay rủi ro pháp lý nào phát sinh trong quá trình giao dịch và thuê xe.</li>
               <li>Việc giao dịch, đặt cọc, và ký hợp đồng là sự thỏa thuận tự nguyện giữa Chủ xe và Khách thuê. Bạn hoàn toàn tự chịu trách nhiệm với quyết định của mình.</li>
             </ul>
           </div>

           <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 12, border: '1px solid #bbf7d0' }}>
             <h3 style={{ fontSize: 16, color: 'var(--m-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
               <Info size={18} /> Mẹo giao dịch an toàn
             </h3>
             <ul style={{ paddingLeft: 20, fontSize: 14, color: '#166534', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
               <li><strong>Kiểm tra kỹ giấy tờ:</strong> Luôn yêu cầu xem giấy tờ xe bản gốc (Cà vẹt, Đăng kiểm, Bảo hiểm) và CCCD/GPLX của người giao dịch trước khi giao xe hoặc giao tiền.</li>
               <li><strong>Kiểm tra xe thực tế:</strong> Chụp ảnh và quay video toàn bộ tình trạng xe (trầy xước, nội thất, đồng hồ km, vạch xăng) trước khi nhận xe và sau khi trả xe.</li>
               <li><strong>Làm hợp đồng rõ ràng:</strong> Luôn phải có hợp đồng thuê xe bằng văn bản minh bạch về giá cả, tiền cọc, và quy định phạt.</li>
               <li><strong>Cẩn thận với cọc trực tuyến:</strong> Hạn chế chuyển cọc trước cho những xe có giá rẻ bất thường hoặc chủ xe có dấu hiệu mập mờ, hối thúc.</li>
               <li><strong>Sử dụng tính năng Báo cáo:</strong> Nếu phát hiện xe lừa đảo hoặc thông tin sai lệch, hãy sử dụng nút Báo cáo trên trang chi tiết xe để chúng tôi xem xét xóa bỏ.</li>
             </ul>
           </div>
        </div>
      )}
      {currentView === "ugc" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => goBackView()}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Điều khoản xử lý tranh chấp & Miễn trừ trách nhiệm (UGC)</h2>
           </div>
           
           <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--m-border)', marginBottom: 20 }}>
             <ol style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
               <li>Người dùng (Chủ xe) khi đăng tải thông tin, hình ảnh, bài viết lên nền tảng cam kết và tự chịu trách nhiệm hoàn toàn về bản quyền hợp pháp đối với các hình ảnh và nội dung đó.</li>
               <li>Ban quản trị tôn trọng quyền sở hữu trí tuệ của các bên. Nếu phát hiện bất kỳ hình ảnh hoặc nội dung nào vi phạm bản quyền thuộc sở hữu của bạn được đăng tải trái phép trên hệ thống, vui lòng gửi thông báo kèm bằng chứng sở hữu đến email: support@vnigo.sbs. Chúng tôi sẽ tiến hành xác minh và hạ gỡ nội dung vi phạm trong vòng 24 giờ làm việc.</li>
               <li>Trong mọi trường hợp, nền tảng được miễn trừ toàn bộ trách nhiệm bồi thường thiệt hại liên quan đến tranh chấp bản quyền sở hữu trí tuệ phát sinh giữa các bên thứ ba sử dụng dịch vụ.</li>
             </ol>
           </div>
        </div>
      )}

      {showWizard && (
        <OwnerWizard
          onClose={() => setShowWizard(false)} 
          onFinish={async () => {
            setShowWizard(false);
            if (!user.isGuest && !user.ownerWizardCompleted && isProfileComplete) {
              await updateDoc(doc(db, "users", user.uid), { ownerWizardCompleted: true });
              onSave({ ...user, ownerWizardCompleted: true });
            }
            onClose();
          }}
          onGoToProfile={() => changeView("profile")} 
          isGuest={user.isGuest} 
          isComplete={isProfileComplete} 
        />
      )}

      {showIdentityInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeIn 0.3s ease-out', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'var(--m-primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)' }} />
            
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 16, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--m-primary)', marginBottom: 20 }}>
              <ShieldCheck size={24} />
            </div>
            
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--m-dark)' }}>Cam kết bảo mật & Sử dụng dữ liệu</h2>
            
            <div style={{ fontSize: 14, color: 'var(--m-mid)', lineHeight: 1.6, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0 }}>Nền tảng Vnigo thu thập Thông tin định danh pháp lý (CCCD, Mã số thuế, Hình ảnh) của Chủ xe với các mục đích duy nhất sau:</p>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Xác minh danh tính:</strong> Đảm bảo 100% Chủ xe trên hệ thống là người thật, nâng cao uy tín cộng đồng.</li>
                <li><strong>Hỗ trợ pháp lý:</strong> Giải quyết các sự cố, tranh chấp, hoặc vi phạm pháp luật phát sinh trong quá trình cho thuê.</li>
              </ul>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--m-border)' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--m-dark)' }}>Cam kết của chúng tôi:</p>
                <p style={{ margin: 0, marginTop: 4 }}>Dữ liệu của bạn được lưu trữ mã hóa an toàn trên hệ thống máy chủ quốc tế. Vnigo tuyệt đối <strong>không bán, chia sẻ hoặc sử dụng</strong> thông tin này cho bất kỳ mục đích thương mại, quảng cáo nào khác ngoài phạm vi cung cấp dịch vụ của nền tảng.</p>
              </div>
            </div>

            <button className="primary" style={{ width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600, borderRadius: 12, background: 'linear-gradient(135deg, var(--m-primary), #6366f1)', border: 'none' }} onClick={() => setShowIdentityInfo(false)}>
              Đã hiểu và đồng ý
            </button>
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}

export { AccountSettingsScreen };

function SetLocationPopup({ currentUser, onSave, onClose }) {
  const [province, setProvince] = useState(currentUser?.location?.province || "");
  const [district, setDistrict] = useState(currentUser?.location?.district || "");
  const [saving, setSaving] = useState(false);

  const districts = provinceDistricts[province] || [];

  const handleSave = async () => {
    if (!province) {
      window.showAlert("Vui lòng chọn tỉnh/thành");
      return;
    }
    setSaving(true);
    try {
      const updatedUser = {
        ...currentUser,
        location: { province, district }
      };
      if (!currentUser.isGuest) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          location: { province, district }
        });
      }
      onSave(updatedUser);
    } catch (err) {
      window.showAlert("Lỗi lưu vị trí: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--m-bg)', padding: 24, borderRadius: 16, width: '90%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, color: 'var(--m-dark)' }}>Chọn khu vực của bạn</h3>
        <p style={{ margin: '0 0 20px', color: 'var(--m-mid)', fontSize: 14 }}>Để tìm xe gần nhất, vui lòng chọn tỉnh/thành và quận/huyện bạn đang ở.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); }} style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 15, background: 'var(--m-surface)', appearance: 'none', paddingRight: 32 }}>
            <option value="" disabled hidden>Chọn Tỉnh/Thành</option>
            {locationProvinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {districts.length > 0 && (
            <select value={district} onChange={e => setDistrict(e.target.value)} style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 15, background: 'var(--m-surface)', appearance: 'none', paddingRight: 32 }}>
              <option value="">Chọn Quận/Huyện (Không bắt buộc)</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid var(--m-border)', borderRadius: 8, background: 'transparent', fontWeight: 600, cursor: 'pointer', color: 'var(--m-mid)' }}>Hủy</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: 'var(--m-blue)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <RefreshCcw className="spin" size={16} /> : <Save size={16} />} Lưu vị trí
          </button>
        </div>
      </div>
    </div>
  );
}

export { SetLocationPopup };
