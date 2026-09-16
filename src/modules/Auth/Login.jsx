import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, ADMIN_EMAILS, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { Stat } from '../Shared/UIKit.jsx';
import { DataProtectionPolicy, QuyCheModal } from './Onboarding.jsx';

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
      if (error.code === 'auth/unauthorized-domain') {
        toast("Tên miền này chưa được thêm vào danh sách Authorized Domains trên Firebase Console.");
      } else {
        toast(`Đăng nhập thất bại: ${error.message || "Vui lòng kiểm tra lại kết nối."}`);
      }
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
