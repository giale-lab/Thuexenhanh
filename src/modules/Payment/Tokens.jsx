import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { Stat } from '../Shared/UIKit.jsx';

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
