import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import * as LucideIcons from 'lucide-react';
const { Sparkles, Loader, Download, Info, BadgeCheck, CalendarDays, Car, Check, ChevronDown, Copy, Edit3, Eye, Filter, Gauge, ImagePlus, LayoutGrid, List, MapPin, RefreshCcw, Save, Search, ShieldCheck, Star, Trash2, Upload, UserRoundCog, X, HelpCircle, ChevronLeft, ChevronRight, LogOut, Heart, MessageSquare, Zap, Settings, Users, User, Shield, Bell, TrendingUp, Package, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown, Reply, Send, AlertTriangle, ShieldAlert, Share2, Link2, Phone, Flag, ArrowRight, SlidersHorizontal, ArrowUpDown, ArrowUpCircle } = LucideIcons;

import imageCompression from "browser-image-compression";
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from '../../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";
import '../../styles.css';

import { isWeekendRange, STORAGE_KEY, carModelsData, brandOptions, colorOptions, seatOptions, yearOptions, bodyStyleOptions, AMENITY_OPTIONS, provinceDistricts, locationProvinces, locationOptions, operatingAreaOptions, seedCars, emptyForm, getFieldGroups, formatCompactDateTime, formatShortDate, getDaysInMonth, getFirstDayOfMonth, toLocalKey, VN_DAYS, fmtRangeDate, fmtRangeLabel, getCarWeight, sorters, inferSmartFilters, activeChips, validateCar, getOwnerInfo, phoneDigits, blobToDataUrl, getAtPath, setAtPath, clone, normalizeCarForm, normalize, unique, formatCurrency, fmtNum, statusText, formatBusyDates, today, delay } from '../../core.js';

import Map, { Marker, NavigationControl, GeolocateControl, Popup } from 'react-map-gl/mapbox';
import useSupercluster from 'use-supercluster';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2x4bWFjZWFoMDBoazJtb2F4ZnByNDFxeSJ9.dummy";


function SearchLocationPicker({ value, onChange }) {
  const [province, setProvince] = useState(() => {
    let v = value;
    if (typeof v === 'object' && v !== null) v = v.province || '';
    if (!v) return '';
    for (const p of locationProvinces) {
      if (v === p || (typeof v === 'string' && v.endsWith(`, ${p}`))) return p;
    }
    return v;
  });
  const [district, setDistrict] = useState(() => {
    let v = value;
    if (typeof v === 'object' && v !== null) return v.district || '';
    if (!v || typeof v !== 'string') return '';
    const parts = v.split(', ');
    if (parts.length >= 2) return parts[0];
    return '';
  });

  useEffect(() => {
    if (!value) { setProvince(''); setDistrict(''); }
  }, [value]);

  const districts = provinceDistricts[province] || [];

  const handleProvince = (p) => {
    setProvince(p);
    setDistrict('');
    onChange(p);
  };
  const handleDistrict = (d) => {
    setDistrict(d);
    onChange(d ? `${d}, ${province}` : province);
  };

  return (
    <>
      <div className="search-box location-search-box" style={{ flex: 1, minWidth: 0, background: '#fff', padding: 0, borderRadius: 12, border: '1px solid var(--m-border)' }}>
        <select value={province} onChange={e => handleProvince(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: 14, fontWeight: 500, color: province ? 'var(--m-dark)' : 'var(--m-subtle)', cursor: 'pointer', appearance: 'none' }}>
          <option value="" disabled hidden>Tỉnh/Thành</option>
          <option value="">Tất cả địa điểm</option>
          {locationProvinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {districts.length > 0 && (
        <div className="search-box location-search-box" style={{ flex: 1, minWidth: 0, background: '#fff', padding: 0, borderRadius: 12, border: '1px solid var(--m-border)' }}>
          <select value={district} onChange={e => handleDistrict(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: 14, fontWeight: 500, color: district ? 'var(--m-dark)' : 'var(--m-subtle)', cursor: 'pointer', appearance: 'none' }}>
            <option value="">Tất cả Quận/Huyện</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
    </>
  );
}

export { SearchLocationPicker };

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'red', background: '#fee2e2', height: '100vh', boxSizing: 'border-box' }}>
          <h2>Đã xảy ra lỗi khi tải trang này</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#fff', padding: 20, borderRadius: 8, marginTop: 20 }}>
            {this.state.error && this.state.error.toString()}
            {'\n'}
            {this.state.error && this.state.error.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}>Tải lại trang</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary };

