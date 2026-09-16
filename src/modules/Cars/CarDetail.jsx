import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, ADMIN_EMAILS, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { ImageSlider, ModuleFrame, Toggle, Stat, InfoPanel } from '../Shared/UIKit.jsx';

function CarDetailModal({ car, isWeekend, rentalTimeRange, adminMode, currentUser = null, onMap, onClose, onEdit, ownerCarCount, onViewOwner }) {
  const isUnlocked = currentUser?.unlockedCars?.includes(car.id) || (window.unlockedCars && window.unlockedCars.has(car.id)) || adminMode || (currentUser && currentUser.uid === car.ownerId);
  const [contactStep, setContactStep] = useState(isUnlocked ? 1 : 0);
  const currentStep = isUnlocked ? Math.max(1, contactStep) : contactStep;
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState("");

  const getZaloMsg = () => {
    let msg = `Chào ${owner.name || 'chủ xe'}, mình muốn thuê xe ${car.basicInfo.brand} ${car.basicInfo.model}`;
    if (rentalTimeRange && rentalTimeRange.startDate && rentalTimeRange.endDate) {
      const formatNum = (n) => n < 10 ? '0'+n : n;
      const startD = `${formatNum(rentalTimeRange.startDate.getDate())}/${formatNum(rentalTimeRange.startDate.getMonth()+1)}`;
      const endD = `${formatNum(rentalTimeRange.endDate.getDate())}/${formatNum(rentalTimeRange.endDate.getMonth()+1)}`;
      msg += `, từ ${rentalTimeRange.startTime || '21:00'} ngày ${startD} đến ${rentalTimeRange.endTime || '20:00'} ngày ${endD}`;
    }
    msg += `
(Thuexenhanh)`;
    return msg;
  };

  const handleZaloClick = () => {
    const msg = getZaloMsg();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(() => {
        if (window.showAlert) window.showAlert("Đã copy tin nhắn mẫu. Bạn hãy dán (Paste) vào khung chat Zalo nhé!");
      }).catch(()=>{});
    }
  };
  const [commentRating, setCommentRating] = useState(5);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!car.id) return;
    
    // View Tracking
    if (!adminMode && currentUser?.uid !== car.ownerId && window.location.protocol !== 'file:') {
      updateDoc(doc(db, 'cars', car.id), {
        'status.viewCount': increment(1)
      }).catch(err => console.error("Error updating view count:", err));
    }

    // Không dùng orderBy ở đây để tránh cần composite index trên Firestore
    const q = query(collection(db, 'comments'), where('carId', '==', car.id));
    const unsub = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      // Sort client-side: mới nhất lên trên
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setComments(data);
    }, (err) => {
      console.error("Lỗi tải bình luận:", err);
    });
    return () => unsub();
    }, [car.id]);

    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    useEffect(() => {
      if (!window.history.state || window.history.state.modal !== "CarDetail") {
        window.history.pushState({ modal: "CarDetail", carId: car.id }, "");
      }
      const handlePopState = (e) => {
        if (!e.state || e.state.modal !== "CarDetail") {
          if (onCloseRef.current) onCloseRef.current();
        }
      // no-op if e.state.modal === "CarDetail", so we stay open

        if (onCloseRef.current) onCloseRef.current();
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state && window.history.state.modal === "CarDetail") {
          window.history.back();
        }
      };
    }, []);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    
    // Check login first
    if (!currentUser || currentUser.isGuest) {
      window.showAlert("Vui lòng đăng nhập bằng Google để đánh giá.");
      return;
    }

    window.showConfirm("Đánh giá sau khi gửi sẽ không thể xóa hoặc chỉnh sửa. Bạn có chắc chắn muốn gửi?", async () => {
      setSubmittingComment(true);
      try {
        await addDoc(collection(db, 'comments'), {
        carId: car.id,
        userId: currentUser.uid,
        userName: currentUser.name || "Khách",
        userAvatar: currentUser.avatar || "",
        text: commentText.trim(),
        rating: commentRating,
        likes: [],
        dislikes: [],
        replies: [],
        createdAt: new Date().toISOString()
      });

      const newCount = ((car.status?.reviewCount || 0) || 0) + 1;
      const currentTotal = ((car.status?.rating || 0) || 5) * ((car.status?.reviewCount || 0) || 0);
      const newRating = parseFloat(((currentTotal + commentRating) / newCount).toFixed(1));
      
      try {
        await updateDoc(doc(db, "cars", car.id), {
          "status.rating": newRating,
          "status.reviewCount": newCount
        });
      } catch (err) {
        console.error("Không thể cập nhật sao cho xe (có thể do offline hoặc lỗi quyền):", err);
      }

      setCommentText("");
      setCommentRating(5);
      setShowCommentForm(false);
        window.showAlert("Đã gửi đánh giá!");
      } catch (err) {
        window.showAlert("Lỗi: " + err.message);
      } finally {
        setSubmittingComment(false);
      }
    });
  };

  const handleDeleteComment = (commentId) => {
    window.showConfirm("Bạn có chắc chắn muốn xóa đánh giá này không?", async () => {
      try {
        await deleteDoc(doc(db, "comments", commentId));
        window.showAlert("Đã xóa đánh giá.");
      } catch (err) {
        window.showAlert("Lỗi: " + err.message);
      }
    });
  };

  const handleToggleLike = async (commentId, type) => {
    if (!currentUser || currentUser.isGuest) {
      window.showAlert("Vui lòng đăng nhập bằng Google để thao tác.");
      return;
    }
    const c = comments.find(x => x.id === commentId);
    if (!c) return;
    let newLikes = c.likes || [];
    let newDislikes = c.dislikes || [];
    
    if (type === 'like') {
      if (newLikes.includes(currentUser.uid)) {
        newLikes = newLikes.filter(uid => uid !== currentUser.uid);
      } else {
        newLikes.push(currentUser.uid);
        newDislikes = newDislikes.filter(uid => uid !== currentUser.uid);
      }
    } else {
      if (newDislikes.includes(currentUser.uid)) {
        newDislikes = newDislikes.filter(uid => uid !== currentUser.uid);
      } else {
        newDislikes.push(currentUser.uid);
        newLikes = newLikes.filter(uid => uid !== currentUser.uid);
      }
    }
    try {
      await updateDoc(doc(db, 'comments', commentId), { likes: newLikes, dislikes: newDislikes });
    } catch (err) {
      window.showAlert("Lỗi: " + err.message);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) return;
    const c = comments.find(x => x.id === commentId);
    if (!c) return;
    
    const newReply = {
      id: Date.now().toString(),
      userId: currentUser.uid,
      userName: currentUser.name || "Khách",
      userAvatar: currentUser.avatar || "",
      text: replyText.trim(),
      createdAt: new Date().toISOString()
    };
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        replies: [...(c.replies || []), newReply]
      });
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      window.showAlert("Lỗi gửi phản hồi: " + err.message);
    }
  };

  const handleOpenReport = () => {
    if (!currentUser || currentUser.isGuest) {
      window.showAlert("Vui lòng đăng nhập bằng Google để báo cáo.");
      return;
    }
    if (!currentUser.emailVerified) {
      window.showAlert("Vui lòng xác minh email trước khi báo cáo xe (kiểm tra hộp thư của bạn).");
      return;
    }
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportCategory) { window.showAlert('Vui lòng chọn loại vi phạm.'); return; }
    setSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        carId: car.id,
        carName: car.basicInfo?.name || `${car.basicInfo?.brand} ${car.basicInfo?.model} ${car.basicInfo?.year}` || 'Không rõ',
        carPlate: car.basicInfo?.plate || '',
        userId: currentUser.uid,
        userName: currentUser.name || currentUser.email || 'Khách',
        reportCategory,
        reason: reportReason.trim() || reportCategory,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setShowReportModal(false);
      setReportCategory('');
      setReportReason("");
      window.showAlert("✅ Báo cáo đã được gửi tới Quản trị viên.");
    } catch (err) {
      window.showAlert("Lỗi gửi báo cáo: " + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const owner = getOwnerInfo(car);
  const activePrice = isWeekend && car.rentalInfo.weekendPrice ? car.rentalInfo.weekendPrice : car.rentalInfo.dayPrice;
  const zaloPhone = phoneDigits(owner.zaloPhone || owner.phone);
  const specs = [
    ["Hãng xe", car.basicInfo.brand],
    ["Dòng xe", car.basicInfo.model],
    ["Năm sản xuất", car.basicInfo.year],
    ["Biển số", car.basicInfo.plate],
    ["Số chỗ", `${car.basicInfo.seats} chỗ`],
    ["Nhiên liệu", car.technicalInfo.fuel],
    ["Hộp số", car.technicalInfo.transmission],
    ["Động cơ", car.technicalInfo.engine],
    ["Dẫn động", car.technicalInfo.drivetrain],
    ["Tiêu hao", car.technicalInfo.fuelConsumption ? (car.technicalInfo.fuel === 'Điện' && !car.technicalInfo.fuelConsumption.includes('%') ? car.technicalInfo.fuelConsumption + '/1%' : car.technicalInfo.fuelConsumption) : 'N/A']
  ];
  const depositLabel = car.depositType === 'none'
    ? 'Không yêu cầu'
    : car.depositType === 'motorbike'
    ? 'Xe máy thế chấp (~15.000.000đ)'
    : formatCurrency(car.depositAmount || car.rentalInfo.deposit);
  const rental = [
    ["Theo ngày", formatCurrency(activePrice) + (isWeekend && car.rentalInfo.weekendPrice ? " (giá cuối tuần)" : "")],
    ["Tiền cọc", depositLabel],
    ["Giới hạn km", car.rentalInfo.dailyKmLimit ? `${Number(car.rentalInfo.dailyKmLimit).toLocaleString('vi-VN')} km/ngày` : ''],
    ["Phí vượt/km", formatCurrency(car.rentalInfo.overKmFee)],
    ...(car.technicalInfo?.fuel === 'Điện' ? [
      ["Phí sạc pin", car.rentalInfo.chargeFee ? `${formatCurrency(car.rentalInfo.chargeFee)}/1%` : 'Miễn phí'],
      ["Miễn phí sạc pin", car.rentalInfo.freeCharge ? `Cho ${car.rentalInfo.freeCharge} km đầu` : '']
    ] : []),
    ["Nhận xe", car.rentalInfo.pickupLocation ? <span className="clickable-location" style={{ color: 'var(--m-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }} onClick={(e) => { e.stopPropagation(); onMap(car.rentalInfo.pickupLocation); }}><MapPin size={14} /> {car.rentalInfo.pickupLocation}</span> : "Chưa cập nhật"]
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <ModuleFrame className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-hero">
          <ImageSlider images={car.images} alt={car.basicInfo.name} />
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={17} />
          </button>
          {/* Share button */}
          <button
            onClick={async () => {
              const url = `https://thuexe.vnigo.sbs/${encodeURIComponent(car.basicInfo.plate)}`;
              const title = `${car.basicInfo.brand} ${car.basicInfo.model} ${car.basicInfo.year}`;
              const text = `🚗 ${title} · ${formatCurrency(activePrice)}/ngày`;
              if (navigator.share) {
                try { await navigator.share({ title, text, url }); return; } catch {}
              }
              try {
                await navigator.clipboard.writeText(url);
                window.showAlert('🔗 Đã copy link xe!');
              } catch {
                window.showAlert('🔗 Link: ' + url);
              }
            }}
            aria-label="Chia sẻ"
            style={{
              position: 'absolute', bottom: 16, right: 16,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
              border: 'none', borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', zIndex: 10,
              transition: 'background .2s'
            }}
          >
            <Share2 size={16} />
          </button>
        </div>
        <div className="detail-content">
          <div className="detail-title" style={{ position: 'relative' }}>
            <div style={{ paddingRight: 32 }}>
              <h2>
                {car.basicInfo.name}
                {(car.status?.isDemo || false) && (
                  <span style={{marginLeft: 8, display: 'inline-block', verticalAlign: 'text-bottom', background: '#f59e0b', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 'bold'}} title="Xe mẫu">DEMO</span>
                )}
              </h2>
              <div className="card-meta" style={{ marginTop: 8, marginBottom: 12 }}>
                <span className="rating">
                  <Star size={14} fill="currentColor" />
                  {car.reviews?.length > 0 ? (
                    <><span style={{fontWeight:600}}>{(car.reviews.reduce((a, b) => a + b.rating, 0) / car.reviews.length).toFixed(1)}</span> <span style={{color:'var(--m-subtle)',fontSize:12}}>({car.reviews.length} đánh giá)</span></>
                  ) : (
                    <span>Chưa đánh giá</span>
                  )}
                </span>
                <span className="likes" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--m-subtle)', fontSize: 13, fontWeight: 500 }}>
                  <Heart size={14} fill="var(--m-red)" color="var(--m-red)" />
                  {(car.status?.popularity || 0) || 0}
                </span>
              </div>
              <p>{car.descriptions.short}</p>
            </div>
            <div className="detail-price" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
              <strong style={{ display: 'inline-block', whiteSpace: 'nowrap', color: 'var(--m-primary)', fontSize: '24px', fontWeight: 800 }}>
                {formatCurrency(car.rentalInfo.dayPrice)}<span style={{ fontSize: '15px', color: 'var(--m-subtle)', fontWeight: 'normal', marginLeft: 4 }}>/ ngày</span>
              </strong>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                {car.rentalInfo.hourPrice && car.rentalInfo.hourPrice > 0 && (
                  <strong style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.9em', color: 'var(--m-mid)' }}>
                    {formatCurrency(car.rentalInfo.hourPrice)}<span style={{ fontSize: '0.65em', fontWeight: 'normal', marginLeft: 4 }}>/ giờ</span>
                  </strong>
                )}
                {car.rentalInfo.weekendPrice && car.rentalInfo.weekendPrice > 0 && (
                  <strong style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.9em', color: 'var(--m-mid)' }}>
                    {formatCurrency(car.rentalInfo.weekendPrice)}<span style={{ fontSize: '0.65em', fontWeight: 'normal', marginLeft: 4 }}>/ cuối tuần</span>
                  </strong>
                )}
                {car.rentalInfo.weekPrice && car.rentalInfo.weekPrice > 0 && (
                  <strong style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.9em', color: 'var(--m-mid)' }}>
                    {formatCurrency(car.rentalInfo.weekPrice)}<span style={{ fontSize: '0.65em', fontWeight: 'normal', marginLeft: 4 }}>/ tuần</span>
                  </strong>
                )}
                {car.rentalInfo.monthPrice && car.rentalInfo.monthPrice > 0 && (
                  <strong style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.9em', color: 'var(--m-mid)' }}>
                    {formatCurrency(car.rentalInfo.monthPrice)}<span style={{ fontSize: '0.65em', fontWeight: 'normal', marginLeft: 4 }}>/ tháng</span>
                  </strong>
                )}
              </div>
            </div>
          </div>

          <div className="owner-contact" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: onViewOwner ? 'pointer' : 'default' }} onClick={onViewOwner}>
              <img src={car.ownerInfo?.avatar || "/guest-avatar.png"} onError={(e) => { if (!e.target.src.includes('guest-avatar')) e.target.src = "/guest-avatar.png"; }} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '15px' }}>{owner.name}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--m-subtle)' }}>
                  {ownerCarCount ? `${ownerCarCount} xe • ` : ''}Tham gia: {car.ownerInfo?.joinDate || "2023"}
                </p>
              </div>
            </div>
            <div className="contact-actions">
              {currentStep === 0 ? (
                <button className="primary" style={{ width: '100%', whiteSpace: 'nowrap' }} onClick={(e) => { 
                  e.stopPropagation(); 
                  window.requirePolicyGate(() => {
                    if (window.deductTokens) {
                      window.deductTokens(0, car.ownerId, car.id, () => setContactStep(1));
                    } else {
                      setContactStep(1);
                    }
                  }); 
                }}>Xem SĐT liên hệ (0 Token)</button>
              ) : (
                <>
                  <a className="secondary" style={{ whiteSpace: 'nowrap' }} href={`tel:${phoneDigits(owner.phone)}`} onClick={() => {
                    if (!adminMode && currentUser?.uid !== car.ownerId && window.location.protocol !== 'file:') {
                      updateDoc(doc(db, 'cars', car.id), { 'status.contactClickCount': increment(1) }).catch(console.error);
                    }
                  }}>Gọi điện</a>
                  <a className="zalo-button" style={{ whiteSpace: 'nowrap' }} href={`https://zalo.me/${zaloPhone}?text=${encodeURIComponent(getZaloMsg())}`} target="_blank" rel="noreferrer" onClick={(e) => {
                    handleZaloClick(e);
                    if (!adminMode && currentUser?.uid !== car.ownerId && window.location.protocol !== 'file:') {
                      updateDoc(doc(db, 'cars', car.id), { 'status.contactClickCount': increment(1) }).catch(console.error);
                    }
                  }}>Nhắn Zalo</a>
                </>
              )}
            </div>
          </div>

          <div className="detail-columns">
            <InfoPanel title="Thông số xe" items={specs} />
            <InfoPanel title="Thông tin thuê" items={rental} />
          </div>

          <div className="detail-note">
            <h3>Mô tả chi tiết</h3>
            <p>{car.descriptions.detail || "Không có mô tả chi tiết."}</p>
            <h3>Tiện nghi nổi bật</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {Array.isArray(car.descriptions.amenities) && car.descriptions.amenities.length > 0 ? (
                car.descriptions.amenities.map((amenity, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'var(--m-bg)', borderRadius: 20, fontSize: 13, color: 'var(--m-dark)', fontWeight: 500, border: '1px solid var(--m-border)' }}>
                    <Check size={14} style={{ color: 'var(--m-primary)' }} />
                    {amenity}
                  </span>
                ))
              ) : (
                <p>{car.descriptions.amenities || "Không có thông tin tiện nghi."}</p>
              )}
            </div>
            <h3>Điều kiện thuê</h3>
                          {car.rentalInfo?.requireDeposit || car.rentalInfo?.requireMotorbike || car.rentalInfo?.requireLicense || car.rentalInfo?.rentalCondition ? (
                <ul style={{ paddingLeft: 20, margin: '8px 0 0 0', lineHeight: 1.6, color: 'var(--m-dark)' }}>
                  {car.rentalInfo?.requireDeposit && <li>Yêu cầu đặt cọc</li>}
                  {car.rentalInfo?.requireMotorbike && <li>Yêu cầu thế chấp xe máy (hoặc tiền mặt tương đương)</li>}
                  {car.rentalInfo?.requireLicense && <li>Yêu cầu đối chiếu bản gốc GPLX khi nhận xe</li>}
                  {car.rentalInfo?.rentalCondition && <li>{car.rentalInfo.rentalCondition}</li>}
                </ul>
              ) : (
                <p>Không có điều kiện đặc biệt.</p>
              )}
            
            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--m-border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Đánh giá & Bình luận ({comments.length})</h3>
              <button className="secondary" style={{ padding: '6px 12px', fontSize: 13, height: 32 }} onClick={() => {
                if (currentUser?.isGuest) {
                  window.showAlert("Vui lòng đăng nhập bằng Google để lưu xe.");
                  return;
                }
                setLiked(!liked);
              }}>
                <Heart size={14} style={{ marginRight: 6 }} fill={liked ? "var(--m-red)" : "none"} color={liked ? "var(--m-red)" : "currentColor"} />
                {liked ? "Đã lưu" : "Lưu xe"}
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid var(--m-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, opacity: currentUser?.isGuest ? 0.5 : 1, pointerEvents: currentUser?.isGuest ? 'none' : 'auto' }}>
                <span style={{ fontSize: 14, fontWeight: 600, marginRight: 8 }}>Đánh giá của bạn:</span>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={20} 
                    style={{ cursor: 'pointer' }}
                    fill={star <= commentRating ? "var(--m-amber)" : "none"} 
                    color={star <= commentRating ? "var(--m-amber)" : "var(--m-subtle)"} 
                    onClick={() => setCommentRating(star)} 
                  />
                ))}
              </div>
              <textarea 
                className="search-box" 
                style={{ width: '100%', height: 80, padding: '12px 16px', borderRadius: 10, fontSize: 14, resize: 'none', marginBottom: 12 }} 
                placeholder={currentUser?.isGuest ? "Bạn hãy đăng nhập để bình luận" : "Chia sẻ trải nghiệm thuê xe của bạn..."} 
                value={commentText} 
                readOnly={currentUser?.isGuest}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!currentUser?.isGuest && commentText.trim()) handleSubmitComment();
                  }
                }}
                onClick={() => {
                  if (currentUser?.isGuest) window.showAlert("Vui lòng đăng nhập bằng Google để bình luận.");
                }}
                onChange={(e) => setCommentText(e.target.value)} 
              />
              {!currentUser?.isGuest && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="primary" onClick={handleSubmitComment} disabled={submittingComment || !commentText.trim()}>
                    {submittingComment ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </div>
              )}
            </div>

            <div className="comments-section" style={{ background: 'var(--m-bg)', padding: comments.length ? '16px 0' : 0, borderRadius: 12 }}>
              {comments.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--m-subtle)' }}>Chưa có bình luận nào. Hãy là người đầu tiên đánh giá chiếc xe này!</div>
              ) : comments.map((comment, index) => (
                <React.Fragment key={comment.id}>
                  {index > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--m-border)', margin: '16px 0' }} />}
                  <div style={{ padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <img src={comment.userAvatar || "/guest-avatar.png"} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      <strong style={{ fontSize: 13 }}>{comment.userName}</strong>
                      <span style={{ fontSize: 12, color: 'var(--m-subtle)' }}>• {new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={12} fill={star <= comment.rating ? "var(--m-amber)" : "none"} color={star <= comment.rating ? "var(--m-amber)" : "var(--m-border)"} strokeWidth={star <= comment.rating ? 0 : 2} />
                      ))}
                    </div>
                    <p style={{ fontSize: 13, margin: '0 0 10px', color: 'var(--m-mid)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{comment.text}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                      <button style={{ background: 'none', border: 'none', color: (comment.likes || []).includes(currentUser?.uid) ? 'var(--m-blue)' : 'var(--m-subtle)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => handleToggleLike(comment.id, 'like')}>
                        <ThumbsUp size={14} fill={(comment.likes || []).includes(currentUser?.uid) ? "var(--m-blue)" : "none"} /> {(comment.likes || []).length || 0}
                      </button>
                      <button style={{ background: 'none', border: 'none', color: (comment.dislikes || []).includes(currentUser?.uid) ? 'var(--m-red)' : 'var(--m-subtle)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => handleToggleLike(comment.id, 'dislike')}>
                        <ThumbsDown size={14} fill={(comment.dislikes || []).includes(currentUser?.uid) ? "var(--m-red)" : "none"} /> {(comment.dislikes || []).length || 0}
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button style={{ background: 'none', border: 'none', color: 'var(--m-red)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, marginLeft: 'auto' }} onClick={() => handleDeleteComment(comment.id)} title="Xóa đánh giá">
                          <Trash2 size={14} /> Xóa
                        </button>
                      )}
                      <button style={{ background: 'none', border: 'none', color: 'var(--m-subtle)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => {
                        if (currentUser?.isGuest) { window.showAlert("Vui lòng đăng nhập để phản hồi."); return; }
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      }}>
                        <Reply size={14} /> Phản hồi
                      </button>
                    </div>

                    {replyingTo === comment.id && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 16 }}>
                        <img src={currentUser?.avatar || "/guest-avatar.png"} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                        <input type="text" className="search-box" style={{ flex: 1, padding: '4px 12px', fontSize: 13, height: 32 }} placeholder="Viết phản hồi..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReply(comment.id); }} autoFocus />
                        <button className="primary" style={{ padding: '0 12px', height: 32 }} onClick={() => handleSubmitReply(comment.id)}><Send size={14} /></button>
                      </div>
                    )}

                    {(comment.replies || []).length > 0 && (
                      <div style={{ marginLeft: 32, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {comment.replies.map(reply => (
                          <div key={reply.id} style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 14px', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <img src={reply.userAvatar || "/guest-avatar.png"} alt="Avatar" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                              <strong style={{ fontSize: 12 }}>{reply.userName}</strong>
                              <span style={{ fontSize: 11, color: 'var(--m-subtle)' }}>• {new Date(reply.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p style={{ fontSize: 13, margin: 0, color: 'var(--m-mid)', lineHeight: 1.5 }}>{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {!adminMode && (
            <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px dashed var(--m-border)' }}>
              <button className="secondary" style={{ padding: '8px 16px', fontSize: 13, color: 'var(--m-red)', borderColor: 'var(--m-red)' }} onClick={handleOpenReport} title="Báo cáo xe vi phạm">
                <AlertTriangle size={15} style={{ marginRight: 6 }} /> Báo cáo xe này
              </button>
            </div>
          )}

          {adminMode && (
            <div className="modal-footer">
              <span>Biển số: <strong style={{color: 'var(--m-dark)'}}>{car.basicInfo?.plate || 'Chưa cập nhật'}</strong> • Trạng thái: {formatBusyDates(car.rentalInfo?.blockedDates) ? <strong style={{color: '#d97706'}}>{formatBusyDates(car.rentalInfo?.blockedDates)}</strong> : <strong style={{color: 'var(--m-green)'}}>Sẵn sàng</strong>}</span>
              <button className="primary" onClick={() => onEdit(car.id)}><Edit3 size={15} />Sửa xe</button>
            </div>
          )}
        </div>
      </ModuleFrame>

      {showReportModal && (
        <div className="modal-backdrop" style={{ zIndex: 100000 }} onClick={() => setShowReportModal(false)}>
          <section className="map-modal" style={{ maxWidth: 440, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--m-red)', marginBottom: 12 }}>
              <AlertTriangle size={22} />
              <h2 style={{ margin: 0, fontSize: 18 }}>Báo cáo xe vi phạm</h2>
            </div>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
              🚗 <strong>{car.basicInfo?.brand} {car.basicInfo?.model} {car.basicInfo?.year}</strong>
              {car.basicInfo?.plate && <span style={{ marginLeft: 8, opacity: 0.7 }}>• Biển: {car.basicInfo.plate}</span>}
            </div>
            <p style={{ fontSize: 13, color: 'var(--m-mid)', marginBottom: 12, margin: '0 0 12px' }}>
              Chọn loại vi phạm <span style={{ color: 'var(--m-red)' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['📞 SĐT không đúng','🚘 Biển số sai/giả','📷 Ảnh xe không thật','💰 Giá ảo / phí ẩn','📝 Thông tin sai lệch','⚠️ Lừa đảo / gian lận','🚫 Nội dung không phù hợp'].map(cat => (
                <button key={cat} onClick={() => setReportCategory(cat)}
                  style={{ padding: '6px 13px', borderRadius: 99, border: `1.5px solid ${reportCategory === cat ? '#ef4444' : 'var(--m-border)'}`, background: reportCategory === cat ? '#fee2e2' : 'var(--m-bg)', color: reportCategory === cat ? '#b91c1c' : 'var(--m-mid)', fontSize: 13, fontWeight: reportCategory === cat ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {cat}
                </button>
              ))}
            </div>
            <textarea
              className="wide-field"
              rows="3"
              placeholder="Mô tả thêm chi tiết (không bắt buộc)..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ marginBottom: 16, fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="secondary" style={{ flex: 1 }} onClick={() => { setShowReportModal(false); setReportCategory(''); setReportReason(''); }}>Hủy</button>
              <button className="primary" style={{ flex: 1, background: 'var(--m-red)', borderColor: 'var(--m-red)' }} onClick={handleSubmitReport} disabled={submittingReport || !reportCategory}>
                {submittingReport ? "Đang gửi..." : "🚩 Gửi báo cáo"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export { CarDetailModal };
