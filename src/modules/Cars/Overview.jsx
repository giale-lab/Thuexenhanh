import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, ADMIN_EMAILS, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';
import { SearchLocationPicker, LocationPicker, handleOpenMap } from '../Shared/Location.jsx';
import { SkeletonCard, ModuleFrame, Toggle, FilterCheckboxGroup, FilterToggle, FilterSelect, Stat } from '../Shared/UIKit.jsx';
import { CarCard } from './CarCard.jsx';
import { CarDetailModal } from './CarDetail.jsx';
import { DateTimePickerModal } from './CarForm.jsx';

function Overview({ cars, loadMoreCars, hasMoreCars, adminMode, currentUser, showFavorites, onEdit, onDelete, onDuplicate, onStatus, onToggleFavorite, onRequestLocation }) {
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

            {adminMode && <FilterSelect label="địa điểm" value={filters.location} options={locationOptions} onChange={(location) => setFilters({ ...filters, location })} />}
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