function LocationPicker({ label, value, required, error, onChange, variant = "default" }) {
  const [province, setProvince] = useState(() => {
    let v = value;
    if (typeof v === 'object' && v !== null) v = v.province || '';
    if (!v) return '';
    for (const p of locationProvinces) {
      if (v === p || (typeof v === 'string' && v.endsWith(`, ${p}`))) return p;
    }
    return v;
  });
  const [district, setDistrict] = useState(() => {
    let v = value;
    if (typeof v === 'object' && v !== null) return v.district || '';
    if (!v || typeof v !== 'string') return '';
    const parts = v.split(', ');
    if (parts.length >= 2) return parts[0];
    return '';
  });

  const districts = provinceDistricts[province] || [];

  const handleProvince = (p) => {
    setProvince(p);
    setDistrict('');
    onChange(p);
  };
  const handleDistrict = (d) => {
    setDistrict(d);
    onChange(d ? `${d}, ${province}` : province);
  };

  const selectStyle = variant === "borderless" 
    ? { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--m-border)', fontSize: 14, fontWeight: 500, color: 'var(--m-dark)', outline: 'none', background: 'var(--m-surface)', cursor: 'pointer', minWidth: 160 }
    : { flex: 1, height: 40, padding: '0 10px', borderRadius: 8, border: `1.5px solid ${error ? 'var(--m-red)' : 'var(--m-border)'}`, fontSize: 14, outline: 'none', background: '#fff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: variant === "borderless" ? 0 : 6, gridColumn: 'span 2' }}>
      {label && (
        <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--m-dark)', display: 'flex', alignItems: 'center' }}>
          {label}{required && <span style={{ color: '#000', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: variant === "borderless" ? 4 : 0 }}>
        <select value={province} onChange={e => handleProvince(e.target.value)} style={selectStyle}>
          <option value="">Chọn tỉnh/thành</option>
          {locationProvinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {districts.length > 0 && (
          <select value={district} onChange={e => handleDistrict(e.target.value)} style={selectStyle}>
            <option value="">Chọn quận/huyện</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>
      {error && <small style={{ color: 'var(--m-red)', fontSize: 12 }}>{error}</small>}
    </div>
  );
}

export { LocationPicker };

function MapModal({ location, onClose }) {
  const mapUrl = `https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1s${encodeURIComponent(location)}`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <div>
            <h2>Vị trí nhận xe</h2>
            <p>{location}</p>
          </div>
          <button className="modal-close inline-close" onClick={onClose} aria-label="Đóng">
            <X size={17} />
          </button>
        </div>
        <iframe title={`Google Map ${location}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        <a className="primary map-open" href={openUrl} target="_blank" rel="noreferrer">Mở Google Maps</a>
      </section>
    </div>
  );
}

export { MapModal };

const handleOpenMap = (location) => {
  if (location) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`, '_blank');
  }
};

export { handleOpenMap };

// --- MAPBOX Location Picker ---
function MapboxLocationPicker({ value, onChange, label }) {
  const [viewport, setViewport] = useState({
    latitude: value?.lat || 10.762622,
    longitude: value?.lng || 106.660172,
    zoom: 13
  });
  const [marker, setMarker] = useState(value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : null);

  useEffect(() => {
    if (value?.lat && value?.lng) {
      setMarker({ lat: value.lat, lng: value.lng });
      setViewport(prev => ({ ...prev, latitude: value.lat, longitude: value.lng }));
    }
  }, [value?.lat, value?.lng]);

  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;
    setMarker({ lat, lng });
    onChange({ ...value, lat, lng });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
      {label && <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--m-dark)' }}>{label} <span style={{fontSize: 11, fontWeight: 400, color: 'var(--m-subtle)'}}>(Kéo thả để chọn toạ độ chính xác)</span></label>}
      <div style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--m-border)', position: 'relative' }}>
        <Map
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={handleMapClick}
          cursor="crosshair"
        >
          <GeolocateControl position="top-right" trackUserLocation={true} showAccuracyCircle={false} />
          <NavigationControl position="bottom-right" />
          {marker && (
            <Marker longitude={marker.lng} latitude={marker.lat} anchor="bottom">
              <MapPin size={32} color="var(--m-blue)" fill="white" />
            </Marker>
          )}
        </Map>
      </div>
    </div>
  );
}
export { MapboxLocationPicker };

// --- MAPBOX Cluster Viewer ---
function MapboxClusterViewer({ cars, onCarClick }) {
  const mapRef = useRef();
  const [viewport, setViewport] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    zoom: 11
  });

  const points = useMemo(() => cars.filter(c => c.location?.lat && c.location?.lng).map(car => ({
    type: "Feature",
    properties: { cluster: false, carId: car.id, ...car },
    geometry: { type: "Point", coordinates: [parseFloat(car.location.lng), parseFloat(car.location.lat)] }
  })), [cars]);

  const [bounds, setBounds] = useState(null);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewport.zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      <Map
        {...viewport}
        ref={mapRef}
        onMove={evt => {
          setViewport(evt.viewState);
          if (mapRef.current) {
            const b = mapRef.current.getMap().getBounds();
            setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
          }
        }}
        onLoad={() => {
          if (mapRef.current) {
            const b = mapRef.current.getMap().getBounds();
            setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
          }
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="top-right" trackUserLocation={true} />
        
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;

          if (isCluster) {
            return (
              <Marker key={`cluster-${cluster.id}`} latitude={latitude} longitude={longitude}>
                <div
                  style={{
                    width: `${30 + (pointCount / points.length) * 20}px`,
                    height: `${30 + (pointCount / points.length) * 20}px`,
                    background: 'var(--m-blue)',
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: expansionZoom, duration: 500 });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker key={`car-${cluster.properties.carId}`} latitude={latitude} longitude={longitude} anchor="bottom">
              <div onClick={(e) => { e.stopPropagation(); onCarClick && onCarClick(cluster.properties.carId); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#fff', padding: '4px 8px', borderRadius: 12, fontWeight: 600, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', marginBottom: 4, whiteSpace: 'nowrap', border: '1px solid var(--m-border)', color: 'var(--m-dark)' }}>
                  {formatCurrency(cluster.properties.rentalInfo?.price)}
                </div>
                <MapPin size={28} color="var(--m-blue)" fill="#fff" />
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
export { MapboxClusterViewer };


