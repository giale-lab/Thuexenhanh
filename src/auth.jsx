import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from "./firebase";
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import "./styles.css";

import * as Core from './core.js';
import * as Shared from './shared.jsx';
import * as Cars from './cars.jsx';
const { isWeekendRange } = Core;
const { ADMIN_EMAILS } = Core;
const { STORAGE_KEY } = Core;
const { carModelsData } = Core;
const { brandOptions } = Core;
const { colorOptions } = Core;
const { seatOptions } = Core;
const { yearOptions } = Core;
const { bodyStyleOptions } = Core;
const { AMENITY_OPTIONS } = Core;
const { provinceDistricts } = Core;
const { locationProvinces } = Core;
const { locationOptions } = Core;
const { operatingAreaOptions } = Core;
const { seedCars } = Core;
const { emptyForm } = Core;
const { getFieldGroups } = Core;
const { formatCompactDateTime } = Core;
const { formatShortDate } = Core;
const { getDaysInMonth } = Core;
const { getFirstDayOfMonth } = Core;
const { toLocalKey } = Core;
const { VN_DAYS } = Core;
const { fmtRangeDate } = Core;
const { fmtRangeLabel } = Core;
const { getCarWeight } = Core;
const { sorters } = Core;
const { inferSmartFilters } = Core;
const { activeChips } = Core;
const { validateCar } = Core;
const { getOwnerInfo } = Core;
const { phoneDigits } = Core;
const { blobToDataUrl } = Core;
const { getAtPath } = Core;
const { setAtPath } = Core;
const { clone } = Core;
const { normalizeCarForm } = Core;
const { normalize } = Core;
const { unique } = Core;
const { formatCurrency } = Core;
const { fmtNum } = Core;
const { statusText } = Core;
const { formatBusyDates } = Core;
const { today } = Core;
const { delay } = Core;
const { AppLogo } = Shared;
const { SearchLocationPicker } = Shared;
const { ErrorBoundary } = Shared;
const { LazyImage } = Shared;
const { SkeletonCard } = Shared;
const { ImageSlider } = Shared;
const { ModuleFrame } = Shared;
const { StatusBadge } = Shared;
const { Field } = Shared;
const { Toggle } = Shared;
const { LocationPicker } = Shared;
const { DepositField } = Shared;
const { FilterCheckboxGroup } = Shared;
const { FilterToggle } = Shared;
const { FilterSelect } = Shared;
const { Stat } = Shared;
const { ImageUploadOptimizer } = Shared;
const { InfoPanel } = Shared;
const { MapModal } = Shared;
const { handleOpenMap } = Shared;
const { Overview } = Cars;
const { CarCard } = Cars;
const { CarDetailModal } = Cars;
const { AddCarForm } = Cars;
const { DateTimePickerModal } = Cars;
const { BlockedDatesManager } = Cars;

