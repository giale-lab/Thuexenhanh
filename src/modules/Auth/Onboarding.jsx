import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { Toggle, Stat } from '../Shared/UIKit.jsx';

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
