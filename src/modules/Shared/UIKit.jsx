import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, ADMIN_EMAILS, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';

function AppLogo({ size = 40, style = {}, variant = "light" }) {
  const blueColor = variant === "dark" ? "#FFFFFF" : "#0A3161";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width={size} height={size / 2} style={{ objectFit: 'contain', ...style }}>
      <path fill="none" stroke={blueColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" d="M 40 125 C 40 100, 80 95, 110 90 C 140 85, 160 60, 210 60 C 260 60, 300 85, 330 95 C 345 100, 360 110, 350 135 C 345 145, 335 140, 335 140" />
      <path fill="none" stroke={blueColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" d="M 40 125 C 45 135, 60 135, 80 135" />
      <path fill="none" stroke={blueColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" d="M 140 135 L 250 135" />
      <path fill="none" stroke={blueColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" d="M 310 135 L 335 140" />
      <circle cx="110" cy="130" r="22" fill="none" stroke={blueColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="110" cy="130" r="10" fill={blueColor} />
      <circle cx="280" cy="130" r="22" fill="none" stroke={blueColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="280" cy="130" r="10" fill={blueColor} />
      <path fill="#DA251D" d="M 75 110 C 140 110, 190 90, 250 65 C 230 100, 260 105, 300 95 C 230 145, 130 140, 75 110 Z" />
      <polygon fill="#FFC107" points="165,95 169,104 179,104 171,110 174,119 165,113 156,119 159,110 151,104 161,104" />
      <path fill="none" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" d="M 235 95 C 260 105, 300 115, 345 75" />
      <path fill="#FFC107" d="M 320 30 Q 325 40 335 40 Q 325 40 320 50 Q 315 40 305 40 Q 315 40 320 30 Z" />
    </svg>
  );
}

export { AppLogo };

function LazyImage({ src, alt, className = '', style = {}, priority = false }) {
  const [status, setStatus] = useState('loading');
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    // Handle already-cached images: browser won't fire onLoad again
    if (el.complete && el.naturalWidth > 0) {
      setStatus('loaded');
    }
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`car-img-lazy ${status} ${className}`}
      style={style}
      onLoad={() => setStatus('loaded')}
      onError={(e) => { setStatus('loaded'); /* show broken icon instead of invisible */ }}
    />
  );
}

export { LazyImage };

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line meta" />
        <div className="skeleton skeleton-line title" />
        <div className="skeleton skeleton-line" style={{ width: '85%' }} />
        <div className="skeleton skeleton-line price" style={{ marginTop: 4 }} />
      </div>
    </div>
  );
}

export { SkeletonCard };

function ImageSlider({ images, alt, useThumb = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  if (!images || images.length === 0) {
    return <div className="image-fallback"><Car size={36} strokeWidth={1.5} /></div>;
  }

  const nextSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const onTouchStartEvent = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveEvent = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) nextSlide();
    if (distance < -minSwipeDistance) prevSlide();
  };

  return (
    <div className="image-slider" onTouchStart={onTouchStartEvent} onTouchMove={onTouchMoveEvent} onTouchEnd={onTouchEndEvent}>
      <LazyImage
        src={useThumb ? (images[currentIndex].thumb_url || images[currentIndex].url) : images[currentIndex].url}
        alt={alt}
        priority={currentIndex === 0}
      />
      {images.length > 1 && (
        <>
          <button className="slider-btn prev" onClick={prevSlide}><ChevronLeft size={20} /></button>
          <button className="slider-btn next" onClick={nextSlide}><ChevronRight size={20} /></button>
          <div className="slider-dots">
            {images.map((_, idx) => (
              <span key={idx} className={`dot ${idx === currentIndex ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { ImageSlider };

function ModuleFrame({ className = "", children, ...props }) {
  // Đã bỏ admin-outline và module-label
  return (
    <section className={`module-frame ${className}`} {...props}>
      {children}
    </section>
  );
}

export { ModuleFrame };

function StatusBadge({ status }) {
  const label = status === "available" ? "Xe trống" : "Xe bận";
  return (
    <ModuleFrame className={`status-badge ${status}`}>
      <BadgeCheck size={12} />
      {label}
    </ModuleFrame>
  );
}

export { StatusBadge };

function Field({ path, label, type = "text", required, options, value, error, onChange, readOnly, placeholder }) {
  const inputId = path.replaceAll(".", "-");
  return (
    <label className={`${type === "textarea" ? "wide-field" : ""} ${readOnly ? "field-readonly" : ""}`} htmlFor={inputId}>
      <span>{label}{required ? " *" : ""}</span>
      {type === "select" ? (
        <select id={inputId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={readOnly}>
          <option value="">Chọn</option>
          {options?.map((opt) => Array.isArray(opt)
            ? <option key={opt[0]} value={opt[0]}>{opt[1]}</option>
            : <option key={opt} value={opt}>{opt}</option>
          )}
        </select>
      ) : type === "textarea" ? (
        <textarea id={inputId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} readOnly={readOnly} />
      ) : type === "number" ? (
        <input id={inputId} type="text" value={fmtNum(value) ?? ""} onChange={(e) => {
          const raw = e.target.value.replace(/\./g, '');
          if (raw === '' || !isNaN(raw)) onChange(raw);
        }} readOnly={readOnly} />
      ) : type === "toggle" ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
          <div 
            onClick={() => {
              if (readOnly) return;
              onChange(value === 'Điện' ? 'Cơ' : 'Điện');
            }}
            style={{
              width: 44, height: 24, borderRadius: 24, 
              background: value === 'Điện' ? '#3b82f6' : '#e5e7eb',
              position: 'relative', cursor: readOnly ? 'default' : 'pointer',
              transition: 'background 0.3s'
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 2, left: value === 'Điện' ? 22 : 2,
              transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-dark)', cursor: readOnly ? 'default' : 'pointer' }} onClick={() => { if (!readOnly) onChange(value === 'Điện' ? 'Cơ' : 'Điện'); }}>Xe điện</span>
        </div>
      ) : (
        <input id={inputId} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder} />
      )}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export { Field };

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: disabled ? 'default' : 'pointer', fontSize: 14, color: 'var(--m-dark)', userSelect: 'none', opacity: disabled ? 0.6 : 1, padding: '10px 0' }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--m-primary)', cursor: disabled ? 'default' : 'pointer' }} />
      {label}
    </label>
  );
}

export { Toggle };

function DepositField({ depositType, depositAmount, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--m-dark)' }}>Tiền cọc</label>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: depositType === 'none' ? 'var(--m-dark)' : 'var(--m-mid)', fontWeight: depositType === 'none' ? 600 : 400 }}>
            <input type="checkbox" checked={depositType === 'none'} onChange={() => onChange('none', 0)} style={{ width: 14, height: 14, accentColor: 'var(--m-primary)', cursor: 'pointer' }} />
            Không cọc
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: depositType === 'cash' ? 'var(--m-dark)' : 'var(--m-mid)', fontWeight: depositType === 'cash' ? 600 : 400 }}>
            <input type="checkbox" checked={depositType === 'cash'} onChange={() => onChange('cash', depositAmount)} style={{ width: 14, height: 14, accentColor: 'var(--m-primary)', cursor: 'pointer' }} />
            Tiền mặt
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: depositType === 'motorbike' ? 'var(--m-dark)' : 'var(--m-mid)', fontWeight: depositType === 'motorbike' ? 600 : 400 }}>
            <input type="checkbox" checked={depositType === 'motorbike'} onChange={() => onChange('motorbike', 15000000)} style={{ width: 14, height: 14, accentColor: 'var(--m-primary)', cursor: 'pointer' }} />
            Xe máy
          </label>
        </div>
      </div>
      {depositType === 'cash' ? (
        <input
          type="text"
          value={fmtNum(depositAmount) ?? ""}
          onChange={e => {
             const raw = e.target.value.replace(/\./g, '');
             if (raw === '' || !isNaN(raw)) onChange('cash', Number(raw));
            }}
          placeholder="15.000.000"
          style={{ height: 40, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none' }}
        />
      ) : (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--m-bg)', fontSize: 14, color: 'var(--m-mid)', border: '1.5px solid var(--m-border)' }}>
          Xe máy – giá trị tương đương {(15000000).toLocaleString('vi-VN')}đ
        </div>
      )}
    </div>
  );
}

export { DepositField };

function FilterCheckboxGroup({ label, values, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, gridColumn: '1 / -1', marginBottom: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--m-dark)' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {options.map(opt => {
          const val = Array.isArray(opt) ? opt[0] : (typeof opt === 'object' ? opt.value : opt);
          const display = Array.isArray(opt) ? opt[1] : (typeof opt === 'object' ? opt.label : opt);
          const checked = Array.isArray(values) && values.includes(val);
          return (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)' }}>
              <input type="checkbox" checked={checked} onChange={(e) => {
                const cur = Array.isArray(values) ? values : [];
                if (e.target.checked) onChange([...cur, val]);
                else onChange(cur.filter(x => x !== val));
              }} style={{ width: 14, height: 14, accentColor: 'var(--m-primary)', cursor: 'pointer' }} />
              {display}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export { FilterCheckboxGroup };

function FilterToggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div 
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 24, 
          background: checked ? 'var(--m-primary)' : '#e5e7eb',
          position: 'relative', cursor: 'pointer',
          transition: 'background 0.3s'
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-dark)', cursor: 'pointer' }} onClick={() => onChange(!checked)}>{label}</span>
    </div>
  );
}

export { FilterToggle };

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--m-dark)' }}>{label}</span>
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ height: 40, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none', background: '#fff' }}>
        <option value="">Tất cả</option>
        {options.map((opt, i) => {
          const val = Array.isArray(opt) ? opt[0] : (typeof opt === 'object' ? opt.value : opt);
          const text = Array.isArray(opt) ? opt[1] : (typeof opt === 'object' ? opt.label : opt);
          return <option key={val || i} value={val}>{text}</option>;
        })}
      </select>
    </div>
  );
}

export { FilterSelect };

function Stat({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', padding: 20, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--m-subtle)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--m-dark)' }}>{value}</div>
      </div>
    </div>
  );
}

export { Stat };

function ImageUploadOptimizer({ images, onChange }) {
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const accepted = Array.from(files).filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    if (!accepted.length) return;
    setProcessing(true);
    try {
      const optimized = [];
      for (const file of accepted) {
        optimized.push(await Core.uploadToImgBB(file));
      }
      onChange([...images, ...optimized]);
    } catch (err) {
      window.showAlert("Không thể xử lý ảnh này, vui lòng thử ảnh khác.");
      console.error(err);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <ModuleFrame className="upload-section">
      <div className="section-title">
        <h3>Hình ảnh xe</h3>
        <p>Thêm hình ảnh xe ngoại thất và nội thất</p>
      </div>
      <div
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
        {processing ? <RefreshCcw className="spin" size={28} strokeWidth={1.8} /> : <Upload size={28} strokeWidth={1.8} />}
        <strong>{processing ? "Đang tối ưu ảnh..." : "Kéo thả hoặc nhấn để chọn ảnh"}</strong>
        <span>Hỗ trợ JPG, PNG, WebP · Ảnh đầu tiên là ảnh đại diện</span>
      </div>
      <div className="image-list">
        {images.map((img, idx) => (
          <div className="thumb" key={`${img.url}-${idx}`}>
            <img src={img.url} alt={img.name || `Ảnh xe ${idx + 1}`} />
            <div>
              <strong>{idx === 0 ? "Ảnh đại diện" : img.role || "Ảnh xe"}</strong>
              <span>{img.name}</span>
            </div>
            <button type="button" className="icon-button" onClick={() => onChange(images.filter((_, i) => i !== idx))}>
              <X size={15} />
            </button>
          </div>
        ))}
        {!images.length && (
          <div className="no-images">
            <ImagePlus size={20} strokeWidth={1.8} />
            Chưa có ảnh xe nào.
          </div>
        )}
      </div>
    </ModuleFrame>
  );
}

export { ImageUploadOptimizer };

function InfoPanel({ title, items }) {
  return (
    <div className="info-panel">
      <h3>{title}</h3>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Chưa có"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export { InfoPanel };
