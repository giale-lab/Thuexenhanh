import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { ModuleFrame, Field, Toggle, Stat, ImageUploadOptimizer } from '../Shared/UIKit.jsx';
import { LocationPicker, MapboxLocationPicker } from '../Shared/Location.jsx';
import { UpgradeModal } from '../Payment/Tokens.jsx';

function AddCarForm({ editingCar, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (editingCar) return normalizeCarForm(editingCar);
    const newForm = clone(emptyForm);
    if (currentUser) {
      newForm.ownerInfo.name = currentUser.name || "";
      newForm.ownerInfo.phone = currentUser.phone || currentUser.phoneNumber || "";
      if (currentUser.location) newForm.location = currentUser.location;
    }
    return newForm;
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [packageType, setPackageType] = useState("premium");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPremiumOptions, setShowPremiumOptions] = useState(false);
  const [showPremiumInfo, setShowPremiumInfo] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    setForm(editingCar ? normalizeCarForm(editingCar) : (() => {
      const newForm = clone(emptyForm);
      if (currentUser) {
        newForm.ownerInfo.name = currentUser.name || "";
        newForm.ownerInfo.phone = currentUser.phone || currentUser.phoneNumber || "";
        if (currentUser.location) newForm.location = currentUser.location;
      }
      return newForm;
    })());
    setPackageType("premium");
    setErrors({});
  }, [editingCar, currentUser]);

  const setPathValue = (path, value) => {
    setForm((current) => {
      let updated = setAtPath(current, path, value);
      if (path === "basicInfo.brand") {
        updated = setAtPath(updated, "basicInfo.model", ""); // reset model khi đổi brand
      }
      return updated;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    
    // Tự động tạo tên xe cho gói cơ bản vì gói này không có trường nhập tên
    const finalForm = { ...form };
      if (!finalForm.basicInfo.name) {
      finalForm.basicInfo = { 
        ...finalForm.basicInfo, 
        name: `${finalForm.basicInfo.brand || ''} ${finalForm.basicInfo.model || ''} ${finalForm.basicInfo.year || ''}`.trim() 
      };
    }

    const validation = validateCar(finalForm, packageType);
    setErrors(validation);
    if (Object.keys(validation).length) {
      window.showAlert("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }
    setSaving(true);
    await delay(450);
    onSave({
      ...finalForm,
      status: {
        ...finalForm.status,
        isVerified: packageType === "premium"
      },
      id: editingCar?.id || finalForm.id,
      createdAt: editingCar?.createdAt || today(),
      updatedAt: today()
    });
    setSaving(false);
  };

  const disableForm = false;

  return (
    <main className="content">
      <form className="form-layout" onSubmit={submit}>

        <div className="package-selector" style={{ display: 'none', gap: 16, marginBottom: 24 }}>
          <div
            className={`pkg-card ${packageType === 'basic' ? 'active' : ''}`}
            onClick={() => setPackageType('basic')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h3>Đăng nhanh</h3>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--m-primary)', background: 'var(--m-primary-light)', padding: '2px 8px', borderRadius: 20 }}>MIỄN PHÍ</span>
            </div>
            <p>Đăng nhanh chỉ 5 trường. Thích hợp cho ai muốn liệt kê xe nhanh.</p>
          </div>
          <div
            className={`pkg-card premium-pkg ${packageType === 'premium' ? 'active' : ''}`}
            onClick={() => setPackageType('premium')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h3>Tối ưu</h3>
              <BadgeCheck size={18} fill="var(--m-primary)" color="#fff" />
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--m-primary)', padding: '2px 8px', borderRadius: 20 }}>TRẢ PHÍ</span>
            </div>
            <p>Đầy đủ thông số kỹ thuật, giới hạn Km, tích xanh xác nhận. Thu hút khách hàng gấp 3 lần.</p>
            {editingCar?.status?.isVerified ? (
              <div style={{ marginTop: 16, padding: '12px', background: '#fff', borderRadius: 8, border: '1px solid var(--m-primary)' }}>
                <div style={{ color: 'var(--m-primary)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Đã kích hoạt Gói Tối ưu</div>
                <div style={{ fontSize: 13, color: 'var(--m-mid)' }}>Gói: {(editingCar.status?.verifiedPlan || "") || 'Vĩnh viễn'} • Hết hạn: {(editingCar.status?.verifiedExpiry || "") || 'Không thời hạn'}</div>
              </div>
            ) : packageType === 'premium' && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!showPremiumOptions ? (
                  <>
                    {emailNotVerified && (
                      <div style={{ background: '#fef9c3', border: '1px solid #fbbf24', borderRadius: 10, padding: '12px 14px', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e', marginBottom: 6 }}>⚠️ Chưa xác minh email</div>
                        <p style={{ fontSize: 13, color: '#78350f', margin: '0 0 10px', lineHeight: 1.5 }}>Bạn cần xác minh email trước khi nâng cấp gói. Kiểm tra hộp thư <strong>{auth.currentUser?.email}</strong>.</p>
                        {!verifySent ? (
                          <button
                            type="button"
                            style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: sendingVerify ? 'not-allowed' : 'pointer', opacity: sendingVerify ? 0.7 : 1 }}
                            onClick={async () => {
                              try {
                                setSendingVerify(true);
                                await verifyEmail();
                                setVerifySent(true);
                              } catch (err) {
                                window.showAlert('Lỗi gửi email: ' + err.message);
                              } finally {
                                setSendingVerify(false);
                              }
                            }}
                            disabled={sendingVerify}
                          >
                            {sendingVerify ? 'Đang gửi...' : 'Gửi lại email xác minh'}
                          </button>
                        ) : (
                          <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>✅ Đã gửi! Kiểm tra hộp thư rồi tải lại trang.</div>
                        )}
                      </div>
                    )}
                    <button 
                      type="button" 
                      className="secondary" 
                      style={{ width: '100%', padding: '8px 0', fontSize: 13, borderColor: 'var(--m-primary)', color: 'var(--m-primary)', background: '#fff' }} 
                      onClick={(e) => { 
                        e.stopPropagation();
                        setEmailNotVerified(false);
                        setShowPremiumInfo(true); 
                      }}
                    >
                      <Info size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} /> Thông tin gói Tối ưu
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: '1m', label: '1 Tháng - 39K', title: 'Gói 1 Tháng', price: '39.000đ' },
                      { id: '3m', label: '3 Tháng - 99K', title: 'Gói 3 Tháng', price: '99.000đ' },
                      { id: 'forever', label: 'Vĩnh viễn - 199K', title: 'Gói Vĩnh Viễn', price: '199.000đ' }
                    ].map(plan => (
                      <button 
                        key={plan.id}
                        type="button" 
                        className={selectedPlan?.id === plan.id ? "primary" : "secondary"} 
                        style={{ 
                          flex: 1, 
                          padding: '8px 0', 
                          fontSize: 13, 
                          borderColor: 'var(--m-primary)', 
                          color: selectedPlan?.id === plan.id ? '#fff' : 'var(--m-primary)',
                          background: selectedPlan?.id === plan.id ? 'var(--m-primary)' : '#fff'
                        }} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedPlan(plan); 
                        }}
                      >
                        {plan.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1.5px solid var(--m-border)' }}>
          <button type="button" onClick={() => setActiveTab('info')} style={{ background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, color: activeTab === 'info' ? 'var(--m-primary)' : 'var(--m-dark)', borderBottom: activeTab === 'info' ? '2.5px solid var(--m-primary)' : '2.5px solid transparent', padding: '0 4px 12px', marginBottom: -1.5, cursor: 'pointer', transition: 'all .2s' }}>Thông tin xe</button>
          <button type="button" onClick={() => setActiveTab('calendar')} style={{ background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, color: activeTab === 'calendar' ? 'var(--m-primary)' : 'var(--m-dark)', borderBottom: activeTab === 'calendar' ? '2.5px solid var(--m-primary)' : '2.5px solid transparent', padding: '0 4px 12px', marginBottom: -1.5, cursor: 'pointer', transition: 'all .2s' }}>Lịch xe</button>
        </div>
        <div style={{ pointerEvents: disableForm ? 'none' : 'auto', opacity: disableForm ? 0.6 : 1 }}>
          <div style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
        {getFieldGroups(form, packageType).map((group) => (
          <ModuleFrame key={group.module} className="form-section">
            <div className="section-title">
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>
            <div className="fields-grid">
              {group.fields.map(([path, label, type, required, options, placeholder]) => {
                // Replace pickup location with the province+district picker
                if (path === 'rentalInfo.pickupLocation') {
                  return (
                    <Fragment key={path}>
                      <LocationPicker
                        label={label}
                        value={form.rentalInfo.pickupLocation}
                        required={required}
                        error={errors[path]}
                        onChange={(v) => setPathValue(path, v)}
                      />
                      <div style={{ marginTop: 16 }}>
                        <MapboxLocationPicker
                          label="Vị trí chính xác trên Bản đồ"
                          value={form.location || null}
                          onChange={(v) => setForm(prev => ({ ...prev, location: v }))}
                        />
                      </div>
                    </Fragment>
                  );
                }
                if (type === 'extra_options_group') {
                    const renderToggleNumber = (path, label) => {
                      const parts = path.split('.');
                      const isChecked = form[parts[0]]?.[parts[1]] != null && form[parts[0]]?.[parts[1]] !== "";
                      return (
                        <div key={path} style={{ flex: '1 1 180px', minWidth: 180 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)', marginBottom: 6, fontWeight: 600 }}>
                            <input type="checkbox" checked={isChecked} onChange={(e) => {
                              if (e.target.checked) setPathValue(path, 0);
                              else {
                                const clone = { ...form };
                                delete clone[parts[0]][parts[1]];
                                setPathValue(parts[0], clone[parts[0]]);
                              }
                            }} style={{ width: 16, height: 16, accentColor: 'var(--m-primary)' }} />
                            {label}
                          </label>
                          {isChecked && (
                            <input type="text" value={fmtNum(getAtPath(form, path)) ?? ""} onChange={e => {
                                const raw = e.target.value.replace(/\./g, '');
                                if (raw === '' || !isNaN(raw)) setPathValue(path, raw === '' ? '' : Number(raw));
                            }} style={{ width: '100%', height: 40, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none' }} />
                          )}
                        </div>
                      );
                    };

                    const renderBoolean = (path, label) => {
                      const parts = path.split('.');
                      const isChecked = !!form[parts[0]]?.[parts[1]];
                      return (
                        <div key={path} style={{ flex: '1 1 180px', minWidth: 180 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)', marginBottom: 6, fontWeight: 600 }}>
                            <input type="checkbox" checked={isChecked} onChange={(e) => setPathValue(path, e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--m-primary)' }} />
                            {label}
                          </label>
                        </div>
                      );
                    };

                    return (
                      <div key={path} style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, padding: '16px', background: '#f8fafc', borderRadius: 12 }}>
                        {renderBoolean('rentalInfo.driverIncluded', 'Có tài xế')}
                        {renderToggleNumber('rentalInfo.hourPrice', 'Giá thuê theo giờ')}
                        {renderToggleNumber('rentalInfo.monthPrice', 'Giá thuê theo tháng')}
                        {renderToggleNumber('rentalInfo.cleaningFee', 'Phí rửa xe')}
                      </div>
                    );
                  }
                  if (type === 'boolean') {
                    const parts = path.split('.');
                    const isChecked = !!form[parts[0]]?.[parts[1]];
                    return (
                      <div key={path}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)', marginBottom: 6, fontWeight: 600 }}>
                          <input type="checkbox" checked={isChecked} onChange={(e) => setPathValue(path, e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--m-primary)' }} />
                          {label}
                        </label>
                      </div>
                    );
                  }
                  if (type === 'toggle_number') {
                  const parts = path.split('.');
                  const isChecked = form[parts[0]]?.[parts[1]] != null;
                  return (
                    <div key={path}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)', marginBottom: 6, fontWeight: 600 }}>
                        <input type="checkbox" checked={isChecked} onChange={(e) => {
                          if (e.target.checked) setPathValue(path, 0);
                          else {
                            const clone = { ...form };
                            delete clone[parts[0]][parts[1]];
                            setPathValue(parts[0], clone[parts[0]]);
                          }
                        }} style={{ width: 16, height: 16, accentColor: 'var(--m-primary)' }} />
                        {label}
                      </label>
                      {isChecked && (
                         <input type="text" value={fmtNum(getAtPath(form, path)) ?? ""} onChange={e => {
                            const raw = e.target.value.replace(/\./g, '');
                            if (raw === '' || !isNaN(raw)) setPathValue(path, raw === '' ? '' : Number(raw));
                         }} style={{ width: '100%', height: 40, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--m-border)', fontSize: 14, outline: 'none' }} />
                      )}
                    </div>
                  );
                }
                return (
                  <Field
                    key={path}
                    path={path}
                    label={label}
                    type={type}
                    required={required}
                    options={options}
                    placeholder={placeholder}
                    value={getAtPath(form, path)}
                    error={errors[path]}
                    onChange={(value) => {
                      setPathValue(path, value);
                      if (path === 'technicalInfo.fuel' && value === 'Điện') {
                        setPathValue('technicalInfo.engine', 'Điện');
                        setPathValue('technicalInfo.fuelConsumption', '');
                      }
                    }}
                  />
                );
              })}
            </div>
          </ModuleFrame>
        ))}

        <ModuleFrame className="form-section">
          <div className="section-title">
            <h3>Mô tả & Tiện nghi</h3>
            <p>Mô tả xe và các tiện nghi khách muốn biết.</p>
          </div>
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--m-dark)', display: 'block', marginBottom: 8 }}>Mô tả xe</label>
          <textarea
            value={form.descriptions?.detail || ''}
            onChange={e => setPathValue('descriptions.detail', e.target.value)}
            placeholder="Mô tả chi tiết về xe..."
            style={{ width: '100%', minHeight: 100, padding: '10px 12px', border: '1.5px solid var(--m-border)', borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', marginBottom: 16 }}
          />
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--m-dark)', display: 'block', marginBottom: 8 }}>Tiện nghi</label>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: 'var(--m-primary)', fontWeight: 600, userSelect: 'none' }}>
              <input type="checkbox" checked={form.descriptions?.amenities?.length === AMENITY_OPTIONS.length} onChange={(e) => {
                if (e.target.checked) setPathValue('descriptions.amenities', [...AMENITY_OPTIONS]);
                else setPathValue('descriptions.amenities', []);
              }} style={{ width: 16, height: 16, accentColor: 'var(--m-primary)', cursor: 'pointer' }} />
              Chọn tất cả
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AMENITY_OPTIONS.map(opt => {
              const checked = Array.isArray(form.descriptions?.amenities) && form.descriptions.amenities.includes(opt);
              return (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: 'var(--m-dark)', userSelect: 'none' }}>
                  <input type="checkbox" checked={checked} onChange={() => {
                    const cur = Array.isArray(form.descriptions?.amenities) ? form.descriptions.amenities : [];
                    setPathValue('descriptions.amenities', checked ? cur.filter(x => x !== opt) : [...cur, opt]);
                  }} style={{ width: 16, height: 16, accentColor: 'var(--m-primary)', cursor: 'pointer' }} />
                  {opt}
                </label>
              );
            })}
          </div>
        </ModuleFrame>

        <ImageUploadOptimizer images={form.images} onChange={(images) => setPathValue("images", images)} />

          </div>
          <div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>
            {packageType === 'premium' && (
              <ModuleFrame className="form-section">
                <div className="section-title">
                  <h3>📅 Lịch xe</h3>
                  <p>Đánh dấu các ngày xe không cho thuê (đã đặt, bảo dưỡng, cá nhân...). Tính năng đặc quyền cho Gói Tối ưu.</p>
                </div>
                <BlockedDatesManager
                  blockedDates={form.rentalInfo?.blockedDates || []}
                  onChange={(dates) => setPathValue("rentalInfo.blockedDates", dates)}
                />
              </ModuleFrame>
            )}
          </div>
        </div>
        <ModuleFrame className="form-header" style={{ position: "sticky", bottom: 20, zIndex: 100, boxShadow: "0 -8px 30px rgba(0,0,0,0.12)" }}>
          <div>
            <h2>{editingCar ? "Chỉnh sửa thông tin xe" : "Thêm xe mới"}</h2>
            <p>Chọn gói đăng phù hợp với nhu cầu của bạn.</p>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary" onClick={onCancel}>Hủy</button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? <RefreshCcw className="spin" size={16} /> : <Save size={16} />}
              {saving ? "Đang lưu..." : "Lưu xe"}
            </button>
          </div>
        </ModuleFrame>
      </form>
      {selectedPlan && (
        <UpgradeModal plan={selectedPlan} car={form} onClose={() => setSelectedPlan(null)} />
      )}
      {showPremiumInfo && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowPremiumInfo(false)}>
          <section className="map-modal" style={{ maxWidth: 400, padding: 24, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>Lợi ích Gói Tối ưu</h2>
              <button className="modal-close inline-close" onClick={() => setShowPremiumInfo(false)} aria-label="Đóng" style={{ top: 'auto', right: 'auto', position: 'static' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.6, color: 'var(--m-dark)', fontSize: 15, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p>• Hiển thị đầy đủ thông số kỹ thuật (động cơ, truyền động...).</p>
              <p>• Thiết lập số KM giới hạn mỗi ngày và phí vượt KM.</p>
              <p>• Quản lý lịch xe: Đánh dấu ngày bận, ngày bảo dưỡng, khách đặt ngoài.</p>
              <p>• Huy hiệu Tích xanh "Xác minh": Tăng độ uy tín, thu hút khách hàng gấp 3 lần.</p>
            </div>
            <button className="primary" style={{ width: '100%', marginTop: 24 }} onClick={() => setShowPremiumInfo(false)}>Đã hiểu</button>
          </section>
        </div>
      )}
    </main>
  );
}

export { AddCarForm };

function DateTimePickerModal({ initialStart, initialEnd, initialStartTime, initialEndTime, onClose, onApply }) {
  const [baseDate, setBaseDate] = useState(() => {
    const d = initialStart || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [startTime, setStartTime] = useState(initialStartTime || '21:00');
  const [endTime, setEndTime] = useState(initialEndTime || '20:00');
  const [hoverDate, setHoverDate] = useState(null);

  const leftYear = baseDate.getFullYear();
  const leftMonth = baseDate.getMonth();
  
  const rightDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = rightDate.getFullYear();
  const rightMonth = rightDate.getMonth();

  const handleNextMonth = () => setBaseDate(new Date(leftYear, leftMonth + 1, 1));
  const handlePrevMonth = () => {
    const today = new Date();
    if (leftYear > today.getFullYear() || (leftYear === today.getFullYear() && leftMonth > today.getMonth())) {
      setBaseDate(new Date(leftYear, leftMonth - 1, 1));
    }
  };

  const handleDayClick = (y, m, d) => {
    const clicked = new Date(y, m, d);
    if (!start || (start && end)) {
      setStart(clicked); setEnd(null);
    } else {
      if (clicked.getTime() < start.getTime()) { setStart(clicked); setEnd(null); }
      else setEnd(clicked);
    }
  };

  const duration = (start && end) ? Math.round((end - start) / 86400000) : 0;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="dt-modal" onClick={e => e.stopPropagation()}>
        <div className="dt-header">
          <h2>Chọn ngày thuê</h2>
          <button className="dt-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="dt-body">
          <div className="dt-calendars">
            {renderCalendarMonth({ year: leftYear, month: leftMonth, label: 'left', start, end, hoverDate, selectMode: 'range', onDayClick: handleDayClick, onDayHover: d => { if (start && !end) setHoverDate(d); else setHoverDate(null); }, onPrev: handlePrevMonth, onNext: null })}
            {renderCalendarMonth({ year: rightYear, month: rightMonth, label: 'right', start, end, hoverDate, selectMode: 'range', onDayClick: handleDayClick, onDayHover: d => { if (start && !end) setHoverDate(d); else setHoverDate(null); }, onPrev: null, onNext: handleNextMonth })}
          </div>
          {(() => {
            const timeOptions = [];
            for(let i=0; i<24; i++) {
              timeOptions.push(`${i.toString().padStart(2, '0')}:00`);
              timeOptions.push(`${i.toString().padStart(2, '0')}:30`);
            }
            return (
              <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'nowrap' }}>
                <div style={{ flex: 1, border: '1px solid var(--m-border)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--m-subtle)', fontWeight: 600, marginBottom: 4 }}>Nhận xe</div>
                  <div style={{ position: 'relative' }}>
                    <select value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, color: 'var(--m-dark)', appearance: 'none', background: 'transparent', cursor: 'pointer' }}>
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--m-mid)' }} />
                  </div>
                </div>
                
                <ArrowRight size={20} style={{ color: 'var(--m-subtle)', flexShrink: 0 }} />

                <div style={{ flex: 1, border: '1px solid var(--m-border)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--m-subtle)', fontWeight: 600, marginBottom: 4 }}>Trả xe</div>
                  <div style={{ position: 'relative' }}>
                    <select value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, color: 'var(--m-dark)', appearance: 'none', background: 'transparent', cursor: 'pointer' }}>
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--m-mid)' }} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="dt-footer">
          <div className="dt-summary">
            <div className="dt-summary-text">
              {start ? `${startTime} ${formatShortDate(start)}` : 'Chọn ngày bắt đầu'} {end ? `→ ${endTime} ${formatShortDate(end)}` : ''}
            </div>
            <div className="dt-summary-duration">
              {duration > 0 ? <><span>{duration} ngày</span> thuê xe</> : 'Chọn ngày nhận và trả xe'}
            </div>
          </div>
          <button className="primary" disabled={!start || !end} onClick={() => onApply({ startDate: start, endDate: end, startTime, endTime })}>Áp dụng</button>
        </div>
      </div>
    </div>
  );
}

export { DateTimePickerModal };

function BlockedDatesManager({ blockedDates = [], onChange }) {
  const [baseDate, setBaseDate] = useState(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [pickStart, setPickStart] = useState(null);   // string YYYY-MM-DD
  const [hoverKey, setHoverKey] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editTag, setEditTag] = useState('busy');
  const [editStartTime, setEditStartTime] = useState('00:00');
  const [editEndTime, setEditEndTime] = useState('23:59');
  const [popover, setPopover] = useState(null); // { idx, key }

  // Normalize legacy string[] → range[]
  const ranges = (() => {
    if (!blockedDates.length) return [];
    if (typeof blockedDates[0] === 'object' && blockedDates[0].start) return blockedDates;
    // convert old individual dates to single-day ranges
    return blockedDates.map(d => {
      const s = typeof d === 'string' ? d : d.date;
      return { start: s, end: s, note: typeof d === 'object' ? d.note : '' };
    });
  })();

  // Build a map: dateKey → range index
  const dateToRange = {};
  ranges.forEach((r, idx) => {
    let cur = new Date(r.start + 'T00:00:00');
    const last = new Date(r.end + 'T00:00:00');
    while (cur <= last) {
      dateToRange[toLocalKey(cur)] = idx;
      cur.setDate(cur.getDate() + 1);
    }
  });

  const blockedSet = new Set(Object.keys(dateToRange));

  const leftYear = baseDate.getFullYear();
  const leftMonth = baseDate.getMonth();
  const rightDate = new Date(leftYear, leftMonth + 1, 1);

  // Determine which keys would be in the prospective hover range
  const hoverBlockedSet = new Set();
  if (pickStart && hoverKey && hoverKey >= pickStart) {
    let c = new Date(pickStart + 'T00:00:00');
    const last = new Date(hoverKey + 'T00:00:00');
    while (c <= last) { hoverBlockedSet.add(toLocalKey(c)); c.setDate(c.getDate()+1); }
  }

  const handleDayClick = (y, m, d, key) => {
    if (blockedSet.has(key)) {
      // Show popover for this range
      const idx = dateToRange[key];
      setPopover({ idx, key });
      return;
    }
    if (!pickStart) {
      setPickStart(key);
    } else {
      if (key < pickStart) { setPickStart(key); return; }
      const newRange = { start: pickStart, end: key, note: '', tag: 'busy', startTime: '00:00', endTime: '23:59' };
      const newRanges = [...ranges, newRange];
      onChange(newRanges);
      setPickStart(null);
      setHoverKey(null);
      // Open note editor for the new range
      setEditingIdx(newRanges.length - 1);
      setEditNote('');
    }
  };

  const deleteRange = (idx) => {
    const next = ranges.filter((_, i) => i !== idx);
    onChange(next);
    setPopover(null);
  };

  const startEditNote = (idx) => {
    setEditingIdx(idx);
    setEditNote(ranges[idx].note || '');
    setEditTag(ranges[idx].tag || 'busy');
    setEditStartTime(ranges[idx].startTime || '00:00');
    setEditEndTime(ranges[idx].endTime || '23:59');
    setPopover(null);
  };

  const saveNote = () => {
    const next = ranges.map((r, i) => i === editingIdx ? { ...r, note: editNote, tag: editTag, startTime: editStartTime, endTime: editEndTime } : r);
    onChange(next);
    setEditingIdx(null);
  };

  const handleNextMonth = () => setBaseDate(new Date(leftYear, leftMonth + 1, 1));
  const handlePrevMonth = () => {
    const now = new Date();
    if (leftYear > now.getFullYear() || (leftYear === now.getFullYear() && leftMonth > now.getMonth()))
      setBaseDate(new Date(leftYear, leftMonth - 1, 1));
  };

  const totalDays = ranges.reduce((acc, r) => {
    const diff = Math.round((new Date(r.end + 'T00:00:00') - new Date(r.start + 'T00:00:00')) / 86400000) + 1;
    return acc + diff;
  }, 0);

  return (
    <div onClick={() => setPopover(null)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {pickStart ? (
          <span style={{ fontSize: 13, color: 'var(--m-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} /> Đã chọn từ <strong>{fmtRangeDate(pickStart)}</strong> — bấm ngày kết thúc hoặc
            <button type="button" onClick={() => setPickStart(null)} style={{ fontSize: 12, color: 'var(--m-red)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>hủy</button>
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--m-mid)' }}>Bấm ngày bắt đầu → ngày kết thúc để chặn. <strong style={{ color: 'var(--m-dark)' }}>{ranges.length} đợt • {totalDays} ngày bận.</strong></span>
        )}
        {ranges.length > 0 && !pickStart && <button type="button" onClick={() => { onChange([]); }} style={{ fontSize: 12, color: 'var(--m-red)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Xóa tất cả</button>}
      </div>

      <div className="dt-calendars" style={{ border: '1px solid var(--m-border)', borderRadius: 8, padding: 16 }}>
        {renderCalendarMonth({ year: leftYear, month: leftMonth, label: 'left', blockedSet, hoverBlockedSet, dateToRange, ranges, pickStart, popover, onDayClick: handleDayClick, onDayHover: k => setHoverKey(k), onPopover: (idx, key, e) => { e.stopPropagation(); setPopover({ idx, key }); }, onPrev: handlePrevMonth, onNext: null, selectMode: 'blocked' })}
        {renderCalendarMonth({ year: rightDate.getFullYear(), month: rightDate.getMonth(), label: 'right', blockedSet, hoverBlockedSet, dateToRange, ranges, pickStart, popover, onDayClick: handleDayClick, onDayHover: k => setHoverKey(k), onPopover: (idx, key, e) => { e.stopPropagation(); setPopover({ idx, key }); }, onPrev: null, onNext: handleNextMonth, selectMode: 'blocked' })}
      </div>

      {/* Popover action bar (floating) */}
      {popover && (
        <div style={{ marginTop: 12, background: '#fff', border: '1.5px solid var(--m-border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} onClick={e => e.stopPropagation()}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-dark)' }}>
              {fmtRangeLabel(ranges[popover.idx] || {})}
            </div>
            <div style={{ fontSize: 12, color: 'var(--m-mid)', marginTop: 2 }}>
              <span style={{ color: ranges[popover.idx]?.tag === 'rented' ? '#3b82f6' : '#dc2626', fontWeight: 600, marginRight: 4 }}>
                [{ranges[popover.idx]?.tag === 'rented' ? 'Khách thuê' : 'Lịch bận'}]
              </span>
              {ranges[popover.idx]?.note}
            </div>
          </div>
          <button type="button" onClick={() => startEditNote(popover.idx)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid var(--m-border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--m-dark)', fontWeight: 500 }}>
            <Edit3 size={13} /> Ghi chú
          </button>
          <button type="button" onClick={() => deleteRange(popover.idx)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', cursor: 'pointer', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
            <Trash2 size={13} /> Xóa đợt
          </button>
        </div>
      )}

      {/* Note editor modal */}
      {editingIdx !== null && (() => {
        const timeOptions = [];
        for(let i=0; i<24; i++) {
          timeOptions.push(`${i.toString().padStart(2, '0')}:00`);
          timeOptions.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: 'var(--m-dark)' }}>Chi tiết lịch bận</h3>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--m-subtle)', fontWeight: 600, marginBottom: 6 }}>Nhận xe</div>
                <div style={{ position: 'relative', border: '1px solid var(--m-border)', borderRadius: 10, padding: '8px 12px' }}>
                  <select value={editStartTime} onChange={e => setEditStartTime(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, color: 'var(--m-dark)', appearance: 'none', background: 'transparent', cursor: 'pointer' }}>
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--m-mid)' }} />
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--m-mid)', marginTop: 20 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--m-subtle)', fontWeight: 600, marginBottom: 6 }}>Trả xe</div>
                <div style={{ position: 'relative', border: '1px solid var(--m-border)', borderRadius: 10, padding: '8px 12px' }}>
                  <select value={editEndTime} onChange={e => setEditEndTime(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, color: 'var(--m-dark)', appearance: 'none', background: 'transparent', cursor: 'pointer' }}>
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--m-mid)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--m-subtle)', fontWeight: 600, marginBottom: 6 }}>Loại lịch</div>
                <select value={editTag} onChange={e => setEditTag(e.target.value)} style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid var(--m-border)', fontSize: 15, outline: 'none', background: 'var(--m-bg)', fontWeight: 500, cursor: 'pointer' }}>
                  <option value="busy">Lịch bận</option>
                  <option value="rented">Khách thuê</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--m-subtle)', fontWeight: 600, marginBottom: 6 }}>Ghi chú</div>
                <input autoFocus type="text" value={editNote} onChange={e => setEditNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNote(); if (e.key === 'Escape') setEditingIdx(null); }}
                  placeholder="Vd: Khách đặt, Bảo dưỡng..."
                  style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid var(--m-border)', fontSize: 15, outline: 'none', background: 'var(--m-bg)', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, color: 'var(--m-dark)', fontWeight: 500, textAlign: 'center' }}>
              {fmtRangeLabel({ ...ranges[editingIdx], startTime: editStartTime, endTime: editEndTime })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
               <button type="button" onClick={() => setEditingIdx(null)} style={{ flex: 1, padding: '10px 0', background: 'transparent', color: 'var(--m-mid)', border: '1px solid var(--m-border)', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Hủy</button>
               <button type="button" onClick={saveNote} style={{ flex: 1, padding: '10px 0', background: 'var(--m-primary)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Lưu lịch</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Range list summary */}
      {ranges.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ranges.map((r, idx) => {
            const isRented = r.tag === 'rented';
            const bg = isRented ? '#eff6ff' : '#fef2f2';
            const border = isRented ? '#bfdbfe' : '#fca5a5';
            const color = isRented ? '#2563eb' : '#dc2626';
            return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: bg, borderRadius: 10, border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: color, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}></span>
                  {fmtRangeLabel(r)}
                </div>
                <div style={{ fontSize: 13, color: color, opacity: 0.85, marginLeft: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.note || <em style={{ opacity: 0.6 }}>Chưa có ghi chú</em>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                <button type="button" onClick={() => startEditNote(idx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, color: color, cursor: 'pointer' }} title="Sửa ghi chú"><Edit3 size={15} /></button>
                <button type="button" onClick={() => deleteRange(idx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, color: '#dc2626', cursor: 'pointer' }} title="Xóa lịch này"><Trash2 size={15} /></button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, color: 'var(--m-mid)' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(59,130,246,0.82)', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Khách thuê</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(220,38,38,0.82)', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Lịch bận</span>
      </div>
    </div>
  );
}

export { BlockedDatesManager };

