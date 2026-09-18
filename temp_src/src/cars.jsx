import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from "./firebase";
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import "./styles.css";

import * as Core from './core.js';
import * as Shared from './shared.jsx';
import * as Auth from './auth.jsx';
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
const { LoginScreen } = Auth;
const { AccountSettingsScreen } = Auth;
const { QuyCheModal } = Auth;
const { TopUpModal } = Auth;
const { OwnerWizard } = Auth;
const { SetLocationPopup } = Auth;
const { UpgradeModal } = Auth;
const { FaqModal } = Auth;
const { CommunityModal } = Auth;
const { DataProtectionPolicy } = Auth;

function Overview({ cars, adminMode, currentUser, showFavorites, onEdit, onDelete, onDuplicate, onStatus, onToggleFavorite, onRequestLocation }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const path = window.location.pathname.substring(1);
    if (path && path.length > 0) {
      setQuery(decodeURIComponent(path));
      window.history.replaceState(null, '', '/');
    }
  }, []);
  const [selectedCar, setSelectedCar] = useState(null);
  const [verifiedOwnerIds, setVerifiedOwnerIds] = useState(new Set());

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const ids = new Set();
      snap.forEach(d => { if (d.data().emailVerified) ids.add(d.id); });
      setVerifiedOwnerIds(ids);
    }, (err) => console.warn("Lỗi đọc users (Overview):", err.message));
    return () => unsub();
  }, []);
  const [viewMode, setViewMode] = useState("grid");
  const filterTouchStartY = useRef(0);
  const likedCars = currentUser?.favorites || [];
  
  const [filters, setFilters] = useState({
    brand: "",
    seats: "",
    vehicleType: [],
    transmission: "",
    fuel: "",
    status: "",
    location: "",
    maxPrice: "",
    driver: "",
    freeCharge: "",
    owner: null
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.filter === "owner") {
        // user navigated forward to this state? (rare)
      } else if (filtersRef.current.owner) {
        // user navigated back from the owner filter state
        setFilters(f => ({ ...f, owner: null }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState("newest");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [rentalTimeRange, setRentalTimeRange] = useState({
    startDate: null,
    endDate: null
  });

  const isWeekend = useMemo(() => isWeekendRange(rentalTimeRange?.startDate, rentalTimeRange?.endDate), [rentalTimeRange]);
  window.currentIsWeekend = isWeekend;

  const smartFilters = useMemo(() => inferSmartFilters(query), [query]);
  const mergedFilters = { ...filters, ...smartFilters };
  const chips = activeChips(mergedFilters, query);

  const filteredCars = useMemo(() => {
    const normalizedQuery = normalize(query);
    return cars
      .filter((car) => {
        if (showFavorites && !likedCars.includes(car.id)) return false;
        const isAdminAccount = ADMIN_EMAILS.includes(currentUser?.email);
        if (adminMode && !isAdminAccount && car.ownerId !== currentUser.uid) return false;
        if (filters.owner && car.ownerId !== filters.owner.id) return false;
        
        const haystack = normalize([
          car.basicInfo.name,
          car.basicInfo.brand,
          car.basicInfo.model,
          car.basicInfo.vehicleType,
          car.basicInfo.plate,
          car.basicInfo.exteriorColor,
          car.technicalInfo.fuel,
          car.technicalInfo.transmission,
          car.rentalInfo.pickupLocation,
          car.rentalInfo.rentalType,
          car.descriptions.short
        ].join(" "));
        const queryMatch = !normalizedQuery || normalizedQuery.split(" ").every((term) => haystack.includes(term) || ["xe", "oto", "o", "to"].includes(term));
        const priceMatch = !mergedFilters.maxPrice || Number(isWeekend && car.rentalInfo.weekendPrice ? car.rentalInfo.weekendPrice : car.rentalInfo.dayPrice) <= Number(mergedFilters.maxPrice);
        const brandMatch = !mergedFilters.brand || car.basicInfo.brand === mergedFilters.brand;
        const seatsMatch = !mergedFilters.seats || Number(car.basicInfo.seats) === Number(mergedFilters.seats);
        const typeMatch = !mergedFilters.vehicleType || (Array.isArray(mergedFilters.vehicleType) ? (mergedFilters.vehicleType.length === 0 || mergedFilters.vehicleType.includes(car.basicInfo.vehicleType)) : car.basicInfo.vehicleType === mergedFilters.vehicleType);
        const transmissionMatch = !mergedFilters.transmission || car.technicalInfo.transmission === mergedFilters.transmission;
        const fuelMatch = (() => {
          if (!mergedFilters.fuel) return true;
          if (mergedFilters.fuel === 'Điện') return car.technicalInfo.fuel === 'Điện';
          if (mergedFilters.fuel === 'Cơ') return car.technicalInfo.fuel !== 'Điện';
          return car.technicalInfo.fuel === mergedFilters.fuel;
        })();
        const normalizedCarStatus = car.rentalInfo.status === 'available' ? 'available' : 'busy';
        const statusMatch = !mergedFilters.status || normalizedCarStatus === mergedFilters.status;
        const locationMatch = !mergedFilters.location || normalize(car.rentalInfo.pickupLocation).includes(normalize(mergedFilters.location));
        const driverMatch = !mergedFilters.driver || String(car.rentalInfo.driverIncluded) === mergedFilters.driver;
        const freeChargeMatch = !mergedFilters.freeCharge || mergedFilters.freeCharge !== 'true' || car.rentalInfo?.freeCharge || !car.rentalInfo?.chargeFee;
        const dateMatch = (() => {
          if (!rentalTimeRange.startDate || !rentalTimeRange.endDate) return true;
          if (car.rentalInfo.status !== 'available') return false;
          const blocked = car.rentalInfo.blockedDates || [];
          const cur = new Date(rentalTimeRange.startDate);
          const end = new Date(rentalTimeRange.endDate);
          while (cur <= end) {
            const key = cur.toISOString().slice(0, 10);
            if (blocked.includes(key)) return false;
            cur.setDate(cur.getDate() + 1);
          }
          return true;
        })();
        return queryMatch && priceMatch && brandMatch && seatsMatch && typeMatch && transmissionMatch && fuelMatch && statusMatch && locationMatch && driverMatch && freeChargeMatch && dateMatch;
      })
      .sort((a, b) => {
        if (sort === 'nearby') {
          const loc = normalize(currentUser?.location || "");
          if (!loc) return sorters.newest(a, b);
          const aNear = normalize(a.rentalInfo.pickupLocation || "").includes(loc) ? 1 : 0;
          const bNear = normalize(b.rentalInfo.pickupLocation || "").includes(loc) ? 1 : 0;
          return getCarWeight(b) - getCarWeight(a) || bNear - aNear || (a.rentalInfo.weekendPrice && window.currentIsWeekend ? a.rentalInfo.weekendPrice : a.rentalInfo.dayPrice) - (b.rentalInfo.weekendPrice && window.currentIsWeekend ? b.rentalInfo.weekendPrice : b.rentalInfo.dayPrice);
        }
        return sorters[sort] ? sorters[sort](a, b) : sorters.newest(a, b);
      });
  }, [cars, query, mergedFilters, sort, showFavorites, likedCars, adminMode, currentUser]);

  return (
    <main className="content" style={{ paddingBottom: 80 }}>
      {/* Filter Panel */}
      {expanded && <div style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)', transition: 'opacity 0.2s' }} onClick={() => setExpanded(false)} />}
      <div className="filter-panel-sticky" 
           onTouchStart={(e) => { filterTouchStartY.current = e.touches[0].clientY; }} 
           onTouchEnd={(e) => { if (e.changedTouches[0].clientY - filterTouchStartY.current > 40) setExpanded(false); }} 
           style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'var(--m-bg)', padding: '12px 16px max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid var(--m-border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', touchAction: expanded ? 'none' : 'auto', overscrollBehavior: 'none' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 800, margin: '0 auto', width: '100%' }}>
           <div style={{ flex: 1, background: '#fff', border: '1px solid var(--m-border)', borderRadius: 24, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} onClick={() => setExpanded(!expanded)}>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-dark)' }}>{filters.location || "Tất cả địa điểm"}</span>
                <span style={{ fontSize: 13, color: 'var(--m-subtle)', marginTop: 2 }}>
                  {rentalTimeRange.startDate ? `${formatCompactDateTime(rentalTimeRange.startDate, rentalTimeRange.startTime)} • ${formatCompactDateTime(rentalTimeRange.endDate, rentalTimeRange.endTime)}` : "Thêm ngày, giờ"}
                </span>
             </div>
             <ChevronDown size={18} style={{ color: 'var(--m-dark)', transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
           </div>
           <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
             <button className="icon-button" style={{ background: '#fff', border: '1px solid var(--m-border)', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUpDown size={18}/></button>
             <select value={sort} onChange={(e) => { const val = e.target.value; if (val === 'nearby' && (!currentUser?.location?.province && !currentUser?.location?.district)) { if (onRequestLocation) onRequestLocation(); setSort('newest'); return; } setSort(val); }} aria-label="Sắp xếp" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', appearance: 'none' }}>
               <option value="newest">Sắp xếp (Mặc định)</option>
               <option value="priceAsc">Giá thấp → cao</option>
               <option value="priceDesc">Giá cao → thấp</option>
               <option value="yearDesc">Năm sản xuất</option>
               <option value="popular">Yêu thích</option>
               <option value="nearby">Gần bạn</option>
             </select>
           </div>
           <button type="button" className="icon-button hide-on-mobile" title={viewMode === 'grid' ? "Chuyển sang Danh sách" : "Chuyển sang Lưới"} onClick={(e) => { e.preventDefault(); setViewMode(viewMode === 'grid' ? 'list' : 'grid'); }} style={{ background: '#fff', border: '1px solid var(--m-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--m-dark)', cursor: 'pointer', flexShrink: 0 }}>
             {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
           </button>
        </div>

        {expanded && (
          <div className="filter-grid" style={{ maxWidth: 800, margin: '16px auto 0', padding: '16px 0 0', borderTop: '1px solid var(--m-border)' }}>
            <div style={{ gridColumn: '1 / -1', marginBottom: 16 }}>
              <div className="search-box" style={{ width: '100%', background: '#fff', borderRadius: 12 }}>
                <Search size={18} />
                <input
                  id="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm: Toyota 7 chỗ, SUV còn trống..."
                  style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                />
              </div>
            </div>
        
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 100%', display: 'flex', gap: 12 }}>
                {!adminMode && <SearchLocationPicker value={filters.location} onChange={(val) => setFilters({ ...filters, location: val })} />}
              </div>
              <div 
                 className="search-box" 
                 style={{ flex: '1 1 100%', cursor: 'pointer', background: '#fff', borderRadius: 12 }} 
                 onClick={() => setIsTimePickerOpen(true)}
              >
                <CalendarDays size={18} />
                <div style={{ flex: 1, padding: '4px 0', fontSize: 14, fontWeight: 500, color: rentalTimeRange.startDate ? 'var(--m-dark)' : 'var(--m-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rentalTimeRange.startDate && rentalTimeRange.endDate
                    ? `${formatShortDate(rentalTimeRange.startDate)} → ${formatShortDate(rentalTimeRange.endDate)}`
                    : "Chọn ngày thuê"}
                </div>
                {rentalTimeRange.startDate && (
                  <button onClick={(e) => { e.stopPropagation(); setRentalTimeRange({ startDate: null, endDate: null }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--m-mid)', padding: 0, display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', gridColumn: '1 / -1', marginBottom: 8, paddingBottom: 16, borderBottom: '1px solid var(--m-border)' }}>
              <FilterToggle label="⚡ Xe điện" checked={mergedFilters.fuel === 'Điện'} onChange={(c) => setFilters({ ...filters, fuel: c ? 'Điện' : '', freeCharge: c ? filters.freeCharge : '' })} />
              {mergedFilters.fuel === 'Điện' && (
                <FilterToggle label="🔋 Free sạc" checked={mergedFilters.freeCharge === 'true'} onChange={(c) => setFilters({ ...filters, freeCharge: c ? 'true' : '' })} />
              )}
              <FilterToggle label="👱 Có tài xế" checked={mergedFilters.driver === 'true'} onChange={(c) => setFilters({ ...filters, driver: c ? 'true' : '' })} />
            </div>
            <FilterSelect label="Hãng xe" value={filters.brand} options={brandOptions} onChange={(brand) => setFilters({ ...filters, brand })} />
            <FilterSelect label="Số chỗ" value={filters.seats} options={seatOptions} onChange={(seats) => setFilters({ ...filters, seats })} />
            <FilterCheckboxGroup label="Loại xe" values={filters.vehicleType} options={["Sedan", "SUV", "MPV", "Hatchback", "Pickup", "Minivan"]} onChange={(vehicleType) => setFilters({ ...filters, vehicleType })} />
            
            
            {adminMode && <FilterSelect label="Địa điểm" value={filters.location} options={locationOptions} onChange={(location) => setFilters({ ...filters, location })} />}
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--m-dark)' }}>Giá tối đa/ngày</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--m-primary)' }}>
                  {filters.maxPrice ? `${parseInt(filters.maxPrice).toLocaleString('vi-VN')} đ` : 'Không giới hạn'}
                </span>
              </div>
              <input type="range" min="500000" max="5000000" step="100000" value={filters.maxPrice || 5000000} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value === "5000000" ? "" : e.target.value })} style={{ width: '100%', accentColor: 'var(--m-primary)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--m-subtle)', marginTop: 4 }}>
                <span>500K</span>
                <span>5Tr+</span>
              </div>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--m-dark)', marginBottom: 8, display: 'block' }}>Sắp xếp</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <select id="sort-select" value={sort} onChange={(e) => { const val = e.target.value; if (val === 'nearby' && (!currentUser?.location?.province && !currentUser?.location?.district)) { 
                  if (onRequestLocation) onRequestLocation();
                  setSort('newest'); return; 
                } setSort(val); }} aria-label="Sắp xếp" style={{ height: 42, padding: "0 28px 0 12px", borderRadius: "var(--r-md)", border: "1.5px solid var(--m-border)", background: "var(--m-bg)", fontSize: 14, fontWeight: 600, color: "var(--m-dark)", outline: "none", cursor: "pointer", flex: 1 }}>
                  <option value="newest">Mặc định</option>
                  <option value="priceAsc">Giá thấp → cao</option>
                  <option value="priceDesc">Giá cao → thấp</option>
                  <option value="yearDesc">Năm sản xuất</option>
                  <option value="popular">Yêu thích</option>
                  <option value="nearby">Gần bạn</option>
                </select>

              </div>
            </label>
          </div>
        )}

        {chips.length > 0 && (
          <div className="chip-row" style={{ maxWidth: 800, margin: '12px auto 0', width: '100%', justifyContent: 'center' }}>
            {chips.map((chip) => (
              <span className="chip" key={chip.key}>
                {chip.label}
                <button onClick={() => chip.key === "query" ? setQuery("") : setFilters({ ...filters, [chip.key]: Array.isArray(filters[chip.key]) ? [] : "" })} aria-label={`Xóa ${chip.label}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <button className="clear-link" onClick={() => { setQuery(""); setFilters({ brand: "", seats: "", vehicleType: [], transmission: "", fuel: "", status: "", location: "", maxPrice: "", driver: "" }); }}>
              Xóa tất cả
            </button>
          </div>
        )}
        
      </div>

      {/* Car Grid */}
      <ModuleFrame className={viewMode === "grid" ? "car-grid" : "car-list"}>
        {cars.length === 0 && !filteredCars.length ? (
          // Skeleton loading — show while waiting for Firestore
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          filteredCars.map((car, index) => (
            <React.Fragment key={car.id}>
              <CarCard car={car} isWeekend={isWeekend} rentalTimeRange={rentalTimeRange} currentUser={currentUser} adminMode={adminMode}
                ownerEmailVerified={verifiedOwnerIds.has(car.ownerId)}
                liked={likedCars.includes(car.id)}
                likeCount={(car.status?.popularity || 0) || 0}
                onToggleLike={() => onToggleFavorite(car.id)}
                onView={setSelectedCar} onMap={handleOpenMap} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onStatus={onStatus} />
              
              {/* Banner Quảng Cáo sau mỗi 10 xe */}
              {(index + 1) % 10 === 0 && (
                <div key={`ad-${index}`} style={{ gridColumn: '1 / -1', marginTop: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--m-border)' }} onClick={() => window.open('https://vnigo.sbs', '_blank')}>
                  <img src={`https://via.placeholder.com/1200x200/1e3a8a/ffffff?text=Vnigo+Ads+-+Hi%E1%BB%83n+Th%E1%BB%8B+Qu%E1%BA%A3ng+C%C3%A1o+S%E1%BB%91+${Math.floor((index + 1)/10)}`} alt="Quảng cáo" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
            </React.Fragment>
          ))
        )}
        {cars.length > 0 && filteredCars.length === 0 && (
          <div className="empty-state">
            <Search size={40} strokeWidth={1.5} />
            <h2>Không tìm thấy xe phù hợp</h2>
            <p>Hãy thử thay đổi bộ lọc hoặc giảm điều kiện tìm kiếm.</p>
          </div>
        )}
      </ModuleFrame>

{selectedCar && <CarDetailModal car={selectedCar} isWeekend={isWeekend} rentalTimeRange={rentalTimeRange} adminMode={adminMode} currentUser={currentUser} onMap={handleOpenMap} onClose={() => setSelectedCar(null)} onEdit={(id) => { setSelectedCar(null); onEdit(id); }} ownerCarCount={cars.filter(c => c.ownerId === selectedCar.ownerId).length} onViewOwner={() => { window.history.pushState({ filter: "owner" }, ""); setFilters(f => ({ ...f, owner: { id: selectedCar.ownerId, name: getOwnerInfo(selectedCar).name } })); setSelectedCar(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
      {isTimePickerOpen && (
        <DateTimePickerModal
          initialStart={rentalTimeRange.startDate}
          initialEnd={rentalTimeRange.endDate}
          initialStartTime={rentalTimeRange.startTime}
          initialEndTime={rentalTimeRange.endTime}
          onClose={() => setIsTimePickerOpen(false)}
          onApply={(range) => {
            setRentalTimeRange(range);
            setIsTimePickerOpen(false);
          }}
        />
      )}
    </main>
  );
}

export { Overview };

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
    if ((currentUser?.credits || 0) < 20) {
      window.showAlert("Không đủ điểm (Cần 20 điểm) để đẩy tin. Vui lòng nạp thêm trong phần Tài khoản.");
      return;
    }
    window.showConfirm("Xác nhận dùng 20 Điểm để đẩy xe lên đầu trong 24 giờ?", async () => {
      try {
        const newCredits = (currentUser.credits || 0) - 20;
        await updateDoc(doc(db, "users", currentUser.uid), { credits: newCredits });
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
    msg += `\n(Thuexenhanh)`;
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
        <ImageSlider images={car.images} alt={`${car.basicInfo.brand} ${car.basicInfo.model}`} />
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
                  if (window.deductCredits) {
                    window.deductCredits(5, car.ownerId, car.id, () => setContactStep(1));
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
    msg += `\n(Thuexenhanh)`;
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
              <img src={car.ownerInfo?.avatar || GuestAvatar} onError={(e) => { if (!e.target.src.includes('guest-avatar')) e.target.src = GuestAvatar; }} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
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
                    if (window.deductCredits) {
                      window.deductCredits(5, car.ownerId, car.id, () => setContactStep(1));
                    } else {
                      setContactStep(1);
                    }
                  }); 
                }}>Xem SĐT liên hệ (5 Điểm)</button>
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
                      <img src={comment.userAvatar || GuestAvatar} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
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
                        <img src={currentUser?.avatar || GuestAvatar} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                        <input type="text" className="search-box" style={{ flex: 1, padding: '4px 12px', fontSize: 13, height: 32 }} placeholder="Viết phản hồi..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReply(comment.id); }} autoFocus />
                        <button className="primary" style={{ padding: '0 12px', height: 32 }} onClick={() => handleSubmitReply(comment.id)}><Send size={14} /></button>
                      </div>
                    )}

                    {(comment.replies || []).length > 0 && (
                      <div style={{ marginLeft: 32, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {comment.replies.map(reply => (
                          <div key={reply.id} style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 14px', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <img src={reply.userAvatar || GuestAvatar} alt="Avatar" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
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

function AddCarForm({ editingCar, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState(() => editingCar ? normalizeCarForm(editingCar) : clone(emptyForm));
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
    setForm(editingCar ? normalizeCarForm(editingCar) : clone(emptyForm));
    setPackageType("premium");
    setErrors({});
  }, [editingCar]);

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
                    <LocationPicker
                      key={path}
                      label={label}
                      value={form.rentalInfo.pickupLocation}
                      required={required}
                      error={errors[path]}
                      onChange={(v) => setPathValue(path, v)}
                    />
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

