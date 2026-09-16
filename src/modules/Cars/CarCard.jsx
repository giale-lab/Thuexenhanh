import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, ADMIN_EMAILS, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { ImageSlider, ModuleFrame, Toggle, Stat } from '../Shared/UIKit.jsx';

function CarCard({ car, isWeekend, rentalTimeRange, adminMode, currentUser, ownerEmailVerified, onView, onMap, onEdit, onDelete, onDuplicate, onStatus, liked, likeCount, onToggleLike }) {
  const isUnlocked = currentUser?.unlockedCars?.includes(car.id) || (window.unlockedCars && window.unlockedCars.has(car.id)) || adminMode || (currentUser && currentUser.uid === car.ownerId);
  const [contactStep, setContactStep] = useState(isUnlocked ? 1 : 0);
  const currentStep = isUnlocked ? Math.max(1, contactStep) : contactStep;
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [quickReportCategory, setQuickReportCategory] = useState('');
  const [quickReportNote, setQuickReportNote] = useState('');
  const [submittingQuickReport, setSubmittingQuickReport] = useState(false);

  const handleBoost = async (e) => {
    e.stopPropagation();
    if (currentUser?.uid !== car.ownerId) {
      window.showAlert("Chỉ chủ xe mới có thể đẩy tin.");
      return;
    }
    if ((currentUser?.tokens || 0) < 1) {
      window.showAlert("Không đủ Token (Cần 1 Token) để đẩy tin. Vui lòng nạp thêm trong phần Tài khoản.");
      return;
    }
    window.showConfirm("Xác nhận dùng 1 Token để đẩy xe lên đầu trong 24 giờ?", async () => {
      try {
        const newTokens = (currentUser.tokens || 0) - 1;
        await updateDoc(doc(db, "users", currentUser.uid), { tokens: newTokens });
        const promoteTime = new Date();
        promoteTime.setHours(promoteTime.getHours() + 24);
        await updateDoc(doc(db, "cars", car.id), {
          "status.promotedUntil": promoteTime.toISOString()
        });
        window.showAlert("Đã đẩy tin thành công! Xe sẽ được ưu tiên hiển thị trong 24h.");
      } catch (err) {
        window.showAlert("Lỗi đẩy tin: " + err.message);
      }
    });
  };

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

  const handleZaloClick = (e) => {
    e.stopPropagation();
    const msg = getZaloMsg();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(() => {
        if (window.showAlert) window.showAlert("Đã copy tin nhắn mẫu. Bạn hãy dán (Paste) vào khung chat Zalo nhé!");
      }).catch(()=>{});
    }
  };
  const owner = getOwnerInfo(car);
  const activePrice = isWeekend && car.rentalInfo.weekendPrice ? car.rentalInfo.weekendPrice : car.rentalInfo.dayPrice;
  const zaloPhone = phoneDigits(owner.zaloPhone || owner.phone);

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `https://thuexe.vnigo.sbs/${encodeURIComponent(car.basicInfo.plate)}`;
    const title = `${car.basicInfo.brand} ${car.basicInfo.model} ${car.basicInfo.year}`;
    const text = `🚗 ${title} · ${formatCurrency(activePrice)}/ngày · ${car.rentalInfo.pickupLocation || ''}`;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      window.showAlert('🔗 Đã copy link xe!');
    } catch {
      window.showAlert('🔗 Link: ' + url);
    }
  };

  return (
    <ModuleFrame className={`car-card ${(car.status?.isVerified || false) ? 'verified-card' : ''}`} onClick={() => !adminMode && onView(car)} style={{ cursor: !adminMode ? 'pointer' : 'default' }}>
      {/* Image area */}
      <ModuleFrame className="car-image">
        <ImageSlider images={car.images} alt={`\${car.basicInfo.brand} \${car.basicInfo.model}`} useThumb={true} />
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8, zIndex: 10 }}>
          <button className="icon-button img-overlay-btn" title="Chia sẻ xe" onClick={handleShare} style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(4px)', border: 'none', width: 34, height: 34, borderRadius: '50%' }}>
            <Share2 size={16} />
          </button>
          <button className="icon-button img-overlay-btn" title={liked ? "Bỏ lưu xe" : "Lưu xe"} onClick={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(); }} style={{ background: 'rgba(0,0,0,0.4)', color: liked ? "var(--m-red)" : '#fff', backdropFilter: 'blur(4px)', border: 'none', width: 34, height: 34, borderRadius: '50%' }}>
            <Heart size={16} fill={liked ? "var(--m-red)" : "none"} />
          </button>
          {!adminMode && (
            <button className="icon-button img-overlay-btn" title="Báo cáo xe này" onClick={(e) => { e.stopPropagation(); setShowQuickReport(true); }} style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(4px)', border: 'none', width: 34, height: 34, borderRadius: '50%' }}>
              <Flag size={14} />
            </button>
          )}
          {adminMode && (
            <button className="icon-button img-overlay-btn" title="Xem nhanh" onClick={(e) => { e.stopPropagation(); onView(car); }} style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(4px)', border: 'none', width: 34, height: 34, borderRadius: '50%' }}>
              <Eye size={16} />
            </button>
          )}
        </div>
        {/* Gói Tối ưu / Demo Badge */}
        {(car.status?.isDemo || false) && (
          <span className="badge-verified" style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 4, height: 26, padding: '0 10px', borderRadius: 'var(--r-full)', background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, zIndex: 10, backdropFilter: 'blur(6px)' }}>
            <BadgeCheck size={14} /> DEMO
          </span>
        )}
        {car.technicalInfo?.fuel === 'Điện' && !car.rentalInfo?.chargeFee && (
          <span style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: 'var(--r-full)', background: 'var(--m-primary)', color: '#fff', fontSize: 10, fontWeight: 700, zIndex: 10, backdropFilter: 'blur(6px)', letterSpacing: 0.3 }}>
            ⚡ Free sạc
          </span>
        )}
      </ModuleFrame>

      {/* Body */}
      <div className="card-body">
        {/* Badges container */}
        {(car.rentalInfo?.requireDeposit === false || car.rentalInfo?.deliverySupport) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {car.rentalInfo?.requireDeposit === false && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, border: '1px solid var(--m-border)', fontSize: 11, fontWeight: 500, color: 'var(--m-dark)' }}>
                <ShieldCheck size={14} style={{ color: 'var(--m-primary)' }} /> Miễn thế chấp
              </span>
            )}
            {car.rentalInfo?.deliverySupport && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, border: '1px solid var(--m-border)', fontSize: 11, fontWeight: 500, color: 'var(--m-dark)' }}>
                <MapPin size={14} style={{ color: '#ea580c' }} /> Giao xe tận nơi
              </span>
            )}
          </div>
        )}

        {/* Car name + view button */}
        <div className="card-title-row">
          <h2 title={`${car.basicInfo.brand} ${car.basicInfo.model} ${car.basicInfo.year}`}>
            {car.basicInfo.brand} {car.basicInfo.model} {car.basicInfo.year}
          </h2>
        </div>

        {/* Rating + likes */}
        <div className="card-meta">
          <span className="rating">
            <Star size={14} fill="currentColor" />
            {(car.status?.reviewCount || 0) > 0 ? (
              <><span style={{fontWeight: 600}}>{(car.status?.rating || 0)}</span> <span style={{fontSize: 11, color: 'var(--m-subtle)'}}>({(car.status?.reviewCount || 0)})</span></>
            ) : <span style={{fontSize: 12, color: 'var(--m-subtle)'}}>Chưa đánh giá</span>}
            <Heart size={12} fill="var(--m-red)" color="var(--m-red)" style={{marginLeft: 6}} />
            <span className="trip-count">{likeCount}</span>
            {adminMode && (
              <>
                <Eye size={12} style={{marginLeft: 12, color: 'var(--m-blue)'}} />
                <span className="trip-count" style={{color: 'var(--m-blue)'}} title="Số lượt xem xe">{car.status?.viewCount || 0}</span>
                <Phone size={12} style={{marginLeft: 6, color: 'var(--m-primary)'}} />
                <span className="trip-count" style={{color: 'var(--m-primary)'}} title="Số lượt bấm số điện thoại">{car.status?.contactClickCount || 0}</span>
              </>
            )}
          </span>
        </div>

        {/* Compact spec grid */}
        <div className="spec-grid">
          <span><Gauge size={14} />{car.technicalInfo.fuelConsumption ? (car.technicalInfo.fuel === 'Điện' && !car.technicalInfo.fuelConsumption.includes('%') ? car.technicalInfo.fuelConsumption + '/1%' : car.technicalInfo.fuelConsumption) : 'N/A'}</span>
          <span><ShieldCheck size={14} />{car.technicalInfo.fuel || 'N/A'}</span>
          <span><Users size={14} />{car.basicInfo?.seats || '4'} chỗ</span>
          <button type="button" className="map-link" onClick={(e) => { e.stopPropagation(); onMap(car.rentalInfo.pickupLocation); }}>
            <MapPin size={14} />{car.rentalInfo.pickupLocation || 'Chưa cập nhật'}
          </button>
        </div>
        
        {/* Extra Info for List View */}
        <div className="list-only-info">
            {car.rentalInfo?.requireDeposit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} style={{ color: 'var(--m-blue)' }} /> Yêu cầu đặt cọc</div>
            )}
            {car.rentalInfo?.requireMotorbike && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} style={{ color: 'var(--m-blue)' }} /> Yêu cầu thế chấp xe máy</div>
            )}
            {car.rentalInfo?.requireLicense && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} style={{ color: 'var(--m-blue)' }} /> Yêu cầu đối chiếu GPLX</div>
            )}

          {car.rentalInfo?.deposit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} style={{ color: 'var(--m-blue)' }} /> Yêu cầu cọc: {car.rentalInfo.deposit}</div>
          )}
          {car.technicalInfo?.type && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Car size={14} style={{ color: 'var(--m-primary)' }} /> Kiểu dáng: {car.technicalInfo.type}</div>
          )}
          {car.descriptions?.amenities?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Check size={14} style={{ color: 'var(--m-primary)' }} /> Tính năng: {car.descriptions.amenities.slice(0, 4).join(', ')}{car.descriptions.amenities.length > 4 ? '...' : ''}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="card-divider" />

        {/* Price row */}
        <ModuleFrame className="price-row">
          <strong>{formatCurrency(activePrice)}</strong>
          <span>/ ngày {isWeekend && car.rentalInfo.weekendPrice ? '(cuối tuần)' : ''}</span>
          <small>{car.depositType === 'none' ? 'Không cọc' : car.depositType === 'motorbike' ? 'Cọc bằng xe máy' : (car.depositAmount || car.rentalInfo?.deposit) ? `Cọc ${formatCurrency(car.depositAmount || car.rentalInfo?.deposit)}` : 'Không cọc'}</small>
        </ModuleFrame>

        {/* Admin actions */}
        {adminMode && (
          <ModuleFrame className="action-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button onClick={() => onEdit(car.id)}><Edit3 size={14} />Sửa</button>
            <button onClick={handleBoost} style={{ color: '#10b981', borderColor: '#10b981' }}><ArrowUpCircle size={14} />Đẩy tin</button>
            <button onClick={() => onDuplicate(car)}><Copy size={14} />Nhân bản</button>
            <select value={car.rentalInfo.status === 'available' ? 'available' : 'busy'} onChange={(e) => onStatus(car.id, e.target.value)} aria-label="Đổi trạng thái">
              <option value="available">Xe trống</option>
              <option value="busy">Xe bận</option>
            </select>
            <button className="danger" onClick={(e) => { e.stopPropagation(); onDelete(car.id) }}><Trash2 size={14} />Xóa</button>
          </ModuleFrame>
        )}

        {/* Guest actions */}
        {!adminMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {currentStep === 0 && (
              <button className="primary" style={{ width: '100%', height: 38 }} onClick={(e) => { 
                e.stopPropagation(); 
                window.requirePolicyGate(() => {
                  if (window.deductTokens) {
                    window.deductTokens(0, car.ownerId, car.id, () => setContactStep(1));
                  } else {
                    setContactStep(1);
                  }
                }); 
              }}>Liên hệ chủ xe</button>
            )}
            {currentStep === 1 && (
              <button className="secondary" style={{ width: '100%', height: 38 }} onClick={(e) => { 
                e.stopPropagation(); 
                setContactStep(2); 
                if (!adminMode && currentUser?.uid !== car.ownerId && window.location.protocol !== 'file:') {
                  updateDoc(doc(db, 'cars', car.id), { 'status.contactClickCount': increment(1) }).catch(console.error);
                }
              }}>{owner.phone}</button>
            )}
            {currentStep === 2 && (
              <div style={{ display: 'flex', gap: 8 }}>
                 <a className="secondary" style={{ flex: 1, height: 38 }} href={`tel:${phoneDigits(owner.phone)}`} onClick={e => e.stopPropagation()}>Gọi điện</a>
                 <a className="zalo-button" style={{ flex: 1, height: 38 }} href={`https://zalo.me/${zaloPhone}?text=${encodeURIComponent(getZaloMsg())}`} target="_blank" rel="noreferrer" onClick={handleZaloClick}>Nhắn Zalo</a>
              </div>
            )}
          </div>
        )}

        {adminMode && (
          <div className="tech-meta">
            Gop: {(car.status?.verifiedPlan || "") || ((car.status?.isVerified || false) ? 'Tối ưu (Vĩnh viễn)' : 'Cơ bản')} • Hết hạn: {(car.status?.verifiedExpiry || "") || 'Không thời hạn'}{(car.status?.dataWarning || "") ? ` • ⚠️ ${(car.status?.dataWarning || "")}` : ""}
          </div>
        )}
      </div>

      {/* Quick Report Mini Modal */}
      {showQuickReport && (
        <div className="modal-backdrop" style={{ zIndex: 99999 }} onClick={() => setShowQuickReport(false)}>
          <section className="map-modal" style={{ maxWidth: 380, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--m-red)', marginBottom: 14 }}>
              <Flag size={18} />
              <h3 style={{ margin: 0, fontSize: 16 }}>Báo cáo: {car.basicInfo?.brand} {car.basicInfo?.model}</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
              {['📞 SĐT không đúng','🚘 Biển số sai/giả','📷 Ảnh xe không thật','💰 Giá ảo / phí ẩn','📝 Thông tin sai lệch','⚠️ Lừa đảo / gian lận'].map(cat => (
                <button key={cat} onClick={() => setQuickReportCategory(cat)}
                  style={{ padding: '5px 11px', borderRadius: 99, border: `1.5px solid ${quickReportCategory === cat ? '#ef4444' : 'var(--m-border)'}`, background: quickReportCategory === cat ? '#fee2e2' : 'var(--m-bg)', color: quickReportCategory === cat ? '#b91c1c' : 'var(--m-mid)', fontSize: 12.5, fontWeight: quickReportCategory === cat ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {cat}
                </button>
              ))}
            </div>
            <textarea className="wide-field" rows={2} placeholder="Mô tả thêm (không bắt buộc)..." value={quickReportNote} onChange={e => setQuickReportNote(e.target.value)} style={{ marginBottom: 14, fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="secondary" style={{ flex: 1 }} onClick={() => setShowQuickReport(false)}>Hủy</button>
              <button className="primary" style={{ flex: 1, background: 'var(--m-red)', borderColor: 'var(--m-red)' }}
                disabled={!quickReportCategory || submittingQuickReport}
                onClick={async () => {
                  if (!currentUser || currentUser.isGuest) { window.showAlert('Vui lòng đăng nhập để báo cáo.'); return; }
                  setSubmittingQuickReport(true);
                  try {
                    await addDoc(collection(db, 'reports'), {
                      carId: car.id, carName: `${car.basicInfo?.brand} ${car.basicInfo?.model} ${car.basicInfo?.year}`,
                      carPlate: car.basicInfo?.plate || '',
                      userId: currentUser.uid, userName: currentUser.name || currentUser.email || 'Khách',
                      reportCategory: quickReportCategory, reason: quickReportNote.trim() || quickReportCategory,
                      status: 'pending', createdAt: new Date().toISOString()
                    });
                    setShowQuickReport(false); setQuickReportCategory(''); setQuickReportNote('');
                    window.showAlert('✅ Đã gửi báo cáo đến quản trị viên.');
                  } catch(err) { window.showAlert('Lỗi: ' + err.message); }
                  finally { setSubmittingQuickReport(false); }
                }}>
                {submittingQuickReport ? 'Đang gửi...' : '🚩 Gửi báo cáo'}
              </button>
            </div>
          </section>
        </div>
      )}
    </ModuleFrame>
  );
}

export { CarCard };