function LoginScreen({ onLogin, showToast }) {
  const toast = showToast || ((msg) => alert(msg));
  const [step, setStep] = useState("google");
  const [userData, setUserData] = useState(null);
  
  // Phone Auth states
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedPolicy, setAgreedPolicy] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showQuyChe, setShowQuyChe] = useState(false);

  useEffect(() => {
    if (phoneMode) {
      setupRecaptcha('recaptcha-container');
    }
  }, [phoneMode]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!agreedPolicy) return toast("Vui lòng đồng ý với Quy chế hoạt động & Chính sách bảo mật");
    if (!phoneNumber) return toast("Vui lòng nhập số điện thoại");
    setIsLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('0') ? '+84' + phoneNumber.slice(1) : phoneNumber;
      const result = await signInWithPhone(formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      toast("Đã gửi mã OTP!");
    } catch (error) {
      console.error(error);
      toast("Lỗi gửi SMS: " + error.message);
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) return toast("Vui lòng nhập mã OTP");
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      await handleSuccessfulLogin(user);
    } catch (error) {
      console.error(error);
      toast("Mã OTP không hợp lệ!");
    }
    setIsLoading(false);
  };

  const handleSuccessfulLogin = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      window.appLog?.('info', 'Kiểm tra user doc trên Firestore...');
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        let role = data.role;
        if (user.email && ADMIN_EMAILS.includes(user.email)) role = 'admin';
        window.appLog?.('success', `User cũ: ${user.uid} | role: ${role}`);
        onLogin({
          uid: user.uid,
          name: data.name || user.displayName || user.phoneNumber,
          email: data.email || user.email || "",
          avatar: user.photoURL || data.avatar,
          role: role,
          emailVerified: data.emailVerified || false,
          favorites: data.favorites || [],
          agreedPolicy: data.agreedPolicy || false,
          phone: data.phone || user.phoneNumber || "",
          location: data.location || "",
          createdAt: data.createdAt || user.metadata?.creationTime
        });
      } else {
        let role = "guest";
        if (user.email && ADMIN_EMAILS.includes(user.email)) role = 'admin';
        window.appLog?.('info', `User mới: ${user.uid} | tạo doc với role: ${role}`);
        const nowIso = new Date().toISOString();
        const newUserData = {
          uid: user.uid,
          name: user.displayName || user.phoneNumber,
          email: user.email || "",
          avatar: user.photoURL || null,
          role: role,
          emailVerified: user.emailVerified || false,
          favorites: [],
          agreedPolicy: false,
          phone: user.phoneNumber || "",
          location: "",
          tokens: user.email ? 50 : 0,
          createdAt: nowIso
        };
        await setDoc(doc(db, "users", user.uid), {
          ...newUserData
        });
        window.appLog?.('success', 'Tạo user doc thành công!');
        onLogin(newUserData);
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      toast("Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối.");
    }
  };

  const handleGoogleLogin = async () => {
    if (!agreedPolicy) {
      toast("Vui lòng đồng ý với Quy chế hoạt động & Chính sách bảo mật");
      return;
    }
    try {
      window.appLog?.('info', 'Bắt đầu đăng nhập Google...');
      const user = await signInWithGoogle();
      window.appLog?.('info', `Google OK: ${user.email} (uid: ${user.uid})`);
      await handleSuccessfulLogin(user);
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      window.appLog?.('error', `Lỗi đăng nhập: ${error.code || ''} — ${error.message}`);
      toast("Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-left">
        <div className="brand" style={{ gap: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--login-brand-mb, 24px)', marginTop: 'var(--login-brand-mt, 12px)' }}>
          <img src="/logo-white.png" alt="Logo Thuê Xe Nhanh" style={{ width: '100%', maxWidth: 'var(--login-logo-max-width, 220px)', height: 'auto', objectFit: 'contain' }} />
          <h2 style={{ margin: 0, fontSize: 'var(--login-brand-size, 26px)', letterSpacing: '0.5px', fontWeight: 700 }}>Thuê Xe Nhanh</h2>
        </div>
        <div className="login-hero-text" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--login-hero-gap, 12px)', textAlign: 'left', maxWidth: 400, margin: '0 auto', marginTop: 'var(--login-hero-mt, -12px)' }}>
          <h1 style={{ fontSize: 'var(--login-title-size, clamp(28px, 7.5vw, 38px))', margin: 0, lineHeight: 1.1, textAlign: 'center', marginBottom: 8 }}>Thuê xe tự lái<br/>siêu tốc & tiện lợi</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--login-usps-gap, 8px)' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ width: 22, textAlign: 'center', flexShrink: 0, fontSize: 15, lineHeight: '18px' }}>🌟</span>
              <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.3 }}><b>0% Phí Hoa Hồng:</b> Chủ xe giữ trọn 100% doanh thu, khách thuê được giá tốt nhất.</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ width: 22, textAlign: 'center', flexShrink: 0, fontSize: 15, lineHeight: '18px' }}>👥</span>
              <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.3 }}><b>Kết nối trực tiếp:</b> Tự do trao đổi, không bị làm phiền bởi môi giới trung gian.</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ width: 22, textAlign: 'center', flexShrink: 0, fontSize: 15, lineHeight: '18px' }}>⚡</span>
              <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.3 }}><b>Thao tác Siêu tốc:</b> Đăng xe, tìm xe và chốt giao dịch cực nhanh chỉ trong 1 phút.</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <ShieldCheck size={15} color="#fff" style={{ width: 22, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.3 }}><b>Không phụ phí ẩn:</b> Giá hiển thị là giá cuối cùng, nói không với các loại phí ảo.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-box" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
          
          {!phoneMode ? (
            <>
              <button className="google-btn" onClick={handleGoogleLogin}>
                <svg width="24" height="24" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Tiếp tục với Google
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '10px 0', color: 'var(--m-subtle)' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--m-border)' }}></div>
                <span style={{ padding: '0 10px', fontSize: 13 }}>HOẶC</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--m-border)' }}></div>
              </div>

              <button className="phone-btn" onClick={() => setPhoneMode(true)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--m-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, fontWeight: 500, color: 'var(--m-dark)' }}>
                <Phone size={20} color="var(--m-primary)" />
                Đăng nhập bằng Số điện thoại
              </button>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, cursor: 'pointer', textAlign: 'left' }}>
                <input type="checkbox" checked={agreedPolicy} onChange={e => setAgreedPolicy(e.target.checked)} style={{ marginTop: 4, width: 16, height: 16, accentColor: 'var(--m-primary)' }} />
                <span style={{ fontSize: 12, color: 'var(--m-subtle)', lineHeight: 1.4 }}>
                  Tôi đã đọc và đồng ý với <a href="#" onClick={(e) => { e.preventDefault(); setShowQuyChe(true); }} style={{ color: 'var(--m-primary)', textDecoration: 'none', fontWeight: 500 }}>Quy chế hoạt động</a> &amp; <a href="#" onClick={(e) => { e.preventDefault(); setShowPolicy(true); }} style={{ color: 'var(--m-primary)', textDecoration: 'none', fontWeight: 500 }}>Chính sách bảo mật</a> của Vnigo.
                </span>
              </label>
            </>
          ) : (
            <div style={{ width: '100%' }}>
              <button onClick={() => {setPhoneMode(false); setConfirmationResult(null);}} style={{ background: 'none', border: 'none', color: 'var(--m-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 20, fontSize: 14 }}>
                <ChevronLeft size={16} /> Quay lại
              </button>
              
              {!confirmationResult ? (
                <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Nhập số điện thoại</h3>
                  <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="09xxxx..." style={{ padding: 12, borderRadius: 8, border: '1px solid var(--m-border)', fontSize: 16 }} autoFocus />
                  <div id="recaptcha-container"></div>
                  <button type="submit" disabled={isLoading} className="primary-btn" style={{ width: '100%' }}>{isLoading ? "Đang gửi..." : "Gửi mã OTP"}</button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Nhập mã OTP</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--m-subtle)' }}>Mã OTP đã được gửi đến {phoneNumber}</p>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Nhập 6 số..." style={{ padding: 12, borderRadius: 8, border: '1px solid var(--m-border)', fontSize: 16, letterSpacing: 2, textAlign: 'center' }} autoFocus maxLength={6} />
                  <button type="submit" disabled={isLoading} className="primary-btn" style={{ width: '100%' }}>{isLoading ? "Đang xác thực..." : "Xác nhận OTP"}</button>
                </form>
              )}
            </div>
          )}

          <button className="skip-btn" style={{ background: 'none', border: 'none', color: 'var(--m-subtle)', cursor: 'pointer', fontSize: 14, marginTop: 10 }} onClick={() => {
            onLogin({
              name: "Khách Xem Thử",
              email: "demo@thuexe.vnigo.sbs",
              avatar: "/guest-avatar.png",
              isGuest: true,
              role: "guest"
            });
          }}>
            Bỏ qua đăng nhập, xem thử
          </button>
        </div>
      </div>
      
      {showPolicy && (
        <DataProtectionPolicy 
          isModal 
          onBack={() => setShowPolicy(false)}
          onConfirmSuccess={() => { setShowPolicy(false); setAgreedPolicy(true); }}
        />
      )}
      {showQuyChe && (
        <QuyCheModal 
          onClose={() => setShowQuyChe(false)} 
          onAccept={() => { setShowQuyChe(false); setAgreedPolicy(true); }} 
        />
      )}
    </div>
  );
}

export { LoginScreen };

