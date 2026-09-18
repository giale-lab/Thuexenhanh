import { LandingPage } from './modules/Landing/LandingPage.jsx';
import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from "./firebase";
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where, limit, orderBy } from "firebase/firestore";
import "./styles.css";
import { generateSlug, isWeekendRange, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from './core.js';

import { AppLogo, LazyImage, SkeletonCard, ImageSlider, ModuleFrame, StatusBadge, Field, Toggle, DepositField, FilterCheckboxGroup, FilterToggle, FilterSelect, Stat, ImageUploadOptimizer, InfoPanel } from './modules/Shared/UIKit.jsx';
import { SearchLocationPicker, LocationPicker, MapModal, ErrorBoundary, handleOpenMap } from './modules/Shared/Location.jsx';
import { Overview } from './modules/Cars/Overview.jsx';
import { CarCard } from './modules/Cars/CarCard.jsx';
import { CarDetailModal } from './modules/Cars/CarDetail.jsx';
import { AddCarForm, DateTimePickerModal, BlockedDatesManager } from './modules/Cars/CarForm.jsx';
import { LoginScreen } from './modules/Auth/Login.jsx';
import { AccountSettingsScreen, SetLocationPopup } from './modules/Auth/Account.jsx';
import { OwnerWizard, QuyCheModal, DataProtectionPolicy, FaqModal, CommunityModal } from './modules/Auth/Onboarding.jsx';
import { TopUpModal, UpgradeModal } from './modules/Payment/Tokens.jsx';


export default RootApp;

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("web-thue-xe-user");
      if (saved) {
        let parsed = JSON.parse(saved);
        if (parsed && (parsed.avatar === "/guest-avatar.png" || parsed.avatar === "guest-avatar.png" || parsed.avatar === "/guest-avatar.png")) {
          parsed.avatar = "/guest-avatar.png";
          localStorage.setItem("web-thue-xe-user", JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [cars, setCars] = useState([]);
  const [carLimit, setCarLimit] = useState(20);
  const [hasMoreCars, setHasMoreCars] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = useMemo(() => {
    if (location.pathname === '/dang-xe') return 'add';
    if (location.pathname.startsWith('/cai-dat')) return 'account';
    if (location.pathname === '/admin') return 'admin';
    if (location.pathname === '/trang-chu') return 'overview';
    if (location.pathname.startsWith('/xe/')) return 'overview';
    return 'landing';
  }, [location.pathname]);
  const [editingId, setEditingId] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      window.showAlert("Hướng dẫn: Chọn 'Thêm vào màn hình chính' (Add to Home Screen) trên trình duyệt của bạn.");
    }
  };

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [policyGate, setPolicyGate] = useState(null);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    window.requirePolicyGate = (callback) => {
      const user = currentUserRef.current;
      if (user && !user.agreedPolicy) {
        setPolicyGate({ cb: callback });
      } else {
        callback();
      }
    };
    
    window.deductTokens = (amount, ownerId, carId, callback) => {
      const user = currentUserRef.current;
      if (!user || user.isGuest) {
        if (window.showAlert) window.showAlert("Vui lòng đăng nhập bằng tài khoản thật để xem thông tin này.");
        return;
      }
      if (user.role === 'admin' || user.uid === ownerId) {
        callback();
        return;
      }
      if (user.unlockedCars?.includes(carId)) {
        callback();
        return;
      }
      window.unlockedCars = window.unlockedCars || new Set();
      if (window.unlockedCars.has(carId)) {
        callback();
        return;
      }
      if ((user.tokens || 0) < amount) {
        if (window.showAlert) window.showAlert(`Bạn không đủ Token (cần ${amount} Token). Vui lòng nạp thêm.`);
        return;
      }
      
      if (window.showConfirm) {
        window.showConfirm(`Sẽ trừ ${amount} Token để xem thông tin liên hệ. Bạn đồng ý chứ?`, async () => {
          try {
            const newTokens = (user.tokens || 0) - amount;
            const updatedUnlocked = [...(user.unlockedCars || []), carId];
            await updateDoc(doc(db, "users", user.uid), { tokens: newTokens, unlockedCars: updatedUnlocked });
            setCurrentUser(prev => ({ ...prev, tokens: newTokens, unlockedCars: updatedUnlocked }));
            window.unlockedCars.add(carId);
            callback();
          } catch(err) {
            window.showAlert("Lỗi khi trừ Token: " + err.message);
          }
        });
      }
    };
    
    return () => {
      delete window.requirePolicyGate;
      delete window.deductTokens;
    };
  }, []);

  const handleDeleteCarGlobal = async (id) => {
    window.showConfirm("Bạn có chắc chắn muốn xóa xe này?", async () => {
      try {
        setCars((current) => {
          const next = current.filter((car) => car.id !== id);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (err) {}
          return next;
        });
        if (window.location.protocol !== 'file:' && !currentUser?.isGuest) {
          await deleteDoc(doc(db, "cars", id));
        }
        window.showAlert("Đã xóa xe thành công!");
      } catch (err) {
        console.error("Lỗi xóa xe:", err);
        window.showAlert("Lỗi xóa xe: " + err.message);
      }
    });
  };

  useEffect(() => {
    window.showAlert = (msg) => {
      setToast({ message: msg });
      setTimeout(() => setToast(null), 4000);
    };
    window.showConfirm = (msg, onConfirm) => {
      setConfirmDialog({ message: msg, onConfirm });
    };

    window.history.pushState({ appInit: true }, "");
    const handlePopState = (e) => {
      if (e.state && (e.state.modal || e.state.appInit)) {
        return;
      }
      if (activeTabRef.current !== "overview") {
        navigate('/trang-chu');
        window.history.pushState({ appInit: true }, "");
        return;
      }
      window.showConfirm("Bạn có chắc chắn muốn thoát ứng dụng?", () => {
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
      });
      window.history.pushState({ appInit: true }, "");
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const adminMode = currentUser?.role === "owner";

  const checkProfileForOwner = () => {
    if (currentUser?.isGuest) {
      window.showAlert("Bạn đang dùng tài khoản Khách xem thử. Vui lòng đăng nhập để thao tác.");
      return false;
    }
    if (!currentUser?.email || !currentUser?.phone || !currentUser?.cccdNumber) {
      window.showAlert("Vui lòng cập nhật đầy đủ Email, SĐT và CCCD trong mục Cá nhân trước.");
      navigate('/cai-dat');
      return false;
    }
    return true;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            let finalRole = data.role;
                        const userData = {
              ...data,
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName,
              email: data.email || firebaseUser.email,
              avatar: firebaseUser.photoURL || data.avatar,
              role: finalRole,
              createdAt: data.createdAt || firebaseUser.metadata.creationTime
            };
            setCurrentUser(userData);
            localStorage.setItem("web-thue-xe-user", JSON.stringify(userData));
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          const saved = localStorage.getItem("web-thue-xe-user");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.uid === firebaseUser.uid) {
                setCurrentUser(parsed);
              }
            } catch (e) {}
          }
        } finally {
          setAuthLoading(false);
        }
      } else {
        const saved = localStorage.getItem("web-thue-xe-user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.isGuest) {
              setAuthLoading(false);
              return;
            }
          } catch (e) {}
        }
        setCurrentUser(null);
        localStorage.removeItem("web-thue-xe-user");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    if (window.location.protocol === 'file:') {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      setCars(Array.isArray(parsed) ? parsed : []);
      setLoading(false);
      return;
    }
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
          setCars(parsedCache);
          setLoading(false);
        }
      }
    } catch (e) {}
    const carsRef = collection(db, "cars");
      const q = query(carsRef, limit(carLimit));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const car of seedCars) {
            await setDoc(doc(db, "cars", car.id), car);
          }
        } catch (err) {
          const saved = localStorage.getItem(STORAGE_KEY);
          const parsed = saved ? JSON.parse(saved) : null;
          setCars(Array.isArray(parsed) ? parsed : []);
        }
      } else {
        const carsList = [];
        const now = new Date();
        snapshot.forEach((doc) => {
          const data = doc.data();
          data.id = doc.id;
          if (data.status?.isVerified && data.status?.verifiedExpiry) {
            const expiryDate = new Date((data.status?.verifiedExpiry || ""));
            if (!isNaN(expiryDate.getTime()) && expiryDate < now) {
              if (data.status) data.status.isVerified = false;
            }
          }
          carsList.push(data);
        });
        carsList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        const firestoreCarIds = new Set(carsList.map(c => c.id));
        for (const seed of seedCars) {
          if (!firestoreCarIds.has(seed.id)) {
            carsList.push(seed);
          }
        }
        setCars(carsList);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(carsList));
        } catch (err) {}
      }
      setLoading(false);
      }, (err) => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setCars(Array.isArray(parsed) ? parsed : []);
        setLoading(false);
      });
      return () => unsubscribe();
  }, [!!currentUser, carLimit]);

  const toggleFavorite = async (carId) => {
    if (!currentUser) {
      window.showAlert("Vui lòng đăng nhập để lưu xe.");
      return;
    }
    try {
      const currentFavs = currentUser.favorites || [];
      const isLiked = currentFavs.includes(carId);
      const newFavs = isLiked ? currentFavs.filter(id => id !== carId) : [...currentFavs, carId];
      const updatedUser = { ...currentUser, favorites: newFavs };
      setCurrentUser(updatedUser);
      localStorage.setItem("web-thue-xe-user", JSON.stringify(updatedUser));
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { favorites: newFavs });
      const carRef = doc(db, "cars", carId);
      const carDoc = await getDoc(carRef);
      if (carDoc.exists()) {
        const carData = carDoc.data();
        const currentPop = carData.status?.popularity || 0;
        await updateDoc(carRef, {
          "status.popularity": isLiked ? Math.max(0, currentPop - 1) : currentPop + 1
        });
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật yêu thích:", err);
    }
  };

  const handleSaveCar = async (car) => {
    if (!car.slug) {
      car.slug = generateSlug(car.basicInfo.brand + ' ' + car.basicInfo.model);
    }
    try {
      if (currentUser?.role === 'owner') {
        if (!currentUser.cccdNumber || !currentUser.cccdImage) {
          window.showAlert("Vui lòng hoàn thiện thông tin định danh pháp lý (Số CCCD, Ảnh CCCD) trong phần 'Tài khoản' trước khi đăng bài.");
          return;
        }
      }
      const isNewCar = !car.id;
      if (isNewCar) {
        const freePosts = currentUser?.freePosts !== undefined ? currentUser.freePosts : 2;
        if (freePosts <= 0 && (currentUser?.tokens || 0) < 1) {
          window.showAlert("Số dư Token của bạn không đủ để đăng bài (Cần 1 Token). Vui lòng nạp thêm Token trong phần Tài khoản.");
          return;
        }
      }
      const carId = car.id || `CAR-${String(Date.now()).slice(-6)}`;
      const plate = car.basicInfo?.plate?.trim();
      if (plate) {
        const isDuplicate = cars.some(c => c.id !== carId && c.basicInfo?.plate?.trim() === plate);
        if (isDuplicate) {
           window.showAlert("Biển số xe này đã tồn tại trên hệ thống. Không thể tạo xe trùng lặp.");
           return;
        }
      }
      const todayStr = today();
      const updatedCar = {
        ...car,
        id: carId,
        ownerId: currentUser?.uid,
        createdAt: car.createdAt || todayStr,
        updatedAt: todayStr
      };
      updatedCar.basicInfo.name = `${updatedCar.basicInfo.brand || ''} ${updatedCar.basicInfo.model || ''} ${updatedCar.basicInfo.version || ''} ${updatedCar.basicInfo.year || ''}`.replace(/\s+/g, ' ').trim();
      if (window.location.protocol === 'file:' || currentUser?.isGuest) {
        setCars((current) => {
          let next;
          if (car.id && current.some((item) => item.id === car.id)) {
            next = current.map((item) => (item.id === car.id ? updatedCar : item));
          } else {
            next = [updatedCar, ...current];
          }
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (err) {}
          return next;
        });
      } else {
        await setDoc(doc(db, "cars", carId), updatedCar);
        if (isNewCar && currentUser) {
          const freePosts = currentUser.freePosts !== undefined ? currentUser.freePosts : 2;
          if (freePosts > 0) {
            await updateDoc(doc(db, "users", currentUser.uid), { freePosts: freePosts - 1 });
            setCurrentUser(prev => ({ ...prev, freePosts: freePosts - 1 }));
            window.showAlert(`Đã đăng xe thành công! Bạn còn ${freePosts - 1} lượt đăng xe MIỄN PHÍ.`);
          } else {
            const newTokens = (currentUser.tokens || 0) - 1;
            await updateDoc(doc(db, "users", currentUser.uid), { tokens: newTokens });
            setCurrentUser(prev => ({ ...prev, tokens: newTokens }));
            window.showAlert("Đã đăng xe thành công! Tài khoản bị trừ 1 Token.");
          }
        } else {
          window.showAlert("Đã lưu thông tin xe thành công.");
        }
      }
      setEditingId(null);
      navigate('/trang-chu');
    } catch (err) {
      window.showAlert("Lỗi lưu thông tin xe: " + err.message);
    }
  };

  const editingCar = cars.find((car) => car.id === editingId);

  useEffect(() => {
    if (!adminMode && activeTab === "add") {
      navigate('/trang-chu');
      setEditingId(null);
    }
  }, [adminMode, activeTab]);

  const appLoading = authLoading || (currentUser && loading);

  if (appLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--m-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="bouncing-dot" style={{ animationDelay: '0s' }}></div>
            <div className="bouncing-dot" style={{ animationDelay: '0.15s' }}></div>
            <div className="bouncing-dot" style={{ animationDelay: '0.3s' }}></div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--m-primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            LOADING...
          </div>
          <style>{`
            .bouncing-dot {
              width: 12px;
              height: 12px;
              background-color: var(--m-primary);
              border-radius: 50%;
              animation: bounce 1.4s infinite ease-in-out both;
            }
            @keyframes bounce {
              0%, 80%, 100% { 
                transform: scale(0);
                opacity: 0.3;
              }
              40% { 
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen 
      showToast={(msg) => { if (window.showAlert) window.showAlert(msg); else alert(msg); }}
      onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem("web-thue-xe-user", JSON.stringify(user));
          navigate('/trang-chu');
        }} 
    />;
  }

  return (
    <div className="app-shell">

      {policyGate && (
        <DataProtectionPolicy 
          isModal 
          currentUser={currentUser} 
          onSave={(u) => {
            setCurrentUser(u);
            localStorage.setItem("web-thue-xe-user", JSON.stringify(u));
          }}
          onConfirmSuccess={() => {
             setPolicyGate(null);
             if (policyGate.cb) policyGate.cb();
          }}
          onBack={() => setPolicyGate(null)}
          onViewDetails={() => {
            setPolicyGate(null);
            setCurrentView("policy_details");
            navigate('/cai-dat');
          }}
        />
      )}
      {/* ── HEADER ── */}
      <ModuleFrame className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          
          <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "flex-start", height: 44 }}><img src={"/logo.png"} alt="Logo" style={{ width: 'auto', height: '100%', objectFit: 'contain' }} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px' }}>Thuê Xe Nhanh</h1>
            <p className="hide-mobile" style={{ margin: 0, fontSize: '12px', color: 'var(--m-subtle)' }}>Nền tảng thuê xe tự lái siêu tốc</p>
          </div>
        </div>
        <div className="user-profile" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }} className="hide-mobile">
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--m-dark)' }}>{currentUser.name}</div>
            <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>
              {currentUser.role === 'admin' ? '⚙️ Quản trị viên' : currentUser.role === 'owner' ? 'Chủ xe' : 'Khách thuê'}
            </div>
          </div>
          <img 
            src={currentUser.avatar} 
            alt="Avatar" 
            referrerPolicy="no-referrer"
            style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }} 
            onClick={() => navigate('/cai-dat')}
            title="Cài đặt tài khoản"
          />
          <button className="icon-button" title="Đăng xuất" onClick={() => {
            window.showConfirm('Bạn có chắc chắn muốn đăng xuất không?', async () => {
              try {
                await logout();
              } catch (e) {
                console.error("Lỗi khi đăng xuất Firebase:", e);
              }
              localStorage.removeItem("web-thue-xe-user");
              setCurrentUser(null);
              navigate('/trang-chu');
            });
          }}>
            <LogOut size={18} />
          </button>
        </div>
      </ModuleFrame>

      {/* ── TABS ── */}
      {activeTab !== "account" && activeTab !== "admin" && (adminMode || currentUser?.role === 'admin') && (
        <ModuleFrame className="tabs">
        <button id="tab-overview" className={activeTab === "overview" ? "selected" : ""} onClick={() => navigate('/trang-chu')}>
            <LayoutGrid size={17} />
            {adminMode ? "Xe của tôi" : "Danh sách xe"}
          </button>
          {adminMode && (
            <button id="tab-add" className={activeTab === "add" ? "selected" : ""} onClick={() => {
              window.requirePolicyGate(() => {
                if (checkProfileForOwner()) {
                  navigate('/dang-xe');
                }
              });
            }}>
              {editingId ? "Chỉnh sửa xe" : "Thêm xe mới"}
            </button>
          )}
          {currentUser.role?.startsWith('admin_') && (
            <button id="tab-admin" className={activeTab === "admin" ? "selected" : ""} onClick={() => navigate('/admin')} style={activeTab === 'admin' ? {} : { color: 'var(--m-mid)' }}>
              <Shield size={17} /> Trang Admin
            </button>
          )}

        </ModuleFrame>
      )}

      {activeTab === "landing" && (
        <LandingPage onExplore={() => navigate('/trang-chu')} />
      )}
      
      {activeTab === "overview" && (
        <Overview loadMoreCars={() => setCarLimit(prev => prev + 20)} hasMoreCars={cars.length >= carLimit}
          cars={cars}
          adminMode={adminMode}
          currentUser={currentUser}
          onToggleFavorite={toggleFavorite}
          onRequestLocation={() => setShowLocationPopup(true)}
          onEdit={(id) => {
            window.requirePolicyGate(() => {
              if (checkProfileForOwner()) {
                setEditingId(id);
                navigate('/dang-xe');
              }
            });
          }}
          onDelete={async (id) => {
            window.showConfirm("Bạn có chắc chắn muốn xóa xe này?", async () => {
              try {
                if (window.location.protocol === 'file:' || currentUser?.isGuest) {
                  setCars((current) => {
                    const next = current.filter((car) => car.id !== id);
                    try {
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                    } catch (err) {
                      console.error("Lỗi lưu offline:", err);
                    }
                    return next;
                  });
                } else {
                  await deleteDoc(doc(db, "cars", id));
                }
              } catch (err) {
                console.error("Lỗi xóa xe:", err);
                window.showAlert("Lỗi xóa xe: " + err.message);
              }
            });
          }}
          onDuplicate={async (car) => {
            try {
              const newId = `CAR-${String(Date.now()).slice(-6)}`;
              const todayStr = today();
              const duplicatedCar = {
                ...car,
                id: newId,
                createdAt: todayStr,
                updatedAt: todayStr
              };

              if (window.location.protocol === 'file:' || currentUser?.isGuest) {
                setCars((current) => {
                  const next = [duplicatedCar, ...current];
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                  } catch (err) {
                    console.error("Lỗi lưu offline:", err);
                  }
                  return next;
                });
              } else {
                await setDoc(doc(db, "cars", newId), duplicatedCar);
              }
            } catch (err) {
              console.error("Lỗi nhân bản xe:", err);
              window.showAlert("Lỗi nhân bản xe: " + err.message);
            }
          }}
          onStatus={async (id, status) => {
            try {
              if (window.location.protocol === 'file:' || currentUser?.isGuest) {
                setCars((current) => {
                  const next = current.map((car) =>
                    car.id === id
                      ? { ...car, rentalInfo: { ...car.rentalInfo, status }, updatedAt: today() }
                      : car
                  );
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                  } catch (err) {
                    console.error("Lỗi lưu offline:", err);
                  }
                  return next;
                });
              } else {
                const carRef = doc(db, "cars", id);
                await updateDoc(carRef, {
                  "rentalInfo.status": status,
                  updatedAt: today()
                });
              }
            } catch (err) {
              console.error("Lỗi cập nhật trạng thái:", err);
              window.showAlert("Lỗi cập nhật trạng thái: " + err.message);
            }
          }}
        />
      )}
      
      {activeTab === "add" && (
        <AddCarForm editingCar={editingCar} currentUser={currentUser} onSave={handleSaveCar} onCancel={() => { setEditingId(null); navigate('/trang-chu'); }} />
      )}

      {activeTab === "admin" && (
        <ErrorBoundary>
          <AdminDashboard cars={cars} currentUser={currentUser} onClose={() => navigate('/trang-chu')} onDeleteCar={handleDeleteCarGlobal} />
        </ErrorBoundary>
      )}

      {showLocationPopup && (
        <SetLocationPopup 
          currentUser={currentUser}
          onClose={() => setShowLocationPopup(false)}
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem("web-thue-xe-user", JSON.stringify(updatedUser));
            setShowLocationPopup(false);
          }}
        />
      )}

      {activeTab === "account" && (
        <AccountSettingsScreen 
          user={currentUser} 
          cars={cars}
          onToggleFavorite={toggleFavorite}
          onClose={() => navigate('/trang-chu')} 
          onAdmin={() => navigate('/admin')}
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem("web-thue-xe-user", JSON.stringify(updatedUser));
          }} 
        />
      )}
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--m-dark)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--r-full)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-lg)' }}>
          <span>{toast.message}</span>
        </div>
      )}
      {/* Footer */}
      {/* Footer */}
      <footer style={{ padding: '32px 16px 120px 16px', background: '#f8fafc', color: 'var(--m-subtle)', fontSize: 13, marginTop: 'auto', borderTop: '1px solid var(--m-border)', lineHeight: 1.6 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Copyright and Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--m-dark)' }}>Thuê Xe Nhanh © {new Date().getFullYear()}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>Phiên bản thử nghiệm v07.26.2</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {!isInstalled && (
                 <button onClick={handleInstallClick} className="secondary" style={{ fontSize: 13, height: 36, padding: '0 12px', background: 'transparent' }}>📲 Tải ứng dụng</button>
              )}
              <button onClick={() => navigate('/cong-dong')} className="secondary" style={{ fontSize: 13, height: 36, padding: '0 12px', background: 'transparent' }}>🛡️ Cộng đồng</button>
              <button onClick={() => navigate('/faq')} className="secondary" style={{ fontSize: 13, height: 36, padding: '0 12px', background: 'transparent' }}>❓ FAQ - Hỏi đáp</button>
            </div>
          </div>
        </div>
      </footer>

      {location.pathname === '/faq' && <FaqModal onClose={() => navigate(-1)} />}
      {location.pathname === '/cong-dong' && <CommunityModal currentUser={currentUser} onClose={() => navigate(-1)} />}

      {/* Confirm Modal */}
      {confirmDialog && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: 350, width: '90%', textAlign: 'center', padding: 24, background: 'var(--m-surface)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: 12, fontSize: 18, color: 'var(--m-dark)' }}>Xác nhận</h3>
            <p style={{ marginBottom: 24, color: 'var(--m-mid)', fontSize: 14 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="secondary" style={{ flex: 1 }} onClick={() => setConfirmDialog(null)}>Hủy</button>
              <button className="primary" style={{ flex: 1, background: 'var(--m-red)', borderColor: 'var(--m-red)' }} onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { App };

import { AdminLayout } from './modules/Admin/AdminLayout.jsx';

function RootApp() {
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    window.showAlert = (message) => {
      setToast({ message });
      setTimeout(() => setToast(null), 3000);
    };
    window.showConfirm = (message, onConfirm) => {
      setConfirmDialog({ message, onConfirm });
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/*" element={<App />} />
      </Routes>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '12px 24px', borderRadius: 999, zIndex: 99999, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(0,0,0,.3)', maxWidth: '90vw', textAlign: 'center', fontSize: 14 }}>
          {toast.message}
        </div>
      )}
      {/* Confirm Dialog */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 340, width: '90%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,.2)' }}>
            <h3 style={{ marginBottom: 10, fontSize: 18, color: '#1e293b' }}>Xác nhận</h3>
            <p style={{ marginBottom: 24, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="secondary" style={{ flex: 1 }} onClick={() => setConfirmDialog(null)}>Hủy</button>
              <button className="primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }} onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export { RootApp };