function AccountSettingsScreen({ user, onClose, onSave, cars, onToggleFavorite, onAdmin }) {
  const [currentView, setCurrentView] = useState("menu");
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

  const currentViewRef = useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    window.history.pushState({ modal: "AccountSettingsScreen", view: "menu" }, "");
    const handlePopState = (e) => {
      if (e.state && e.state.modal === "AccountSettingsScreen") {
        setCurrentView(e.state.view || "menu");
      } else {
        if (onCloseRef.current) onCloseRef.current();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state && window.history.state.modal === "AccountSettingsScreen") {
        window.history.back();
      }
    };
  }, []);

  const changeView = (view) => {
    window.history.pushState({ modal: "AccountSettingsScreen", view }, "");
    setCurrentView(view);
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
            {ADMIN_EMAILS.includes(user.email) && onAdmin && (
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
          onGoToProfile={() => setCurrentView("profile")} 
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

function QuyCheModal({ onClose, onAccept }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 24, animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="icon-button" onClick={onClose}><ChevronLeft size={20}/></button>
          <h2 style={{ margin: 0, fontSize: 20 }}>Quy chế hoạt động</h2>
        </div>

        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid var(--m-border)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, color: 'var(--m-primary)', marginBottom: 12 }}>I. Quy định chung</h3>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <li>Mọi thành viên tham gia nền tảng (bao gồm Chủ xe và Khách thuê) phải cung cấp thông tin trung thực, chính xác.</li>
            <li>Nghiêm cấm sử dụng nền tảng cho các mục đích vi phạm pháp luật, lừa đảo, hoặc gây rối trật tự.</li>
            <li>Nền tảng đóng vai trò là cầu nối thông tin, không can thiệp vào quá trình giao dịch, ký hợp đồng hay thanh toán giữa các bên.</li>
          </ul>

          <h3 style={{ fontSize: 16, color: 'var(--m-primary)', marginBottom: 12 }}>II. Điều khoản xử lý tranh chấp & Miễn trừ trách nhiệm (UGC)</h3>
          <ol style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li>Người dùng (Chủ xe) khi đăng tải thông tin, hình ảnh, bài viết lên nền tảng cam kết và tự chịu trách nhiệm hoàn toàn về bản quyền hợp pháp đối với các hình ảnh và nội dung đó.</li>
            <li>Ban quản trị tôn trọng quyền sở hữu trí tuệ của các bên. Nếu phát hiện bất kỳ hình ảnh hoặc nội dung nào vi phạm bản quyền thuộc sở hữu của bạn được đăng tải trái phép trên hệ thống, vui lòng gửi thông báo kèm bằng chứng sở hữu đến email: support@vnigo.sbs. Chúng tôi sẽ tiến hành xác minh và hạ gỡ nội dung vi phạm trong vòng 24 giờ làm việc.</li>
            <li>Trong mọi trường hợp, nền tảng được miễn trừ toàn bộ trách nhiệm bồi thường thiệt hại liên quan đến tranh chấp bản quyền sở hữu trí tuệ phát sinh giữa các bên thứ ba sử dụng dịch vụ.</li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="primary-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center' }} onClick={onAccept}>Tôi đã đọc và đồng ý</button>
        </div>
      </div>
    </div>
  );
}

export { QuyCheModal };

function TopUpModal({ user, onClose, onSave }) {
  const [selectedPkg, setSelectedPkg] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [processing, setProcessing] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);

  const packages = [
    { price: 100, tokens: 110, label: "Nạp 100k", bonus: "Tặng 10đ" },
    { price: 200, tokens: 230, label: "Nạp 200k", bonus: "Tặng 30đ" },
    { price: 500, tokens: 600, label: "Nạp 500k", bonus: "Tặng 100đ" },
  ];

  const handlePayment = async () => {
    if (paymentMethod === 'qr' && !qrGenerated) {
      setQrGenerated(true);
      return;
    }
    setProcessing(true);
    // Giả lập gọi API thanh toán
    setTimeout(async () => {
      try {
        const pkg = packages.find(p => p.price === selectedPkg);
        const newTokens = (user.tokens || 0) + pkg.tokens;
        await updateDoc(doc(db, "users", user.uid), { tokens: newTokens });
        onSave({ ...user, tokens: newTokens });
        window.showAlert(`Thanh toán thành công! Bạn nhận được ${pkg.tokens} Token.`);
        onClose();
      } catch (e) {
        window.showAlert("Lỗi thanh toán: " + e.message);
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 100000 }} onClick={onClose}>
      <section className="map-modal" style={{ maxWidth: 400, padding: 24, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Nạp Token dịch vụ</h2>
        
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, fontSize: 13 }}>1. Chọn gói nạp</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {packages.map(pkg => (
              <div 
                key={pkg.price} 
                onClick={() => { setSelectedPkg(pkg.price); setQrGenerated(false); }}
                style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 8, border: selectedPkg === pkg.price ? '2px solid var(--m-primary)' : '1px solid var(--m-border)', cursor: 'pointer', background: selectedPkg === pkg.price ? '#eff6ff' : '#fff' }}
              >
                <div style={{ fontWeight: 600, color: 'var(--m-dark)' }}>{pkg.label}</div>
                <div style={{ color: 'var(--m-primary)', fontWeight: 600 }}>{pkg.tokens} Token <span style={{ fontSize: 11, background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>{pkg.bonus}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: 24 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, fontSize: 13 }}>2. Phương thức thanh toán</label>
          <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setQrGenerated(false); }} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--m-border)', fontSize: 14 }}>
            <option value="momo">Ví MoMo</option>
            <option value="qr">Chuyển khoản (Tạo QR tự động)</option>
            <option value="visa">Thẻ VISA / Mastercard / VNPAY</option>
          </select>
        </div>

        {qrGenerated && paymentMethod === 'qr' && (
          <div style={{ marginBottom: 24, padding: 16, border: '1px dashed var(--m-border)', borderRadius: 12, background: '#f8fafc' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--m-subtle)' }}>Quét mã QR dưới đây bằng App ngân hàng để thanh toán chính xác {selectedPkg}.000đ</p>
            <img src={`https://img.vietqr.io/image/970415-113366668888-compact2.png?amount=${selectedPkg}000&addInfo=Nap%20diem%20${user.uid}&accountName=VNIGO`} alt="VietQR" style={{ width: 200, height: 200, objectFit: 'contain', background: '#fff', padding: 8, borderRadius: 8, border: '1px solid #ddd' }} />
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--m-red)' }}>*Hệ thống sẽ tự động xác nhận sau khi nhận được tiền.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="secondary" style={{ flex: 1 }} onClick={onClose} disabled={processing}>Hủy</button>
          <button className="primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} onClick={handlePayment} disabled={processing}>
            {processing ? <Loader size={16} className="spin" /> : <Zap size={16} />}
            {(paymentMethod === 'qr' && !qrGenerated) ? "Tạo mã QR" : "Thanh Toán"}
          </button>
        </div>
      </section>
    </div>
  );
}

export { TopUpModal };

function OwnerWizard({ onClose, onFinish, onGoToProfile, isGuest, isComplete }) {
  const [step, setStep] = useState(1);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, padding: 32, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative background blur */}
        <div style={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, background: 'var(--m-primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 150, height: 150, background: '#10b981', opacity: 0.1, borderRadius: '50%', filter: 'blur(40px)' }} />

        {step === 1 && (
          <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--m-primary), #6366f1)', color: '#fff', marginBottom: 24, boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }}>
              <Car size={32} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--m-dark)', letterSpacing: '-0.02em' }}>Trở thành Chủ xe</h2>
            <p style={{ color: 'var(--m-mid)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
              Bắt đầu hành trình chia sẻ xe và gia tăng thu nhập thụ động cùng Vnigo. Đăng xe nhanh chóng, quản lý dễ dàng.
            </p>
            <button className="primary" style={{ width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12, marginBottom: 12, background: 'linear-gradient(135deg, var(--m-primary), #6366f1)', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }} onClick={() => setStep(2)}>
              Bắt đầu ngay <Sparkles size={18} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'text-bottom' }} />
            </button>
            <button className="secondary" style={{ width: '100%', border: 'none', fontSize: 15, color: 'var(--m-subtle)', background: 'transparent' }} onClick={onFinish}>
              Để sau
            </button>
          </div>
        )}
        
        {step === 2 && (
          <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--m-primary)', marginBottom: 24 }}>
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--m-dark)', letterSpacing: '-0.02em' }}>Xác thực tài khoản</h2>
            
            {isGuest ? (
              <>
                <p style={{ color: 'var(--m-mid)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
                  Bạn đang dùng tài khoản <b>Khách xem thử</b>. Để có thể đăng xe, vui lòng đăng xuất và đăng nhập lại bằng số điện thoại hoặc email.
                </p>
                <button className="primary" style={{ width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12 }} onClick={onFinish}>Đã hiểu</button>
              </>
            ) : !isComplete ? (
              <>
                <p style={{ color: 'var(--m-mid)', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
                  Để đảm bảo uy tín và bảo mật cho cộng đồng, Chủ xe cần cung cấp đầy đủ:
                </p>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 32, textAlign: 'left', border: '1px solid var(--m-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--m-primary)' }}></div><span style={{ fontSize: 15, color: 'var(--m-dark)' }}>Địa chỉ Email</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--m-primary)' }}></div><span style={{ fontSize: 15, color: 'var(--m-dark)' }}>Số điện thoại liên hệ</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--m-primary)' }}></div><span style={{ fontSize: 15, color: 'var(--m-dark)' }}>Số CCCD / CMND</span></div>
                </div>
                <button className="primary" style={{ width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12, marginBottom: 12, background: 'linear-gradient(135deg, var(--m-primary), #6366f1)', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }} onClick={() => { onGoToProfile(); onClose(); }}>
                  Cập nhật hồ sơ ngay
                </button>
                <button className="secondary" style={{ width: '100%', border: 'none', background: 'transparent' }} onClick={onFinish}>Để sau</button>
              </>
            ) : (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: 24 }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--m-dark)' }}>Tuyệt vời!</h3>
                <p style={{ color: 'var(--m-mid)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Thông tin của bạn đã đầy đủ và hợp lệ. Bạn đã sẵn sàng để đăng chiếc xe đầu tiên của mình lên Vnigo.</p>
                <button className="primary" style={{ width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12, background: '#10b981', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }} onClick={() => setStep(3)}>
                  Tiếp tục <ArrowRight size={18} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'text-bottom' }} />
                </button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', marginBottom: 24, boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
              <CheckCircle2 size={40} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: 'var(--m-dark)', letterSpacing: '-0.02em' }}>Chúc mừng!</h2>
            <p style={{ color: 'var(--m-mid)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
              Bạn đã chính thức trở thành Đối tác Chủ xe của Vnigo. Hãy tải lên những hình ảnh đẹp nhất của chiếc xe để thu hút khách thuê nhé!
            </p>
            <button className="primary" style={{ width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12, background: 'var(--m-dark)', border: 'none' }} onClick={onFinish}>
              Tôi đã hiểu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { OwnerWizard };

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

function UpgradeModal({ plan, car, onClose }) {
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePaymentConfirm = async () => {
    try {
      setLoading(true);
      
      let expiry = "Vĩnh viễn";
      if (plan.id === '1m') {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        expiry = d.toLocaleDateString('vi-VN');
      } else if (plan.id === '3m') {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        expiry = d.toLocaleDateString('vi-VN');
      }

      const emailHtml = `
        <h3>Có yêu cầu nâng cấp gói Tối ưu mới:</h3>
        <ul>
          <li><strong>Tên chủ xe:</strong> ${car.ownerInfo?.name || 'Không rõ'}</li>
          <li><strong>Hãng xe:</strong> ${car.basicInfo?.brand || 'Không rõ'}</li>
          <li><strong>Dòng xe:</strong> ${car.basicInfo?.model || 'Không rõ'}</li>
          <li><strong>Năm sản xuất:</strong> ${car.basicInfo?.year || 'Không rõ'}</li>
          <li><strong>Biển số:</strong> ${car.basicInfo?.plate || 'Không rõ'}</li>
          <li><strong>Gói nâng cấp:</strong> ${plan.title} (${plan.price})</li>
          <li><strong>Thời gian hết hạn dự kiến:</strong> ${expiry}</li>
        </ul>
      `;

      await addDoc(collection(db, 'upgrade_requests'), {
        to: ADMIN_EMAILS,
        message: {
          subject: `Yêu cầu kích hoạt gói Tối ưu - Xe ${car.basicInfo?.plate || 'Mới'}`,
          html: emailHtml
        },
        carId: car.id || '',
        status: 'pending',
        carData: {
          ownerName: car.ownerInfo?.name || '',
          brand: car.basicInfo?.brand || '',
          model: car.basicInfo?.model || '',
          year: car.basicInfo?.year || '',
          plate: car.basicInfo?.plate || '',
          plan: plan.id,
          expiry: expiry
        },
        createdAt: new Date().toISOString()
      });

      setIsPaid(true);
    } catch (error) {
      console.error(error);
      window.showAlert("Lỗi khi gửi yêu cầu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const qrLinks = {
    '1m': 'https://qr.sepay.vn/img?bank=MBBank&acc=1090130091996&template=qronly&amount=39000&des=Thuexenhanh30ngay&showinfo=true&holder=LE%20HUYNH%20BAO%20GIA',
    '3m': 'https://qr.sepay.vn/img?bank=MBBank&acc=1090130091996&template=qronly&amount=99000&des=Thuexenhanh90ngay&showinfo=true&holder=LE%20HUYNH%20BAO%20GIA',
    'forever': 'https://qr.sepay.vn/img?bank=MBBank&acc=1090130091996&template=qronly&amount=199000&des=Thuexenhanhvinhvien&showinfo=true&holder=LE%20HUYNH%20BAO%20GIA'
  };
  const qrUrl = qrLinks[plan.id];

  if (isPaid) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
        <section className="map-modal" style={{ maxWidth: 400, padding: 32, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--m-primary-light)', color: 'var(--m-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
             <Check size={32} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Đang xử lý thanh toán</h2>
          <p style={{ color: 'var(--m-mid)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>Tài khoản của bạn đang được xử lý, chúng tôi sẽ có Email thông báo khi bạn được cập nhật thành công.</p>
          <button className="primary" style={{ width: '100%', padding: '12px 0' }} onClick={onClose}>Đóng</button>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="map-modal" style={{ maxWidth: 400, padding: 24, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Nâng cấp {plan.title}</h2>
          <button className="modal-close inline-close" onClick={onClose} aria-label="Đóng" style={{ top: 'auto', right: 'auto', position: 'static' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ background: 'var(--m-primary-light)', color: 'var(--m-primary)', padding: '12px', borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 18 }}>
          {plan.price}
        </div>

        <ul style={{ textAlign: 'left', fontSize: 14, lineHeight: 1.6, marginBottom: 20, paddingLeft: 20, color: 'var(--m-mid)' }}>
          <li>Hiển thị <strong>đầy đủ thông số</strong> kỹ thuật xe, khách dễ dàng tìm kiếm</li>
          <li>Nổi bật <strong>thẻ xe</strong> với huy hiệu <strong style={{color: 'var(--m-primary)'}}>Tối ưu</strong></li>
          <li>Hết thời gian đăng ký xe sẽ tự động chuyển về <strong>Gói Đăng nhanh</strong></li>
          {plan.id === 'forever' && (
            <li><strong>Ưu tiên hiển thị</strong> trên đầu kết quả tìm kiếm</li>
          )}
        </ul>

        <div style={{ border: '2px dashed var(--m-border)', padding: 16, borderRadius: 12, marginBottom: 16, display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
          <img src={qrUrl} alt="Mã QR Thanh Toán" style={{ width: '100%', maxWidth: 250, display: 'block', margin: '0 auto', borderRadius: 8 }} />
          <p style={{ fontSize: 12, color: 'var(--m-subtle)', marginTop: 8, marginBottom: 0 }}>Quét mã QR bằng ứng dụng ngân hàng</p>
          <a href={qrUrl} target="_blank" rel="noopener noreferrer" download={`ThueXeNhanh_QR_${plan.id}.png`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 16px', background: 'var(--m-primary-light)', color: 'var(--m-primary)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <Download size={16} /> Tải QR về máy
          </a>
        </div>

        <button
          className="primary"
          style={{ width: '100%', padding: '12px 0' }}
          onClick={handlePaymentConfirm}
          disabled={loading}
        >
          {loading ? 'Đang gửi yêu cầu...' : 'Tôi đã thanh toán'}
        </button>
      </section>
    </div>
  );
}

export { UpgradeModal };

function FaqModal({ onClose }) {
  const faqs = [
    { q: "1. Thuê xe tự lái trên ứng dụng có an toàn không?", a: "Ứng dụng xác thực danh tính chủ xe và khách thuê qua giấy tờ hợp lệ. Mọi thông tin xe đều được minh bạch để đảm bảo quyền lợi hai bên." },
    { q: "2. Tôi cần chuẩn bị giấy tờ gì khi nhận xe?", a: "Bạn cần chuẩn bị CCCD gắn chip, Giấy phép lái xe hợp lệ (hạng B1 trở lên) và tài sản đặt cọc theo yêu cầu của chủ xe (thường là xe máy hoặc tiền mặt)." },
    { q: "3. Thanh toán và đặt cọc diễn ra như thế nào?", a: "Khách thuê thoả thuận và thanh toán trực tiếp với chủ xe. Tuỳ thuộc vào chủ xe, bạn có thể phải cọc một khoản nhỏ để giữ xe." },
    { q: "4. Nếu xe gặp sự cố hoặc tai nạn trên đường thì sao?", a: "Khách thuê cần giữ bình tĩnh, liên hệ ngay với chủ xe để được hỗ trợ. Các chi phí sửa chữa hoặc bảo hiểm sẽ được xử lý dựa trên hợp đồng thuê xe ban đầu." },
    { q: "5. Thông tin cá nhân của tôi có được bảo mật không?", a: "Hoàn toàn bảo mật. Chúng tôi cam kết chỉ sử dụng thông tin để hỗ trợ kết nối an toàn giữa chủ xe và khách thuê, tuân thủ Chính sách bảo vệ dữ liệu." },
    { q: "6. Tôi có thể huỷ chuyến sau khi đã đặt không?", a: "Bạn có thể huỷ chuyến. Tuy nhiên, việc hoàn trả tiền cọc (nếu có) sẽ phụ thuộc vào chính sách huỷ chuyến mà bạn và chủ xe đã thống nhất." }
  ];

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }}>
      <div className="modal-content detail-modal" style={{ maxWidth: 500, padding: 24, borderRadius: 'var(--r-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--m-dark)' }}>Câu Hỏi Thường Gặp (FAQ)</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < faqs.length - 1 ? '1px solid var(--m-border)' : 'none' }}>
              <h3 style={{ fontSize: 15, color: 'var(--m-primary)', marginBottom: 8 }}>{f.q}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--m-mid)', lineHeight: 1.5 }}>{f.a}</p>
            </div>
          ))}
        </div>
        <button className="primary" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>Đã hiểu</button>
      </div>
    </div>
  );
}

export { FaqModal };

function CommunityModal({ currentUser, onClose }) {
  const [tab, setTab] = useState('tips');
  const [reportType, setReportType] = useState('');
  const [targetType, setTargetType] = useState('owner');
  const [description, setDescription] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [contactBack, setContactBack] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({ resolved: 0, pending: 0 });

  useEffect(() => {
    // Lấy thống kê từ community_reports
    const unsub = onSnapshot(collection(db, 'community_reports'), (snap) => {
      let resolved = 0, pending = 0;
      snap.forEach(d => {
        if (d.data().status === 'resolved') resolved++;
        else if (d.data().status === 'pending') pending++;
      });
      setStats({ resolved, pending });
    });
    return () => unsub();
  }, []);

  const reportTypes = [
    { value: 'phone_fake', label: '📞 Số điện thoại không đúng', who: 'both' },
    { value: 'plate_fake', label: '🚘 Biển số xe sai/giả', who: 'owner_listing' },
    { value: 'photo_fake', label: '📷 Ảnh xe không đúng thực tế', who: 'owner_listing' },
    { value: 'price_scam', label: '💰 Giá ảo / phí ẩn bất ngờ', who: 'both' },
    { value: 'deposit_refused', label: '🔒 Bùng/chiếm dụng tiền cọc', who: 'both' },
    { value: 'fraud', label: '⚠️ Lừa đảo nghiêm trọng', who: 'both' },
    { value: 'harassment', label: '🚫 Quấy rối / đe dọa', who: 'both' },
    { value: 'other', label: '❓ Vấn đề khác', who: 'both' },
  ];

  const ownerTips = [
    {
      icon: '📞', color: '#ef4444',
      title: 'Kiểm tra SĐT khách thuê',
      desc: 'Gọi xác nhận thực tế trước khi cho lấy xe. Nếu SĐT không liên lạc được hoặc không khớp tên trên CCCD — từ chối ngay.',
      action: 'Báo cáo nếu khách cung cấp thông tin giả'
    },
    {
      icon: '🪪', color: '#f97316',
      title: 'Đối chiếu CCCD với mặt người thuê',
      desc: 'Yêu cầu chụp ảnh CCCD cùng mặt người thuê (selfie). Không cho thuê nếu ảnh CCCD không khớp người đến nhận xe.',
      action: 'Báo cáo nếu phát hiện giả mạo danh tính'
    },
    {
      icon: '📸', color: '#8b5cf6',
      title: 'Chụp ảnh xe trước khi giao',
      desc: 'Luôn chụp toàn bộ ngoại thất + nội thất xe trước khi giao. Đây là bằng chứng quan trọng nếu xảy ra tranh chấp hư hỏng.',
      action: 'Yêu cầu khách ký biên bản giao nhận'
    },
    {
      icon: '💸', color: '#10b981',
      title: 'Hợp đồng & tiền cọc rõ ràng',
      desc: 'Không giao xe khi chưa nhận đủ cọc theo thỏa thuận. Chuyển khoản hoặc biên nhận tiền mặt — tránh thỏa thuận miệng.',
      action: 'Báo cáo nếu khách bùng cọc'
    },
    {
      icon: '🚘', color: '#3b82f6',
      title: 'Theo dõi hành trình xe',
      desc: 'Nếu có thể, gắn thiết bị định vị hợp pháp để theo dõi xe. Thông báo trước cho khách để minh bạch.',
      action: 'Báo cáo nếu xe bị đưa ra khỏi phạm vi thỏa thuận'
    },
  ];

  const renterTips = [
    {
      icon: '🔢', color: '#ef4444',
      title: 'Kiểm tra biển số xe thực tế',
      desc: 'Đến nhận xe, đối chiếu biển số trên xe với thông tin đăng trên app. Nếu không khớp — không nhận xe và báo cáo ngay.',
      action: 'Báo cáo nếu biển số xe sai'
    },
    {
      icon: '📱', color: '#f97316',
      title: 'Gọi xác nhận số điện thoại chủ xe',
      desc: 'Trước khi ra địa Token nhận xe, gọi điện xác nhận lại. Nếu SĐT không thật hoặc người nghe không phải chủ xe — dừng lại.',
      action: 'Báo cáo nếu SĐT chủ xe không tồn tại'
    },
    {
      icon: '💰', color: '#8b5cf6',
      title: 'Cảnh giác với giá ảo và phí ẩn',
      desc: 'Thỏa thuận rõ tổng chi phí (giá thuê + cọc + phí nhiên liệu nếu có) trước khi ký. Không chấp nhận phí phát sinh bất ngờ khi trả xe.',
      action: 'Báo cáo nếu bị ép thêm phí vô lý'
    },
    {
      icon: '🖼️', color: '#10b981',
      title: 'So sánh ảnh xe với thực tế',
      desc: 'Ảnh xe trên app phải tương đương xe thực tế. Nếu xe cũ nát hơn ảnh, nội thất hỏng hóc — bạn có quyền từ chối và được hoàn cọc.',
      action: 'Báo cáo nếu ảnh xe gian lận'
    },
    {
      icon: '📋', color: '#3b82f6',
      title: 'Chụp ảnh xe trước khi lăn bánh',
      desc: 'Luôn chụp ảnh toàn bộ xe (4 góc + nội thất) trước khi nhận xe. Bảo vệ bạn khỏi bị đổ lỗi hư hỏng có sẵn khi trả xe.',
      action: 'Đây là bằng chứng bảo vệ bạn'
    },
  ];

  const handleSubmitReport = async () => {
    if (!reportType || !description.trim()) {
      window.showAlert('Vui lòng chọn loại vi phạm và mô tả chi tiết.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_reports'), {
        reportType,
        targetType,
        description: description.trim(),
        evidenceText: evidenceText.trim(),
        contactBack: contactBack.trim(),
        userId: currentUser?.uid || null,
        userName: currentUser?.name || currentUser?.email || 'Ẩn danh',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (err) {
      window.showAlert('Lỗi gửi báo cáo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000 }}>
      <div className="modal-content detail-modal community-modal" style={{ maxWidth: 560, padding: 0, borderRadius: 'var(--r-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="community-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="community-header-icon">🛡️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#fff', fontWeight: 700 }}>Cộng Đồng An Toàn</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Cùng nhau phá lừa đảo, bảo vệ cộng đồng</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)' }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="community-tabs">
          {[
            { id: 'tips', label: '📋 Khuyến nghị', },
            { id: 'report', label: '🚨 Báo cáo' },
            { id: 'stats', label: '📊 Thống kê' },
          ].map(t => (
            <button key={t.id} className={`community-tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px' }}>

          {/* === TAB 1: TIPS === */}
          {tab === 'tips' && (
            <div>
              <div className="community-tip-section-label">Dành cho Chủ Xe</div>
              {ownerTips.map((tip, i) => (
                <div key={i} className="community-tip-card" style={{ borderLeft: `4px solid ${tip.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div className="community-tip-icon" style={{ background: tip.color + '20', color: tip.color }}>{tip.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="community-tip-title">{tip.title}</div>
                      <div className="community-tip-desc">{tip.desc}</div>
                      <div className="community-tip-action" style={{ color: tip.color }}>→ {tip.action}</div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="community-tip-section-label" style={{ marginTop: 24 }}>Dành cho Khách Thuê</div>
              {renterTips.map((tip, i) => (
                <div key={i} className="community-tip-card" style={{ borderLeft: `4px solid ${tip.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div className="community-tip-icon" style={{ background: tip.color + '20', color: tip.color }}>{tip.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="community-tip-title">{tip.title}</div>
                      <div className="community-tip-desc">{tip.desc}</div>
                      <div className="community-tip-action" style={{ color: tip.color }}>→ {tip.action}</div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="community-banner">
                <div style={{ fontSize: 28 }}>🤝</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--m-dark)', marginBottom: 4 }}>Cùng nhau xây dựng cộng đồng lành mạnh</div>
                  <div style={{ fontSize: 13, color: 'var(--m-mid)' }}>Mọi báo cáo đều được xem xét bởi đội ngũ quản trị trong vòng 24 giờ. Thông tin người báo cáo được bảo mật tuyệt đối.</div>
                </div>
              </div>
            </div>
          )}

          {/* === TAB 2: REPORT === */}
          {tab === 'report' && (
            <div>
              {submitted ? (
                <div className="community-success">
                  <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                  <h3 style={{ margin: '0 0 8px', color: 'var(--m-dark)', fontSize: 20 }}>Báo cáo đã được gửi!</h3>
                  <p style={{ color: 'var(--m-mid)', fontSize: 14, margin: '0 0 24px' }}>Cảm ơn bạn đã giúp cộng đồng an toàn hơn. Đội ngũ quản trị sẽ xem xét và xử lý trong vòng 24 giờ.</p>
                  <button className="primary" onClick={() => { setSubmitted(false); setReportType(''); setDescription(''); setEvidenceText(''); setContactBack(''); }}>
                    Gửi báo cáo khác
                  </button>
                </div>
              ) : (
                <div>
                  <div className="community-report-notice">
                    <Shield size={16} />
                    <span>Thông tin người báo cáo được <strong>bảo mật tuyệt đối</strong>. Chỉ admin có thể xem.</span>
                  </div>

                  <div className="community-form-group">
                    <label className="community-form-label">Đối tượng bị báo cáo *</label>
                    <div className="community-toggle-group">
                      <button className={`community-toggle-btn${targetType === 'owner' ? ' active' : ''}`} onClick={() => setTargetType('owner')}>
                        🚗 Chủ xe
                      </button>
                      <button className={`community-toggle-btn${targetType === 'renter' ? ' active' : ''}`} onClick={() => setTargetType('renter')}>
                        👤 Khách thuê
                      </button>
                    </div>
                  </div>

                  <div className="community-form-group">
                    <label className="community-form-label">Loại vi phạm *</label>
                    <div className="community-report-types">
                      {reportTypes.map(rt => (
                        <button key={rt.value} className={`community-report-type-btn${reportType === rt.value ? ' active' : ''}`} onClick={() => setReportType(rt.value)}>
                          {rt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="community-form-group">
                    <label className="community-form-label">Mô tả chi tiết *</label>
                    <textarea
                      className="community-textarea"
                      placeholder="Mô tả rõ sự việc: thời gian, địa Token, diễn biến... Càng chi tiết càng giúp chúng tôi xử lý nhanh hơn."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="community-form-group">
                    <label className="community-form-label">Bằng chứng (tùy chọn)</label>
                    <textarea
                      className="community-textarea"
                      placeholder="Link ảnh chụp màn hình, link Google Drive, mô tả bằng chứng bạn có..."
                      value={evidenceText}
                      onChange={e => setEvidenceText(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="community-form-group">
                    <label className="community-form-label">SĐT/Zalo liên lạc lại (tùy chọn)</label>
                    <input
                      className="community-input"
                      type="tel"
                      placeholder="Để admin liên hệ nếu cần thêm thông tin"
                      value={contactBack}
                      onChange={e => setContactBack(e.target.value)}
                    />
                  </div>

                  <button
                    className="primary"
                    style={{ width: '100%', marginTop: 8, height: 48 }}
                    onClick={handleSubmitReport}
                    disabled={submitting}
                  >
                    {submitting ? 'Đang gửi...' : '🚨 Gửi báo cáo vi phạm'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === TAB 3: STATS === */}
          {tab === 'stats' && (
            <div>
              <div className="community-stats-grid">
                <div className="community-stat-card green">
                  <div className="community-stat-icon">✅</div>
                  <div className="community-stat-number">{stats.resolved}</div>
                  <div className="community-stat-label">Báo cáo đã xử lý</div>
                </div>
                <div className="community-stat-card orange">
                  <div className="community-stat-icon">⏳</div>
                  <div className="community-stat-number">{stats.pending}</div>
                  <div className="community-stat-label">Đang xem xét</div>
                </div>
              </div>

              <div className="community-pledge">
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
                <h3 style={{ margin: '0 0 12px', color: 'var(--m-dark)', fontSize: 18 }}>Cam kết của Thuê Xe Nhanh</h3>
                <div className="community-pledge-list">
                  {[
                    { icon: '⚡', text: 'Xử lý báo cáo trong vòng 24 giờ' },
                    { icon: '🔒', text: 'Bảo mật 100% thông tin người báo cáo' },
                    { icon: '🚫', text: 'Khóa tài khoản vi phạm nghiêm trọng ngay lập tức' },
                    { icon: '📢', text: 'Cảnh báo cộng đồng về các hành vi lừa đảo' },
                    { icon: '🤝', text: 'Hỗ trợ người dùng bị hại liên hệ cơ quan chức năng' },
                  ].map((p, i) => (
                    <div key={i} className="community-pledge-item">
                      <span className="community-pledge-icon">{p.icon}</span>
                      <span style={{ fontSize: 14, color: 'var(--m-mid)' }}>{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="community-banner" style={{ marginTop: 16 }}>
                <div style={{ fontSize: 24 }}>📣</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--m-dark)', marginBottom: 4 }}>Bạn là mắt xích quan trọng!</div>
                  <div style={{ fontSize: 13, color: 'var(--m-mid)' }}>Một báo cáo của bạn có thể ngăn chặn hàng chục người khác bị lừa. Hãy mạnh dạn lên tiếng.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { CommunityModal };

function DataProtectionPolicy({ onBack, onViewDetails, currentUser, onSave, onConfirmSuccess, isModal }) {
  const alreadyAgreed = currentUser?.agreedPolicy;
  const [agreed, setAgreed] = useState(
    alreadyAgreed ? [true, true, true, true] : [false, false, false, false]
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (index) => {
    if (alreadyAgreed) return;
    const newAgreed = [...agreed];
    newAgreed[index] = !newAgreed[index];
    setAgreed(newAgreed);
  };

  const allAgreed = agreed.every(Boolean);

  const handleConfirm = async () => {
    if (alreadyAgreed) {
      onBack();
      return;
    }
    if (!allAgreed) {
      window.showAlert("Vui lòng đồng ý với tất cả các điều khoản để tiếp tục.");
      return;
    }
    
    if (currentUser && onSave) {
      setIsSaving(true);
      try {
        if (!currentUser.isGuest) {
          await updateDoc(doc(db, "users", currentUser.uid), { agreedPolicy: true });
        }
        onSave({ ...currentUser, agreedPolicy: true });
        if (onConfirmSuccess) {
          onConfirmSuccess();
        } else {
          window.showAlert("Đã xác nhận đồng ý Chính sách bảo vệ dữ liệu cá nhân.");
          onBack();
        }
      } catch (err) {
        console.error("Lỗi lưu chính sách:", err);
        window.showAlert("Đã có lỗi xảy ra. Vui lòng thử lại.");
      } finally {
        setIsSaving(false);
      }
    } else {
      if (onConfirmSuccess) {
        onConfirmSuccess();
      } else {
        window.showAlert("Đã xác nhận đồng ý Chính sách bảo vệ dữ liệu cá nhân.");
        onBack();
      }
    }
  };

  const content = (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="icon-button" onClick={onBack}><ChevronLeft size={20}/></button>
        <h2 style={{ margin: 0, fontSize: 20 }}>Bảo vệ dữ liệu</h2>
      </div>

      <div style={{ background: '#e0f2fe', borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        <picture>
          <source media="(min-width: 640px)" srcSet={BannerImagePC} />
          <img src={BannerImageMobile} alt="Data Protection" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
        </picture>
      </div>

      <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid var(--m-border)', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ fontSize: 13, color: 'var(--m-subtle)', marginBottom: 12 }}>Căn cứ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15</p>
        <p style={{ fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, marginBottom: 16 }}>
          Nhằm đáp ứng quy định về Bảo vệ dữ liệu cá nhân, Quý Khách hàng vui lòng chọn vào các nội dung bên dưới để <strong>xác nhận đồng ý cho Thuê Xe Nhanh xử lý dữ liệu cá nhân</strong> với các mục đích như sau:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {[
            "Cung cấp dịch vụ cho Khách hàng.",
            "Thực hiện các nghĩa vụ của Thuê Xe Nhanh theo quy định pháp luật.",
            "Quảng cáo các dịch vụ và hoạt động thương mại khác phù hợp nhu cầu của Khách hàng.",
            "Sử dụng và hiển thị ảnh đại diện cá nhân (avatar) để định danh và tăng độ tin cậy giữa các thành viên."
          ].map((text, idx) => (
            <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={agreed[idx]} 
                disabled={alreadyAgreed}
                onChange={() => handleToggle(idx)}
                style={{ flexShrink: 0, marginTop: 4, width: 18, height: 18, accentColor: 'var(--m-primary)' }}
              />
              <span style={{ fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.5 }}>{text}</span>
            </label>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 24, border: '1px solid var(--m-border)' }}>
          <input 
            type="checkbox" 
            checked={allAgreed} 
            disabled={alreadyAgreed}
            onChange={(e) => {
              if (alreadyAgreed) return;
              const isChecked = e.target.checked;
              setAgreed([isChecked, isChecked, isChecked, isChecked]);
            }}
            style={{ flexShrink: 0, width: 18, height: 18, accentColor: 'var(--m-primary)' }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-dark)' }}>Đồng ý tất cả các mục trên</span>
        </label>

        <p style={{ fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, marginBottom: 16 }}>
          Thuê Xe Nhanh cam kết bảo vệ và sử dụng dữ liệu cá nhân của Khách hàng một cách minh bạch, an toàn và đúng quy định.
        </p>
        
        <p style={{ fontSize: 14, color: 'var(--m-subtle)', marginBottom: 24 }}>
          Quý Khách hàng có thể xem thêm chi tiết tại <a href="#" style={{ color: 'var(--m-primary)', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); onViewDetails && onViewDetails(); }}>Chính sách bảo vệ dữ liệu cá nhân</a> của Thuê Xe Nhanh.
        </p>

        <p style={{ fontSize: 13, color: 'var(--m-subtle)', marginBottom: 16 }}>
          Cập nhật lần cuối: 04/07/2026
        </p>

        <button 
          className="primary" 
          style={{ width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 'var(--r-md)', opacity: allAgreed ? (isSaving ? 0.7 : 1) : 0.5 }}
          onClick={handleConfirm}
          disabled={isSaving}
        >
          {alreadyAgreed ? "Đã xác nhận" : (isSaving ? "Đang lưu..." : "Xác nhận")}
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 16, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export { DataProtectionPolicy };

