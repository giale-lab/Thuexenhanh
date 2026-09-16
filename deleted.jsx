    },
    maintenanceRecords: [],
    descriptions: {
      short: "Xe máº«u phá»• biáº¿n táº¡i VN dÃ¹ng Ä‘á»ƒ test.",
      detail: "ÄÃ¢y lÃ  máº«u xe ráº¥t Ä‘Æ°á»£c Æ°a chuá»™ng táº¡i thá»‹ trÆ°á»ng Viá»‡t Nam.",
      amenities: ["Camera lÃ¹i", "Apple CarPlay", "Báº£n Ä‘á»“", "Bluetooth", "Cáº£m biáº¿n va cháº¡m"]
    },
    internalNotes: ""
  }
];

const emptyForm = {
  basicInfo: {
    brand: "",
    model: "",
    version: "",
    year: "",
    plate: "",
    exteriorColor: "",
    interiorColor: "",
    seats: "",
    vehicleType: "",
    bodyStyle: ""
  },
  technicalInfo: {
    fuel: "",
    engine: "",
    transmission: "",
    drivetrain: "",
    fuelConsumption: "",
    mileage: ""
  },
  rentalInfo: {
    status: "available",
    dayPrice: "",
    hourPrice: "",
    monthPrice: "",
    deposit: "",
    dailyKmLimit: "",
    overKmFee: "",
    pickupLocation: "",
    operatingArea: "",
    deliverySupport: false,
    driverIncluded: false,
    rentalCondition: "",
    blockedDates: []
  },
  documents: {
    registrationExpiry: "",
    insuranceExpiry: "",
    lastMaintenance: "",
    nextMaintenance: "",
    requiredDocuments: ""
  },
  descriptions: {
    detail: "",
    amenities: []
  },
  ownerInfo: {
    name: "",
    phone: "",
    zaloPhone: ""
  },
  status: {
    condition: "Tá»‘t",
    popularity: 0,
    dataWarning: "",
    isVerified: false
  },
  images: [{ url: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&auto=format&fit=crop" }],
  depositType: "cash",
  depositAmount: 15000000,
  internalNotes: ""
};

const getFieldGroups = (form, packageType = "premium") => {
  const basicFields = [
    {
      module: "Module_BasicInfoSection",
      title: "ThÃ´ng tin cÆ¡ báº£n",
      description: "TÃªn xe, hÃ£ng, dÃ²ng xe vÃ  sá»‘ chá»—.",
      fields: [
        ["basicInfo.brand", "HÃ£ng xe", "select", true, brandOptions],
        ["basicInfo.model", "DÃ²ng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.year", "NÄƒm sáº£n xuáº¥t", "select", true, yearOptions],
        ["basicInfo.plate", "Biá»ƒn sá»‘ xe", "text", true],
        ["basicInfo.seats", "Sá»‘ chá»— ngá»“i", "select", true, seatOptions]
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "GiÃ¡ cho thuÃª",
      description: "GiÃ¡ theo ngÃ y vÃ  Ä‘á»‹a Ä‘iá»ƒm nháº­n xe.",
      fields: [
        ["rentalInfo.status", "Tráº¡ng thÃ¡i", "select", true, [
          ["available", "Xe trá»‘ng"],
          ["busy", "Xe báº­n"]
        ]],
        ["rentalInfo.dayPrice", "GiÃ¡ thuÃª theo ngÃ y", "number", true],
        ["rentalInfo.pickupLocation", "Äá»‹a Ä‘iá»ƒm nháº­n xe", "select", true, locationOptions]
      ]
    },
    {
      module: "Module_OwnerContactSection",
      title: "ThÃ´ng tin chá»§ xe",
      description: "Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘á»ƒ khÃ¡ch liÃªn há»‡.",
      fields: [
        ["ownerInfo.name", "TÃªn chá»§ xe", "text", true],
        ["ownerInfo.phone", "SÄT chá»§ xe", "tel", true]
      ]
    }
  ];

  if (packageType === "basic") return basicFields;

  return [
    {
      module: "Module_BasicInfoSection",
      title: "ThÃ´ng tin cÆ¡ báº£n",
      description: "Nháº­n diá»‡n xe, phÃ¢n loáº¡i vÃ  cÃ¡c thÃ´ng tin hiá»ƒn thá»‹ chÃ­nh.",
      fields: [
        ["basicInfo.brand", "HÃ£ng xe", "select", true, brandOptions],
        ["basicInfo.model", "DÃ²ng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.version", "PhiÃªn báº£n", "text"],
        ["basicInfo.year", "NÄƒm sáº£n xuáº¥t", "select", true, yearOptions],
        ["basicInfo.plate", "Biá»ƒn sá»‘ xe", "text", true],
        ["basicInfo.exteriorColor", "MÃ u xe", "select", false, colorOptions],
        ["basicInfo.seats", "Sá»‘ chá»— ngá»“i", "select", true, seatOptions],
        ["basicInfo.vehicleType", "Loáº¡i xe", "select", false, ["Sedan", "SUV", "MPV", "Hatchback", "Pickup", "Minivan"]]
      ]
    },
    {
      module: "Module_TechnicalInfoSection",
      title: "ThÃ´ng tin ká»¹ thuáº­t",
      description: "ThÃ´ng sá»‘ váº­n hÃ nh giÃºp lá»c vÃ  tÆ° váº¥n xe chÃ­nh xÃ¡c.",
      fields: [
        ["technicalInfo.fuel", "Loáº¡i nhiÃªn liá»‡u", "select", true, ["XÄƒng", "Diesel", "Hybrid", "Äiá»‡n"]],
        ...(form.technicalInfo?.fuel === "Äiá»‡n" ? [
          ["technicalInfo.engine", "MÃ£ lá»±c / Moment xoáº¯n", "select", false, ["DÆ°á»›i 150 HP", "150 - 200 HP", "200 - 300 HP", "TrÃªn 300 HP"]],
          ["technicalInfo.fuelConsumption", "Má»©c tiÃªu hao (km / 1% pin)", "select", false, ["DÆ°á»›i 3 km", "3 - 5 km", "5 - 7 km", "TrÃªn 7 km"]]
        ] : [
          ["technicalInfo.engine", "Dung tÃ­ch Ä‘á»™ng cÆ¡", "select", false, ["1.0L", "1.5L", "2.0L", "2.0L Bi-Turbo", "2.4L", "2.5L"]],
          ["technicalInfo.fuelConsumption", "Má»©c tiÃªu hao nhiÃªn liá»‡u", "select", false, ["4-5L/100km", "5-6L/100km", "6-7L/100km", "7-8L/100km", "8L+/100km"]]
        ]),
        ["technicalInfo.transmission", "Há»™p sá»‘", "select", true, ["Sá»‘ tá»± Ä‘á»™ng", "Sá»‘ sÃ n"]],
        ["technicalInfo.drivetrain", "Há»‡ dáº«n Ä‘á»™ng", "select", false, ["FWD", "RWD", "AWD", "4WD"]]
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "ThÃ´ng tin cho thuÃª",
      description: "GiÃ¡, Ä‘iá»u kiá»‡n, khu vá»±c hoáº¡t Ä‘á»™ng vÃ  tráº¡ng thÃ¡i khai thÃ¡c.",
      fields: [
        ["rentalInfo.status", "Tráº¡ng thÃ¡i cho thuÃª", "select", true, [
          ["available", "Xe trá»‘ng"],
          ["busy", "Xe báº­n"]
        ]],
        ["rentalInfo.dayPrice", "GiÃ¡ thuÃª theo ngÃ y", "number", true],
        ["rentalInfo.pickupLocation", "Äá»‹a Ä‘iá»ƒm nháº­n xe", "select", true, locationOptions],
        ["rentalInfo.hourPrice", "GiÃ¡ thuÃª theo giá»", "toggle_number"],
        ["rentalInfo.monthPrice", "GiÃ¡ thuÃª theo thÃ¡ng", "toggle_number"],
        ["rentalInfo.dailyKmLimit", "Giá»›i háº¡n km má»—i ngÃ y", "number"],
        ["rentalInfo.overKmFee", "PhÃ­ vÆ°á»£t km", "number"],
        ...(form.technicalInfo?.fuel === "Äiá»‡n" ? [["rentalInfo.chargeFee", "PhÃ­ sáº¡c pin (VNÄ/1%)", "toggle_number"]] : [])
      ]
    },
    {
      module: "Module_DocumentInfoSection",
      title: "Giáº¥y tá»",
      description: "Háº¡n Ä‘Äƒng kiá»ƒm, báº£o hiá»ƒm vÃ  giáº¥y tá» yÃªu cáº§u.",
      fields: [
        ["documents.requiredDocuments", "YÃªu cáº§u giáº¥y tá»", "textarea"],
        ["documents.registrationExpiry", "Háº¡n Ä‘Äƒng kiá»ƒm", "date"],
        ["documents.insuranceExpiry", "Háº¡n báº£o hiá»ƒm", "date"]
      ]
    },
    {
      module: "Module_OwnerContactSection",
      title: "ThÃ´ng tin chá»§ xe",
      description: "Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘á»ƒ khÃ¡ch liÃªn há»‡.",
      fields: [
        ["ownerInfo.name", "TÃªn chá»§ xe", "text", true],
        ["ownerInfo.phone", "SÄT chá»§ xe", "tel", true]
      ]
    }
  ];
};

function LoginScreen({ onLogin, showToast }) {
  const toast = showToast || ((msg) => alert(msg));
  const [step, setStep] = useState("google");
  const [userData, setUserData] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      window.appLog?.('info', 'Báº¯t Ä‘áº§u Ä‘Äƒng nháº­p Google...');
      const user = await signInWithGoogle();
      window.appLog?.('info', `Google OK: ${user.email} (uid: ${user.uid})`);
      
      const userDocRef = doc(db, "users", user.uid);
      window.appLog?.('info', 'Kiá»ƒm tra user doc trÃªn Firestore...');
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        let role = data.role;
        if (ADMIN_EMAILS.includes(user.email)) role = 'admin';
        window.appLog?.('success', `User cÅ©: ${user.email} | role: ${role}`);
        onLogin({
          uid: user.uid,
          name: data.name || user.displayName,
          email: data.email || user.email,
          avatar: user.photoURL || data.avatar,
          role: role
        });
      } else {
        let role = "guest";
        if (ADMIN_EMAILS.includes(user.email)) role = 'admin';
        window.appLog?.('info', `User má»›i: ${user.email} | táº¡o doc vá»›i role: ${role}`);
        const newUserData = {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          role: role
        };
        await setDoc(doc(db, "users", user.uid), {
          ...newUserData,
          createdAt: new Date().toISOString()
        });
        window.appLog?.('success', 'Táº¡o user doc thÃ nh cÃ´ng!');
        onLogin(newUserData);
      }
    } catch (error) {
      console.error("Lá»—i Ä‘Äƒng nháº­p Google:", error);
      window.appLog?.('error', `Lá»—i Ä‘Äƒng nháº­p: ${error.code || ''} â€” ${error.message}`);
      toast("ÄÄƒng nháº­p tháº¥t báº¡i. Vui lÃ²ng kiá»ƒm tra láº¡i káº¿t ná»‘i.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-left">
        <div className="brand" style={{ gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: '50%', padding: 8, display: 'inline-flex' }}>
            <Zap size={28} color="var(--m-green)" fill="var(--m-green)" />
          </div>
          <h2 style={{ margin: 0 }}>ThuÃª Xe Nhanh</h2>
        </div>
        <div className="login-hero-text">
          <h1>ThuÃª xe tá»± lÃ¡i<br/>siÃªu tá»‘c & tiá»‡n lá»£i</h1>
          <p>Ná»n táº£ng káº¿t ná»‘i hÃ ng nghÃ¬n chá»§ xe vÃ  khÃ¡ch hÃ ng trÃªn toÃ n quá»‘c.</p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-box">
          <h2>ÄÄƒng nháº­p</h2>
          <p>Sá»­ dá»¥ng tÃ i khoáº£n Google Ä‘á»ƒ tiáº¿p tá»¥c</p>
          <button className="google-btn" onClick={handleGoogleLogin}>
            <svg width="24" height="24" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Tiáº¿p tá»¥c vá»›i Google
          </button>
          <button className="skip-btn" style={{ background: 'none', border: 'none', color: 'var(--m-subtle)', marginTop: 16, cursor: 'pointer', fontSize: 14 }} onClick={() => {
            onLogin({
              name: "KhÃ¡ch Xem Thá»­",
              email: "demo@thuexe.vnigo.sbs",
              avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              isGuest: true,
              role: "guest"
            });
          }}>
            Bá» qua Ä‘Äƒng nháº­p, xem thá»­
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchLocationPicker({ value, onChange }) {
  const [province, setProvince] = useState(() => {
    if (!value) return '';
    for (const p of locationProvinces) {
      if (value === p || value.endsWith(`, ${p}`)) return p;
    }
    return value;
  });
  const [district, setDistrict] = useState(() => {
    if (!value) return '';
    const parts = value.split(', ');
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
      <div className="search-box location-search-box" style={{ flex: 'none', width: '180px', marginLeft: '12px', background: '#fff', padding: 0 }}>
        <select value={province} onChange={e => handleProvince(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: 14, fontWeight: 500, color: province ? 'var(--m-dark)' : 'var(--m-subtle)', cursor: 'pointer', appearance: 'none' }}>
          <option value="" disabled hidden>Tá»‰nh/ThÃ nh</option>
          <option value="">Táº¥t cáº£ Ä‘á»‹a Ä‘iá»ƒm</option>
          {locationProvinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {districts.length > 0 && (
        <div className="search-box location-search-box" style={{ flex: 'none', width: '180px', marginLeft: '12px', background: '#fff', padding: 0 }}>
          <select value={district} onChange={e => handleDistrict(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', fontSize: 14, fontWeight: 500, color: district ? 'var(--m-dark)' : 'var(--m-subtle)', cursor: 'pointer', appearance: 'none' }}>
            <option value="">Táº¥t cáº£ Quáº­n/Huyá»‡n</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
    </>
  );
}

function AccountSettingsScreen({ user, onClose, onSave, cars, onToggleFavorite, onAdmin }) {
  const [currentView, setCurrentView] = useState("menu");
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [location, setLocation] = useState(user.location || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user.isGuest) {
        await updateDoc(doc(db, "users", user.uid), {
          name,
          phone,
          location
        });
      }
      onSave({ ...user, name, phone, location });
      setCurrentView("menu");
    } catch (error) {
      console.error("Lá»—i cáº­p nháº­t tÃ i khoáº£n:", error);
      window.showAlert("Lá»—i cáº­p nháº­t tÃ i khoáº£n: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    window.showAlert("ÄÃ£ copy link trang web: " + window.location.origin);
  };

  const handleSwitchRole = () => {
    const newRole = user.role === 'owner' ? 'guest' : 'owner';
    const confirmMsg = `Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n chuyá»ƒn sang cháº¿ Ä‘á»™ ${newRole === 'owner' ? 'Chá»§ xe' : 'KhÃ¡ch thuÃª'}?`;
    window.showConfirm(confirmMsg, async () => {
      try {
        setSaving(true);
        if (!user.isGuest) {
          await updateDoc(doc(db, "users", user.uid), { role: newRole });
        }
        onSave({ ...user, role: newRole });
        window.showAlert(`ÄÃ£ chuyá»ƒn sang cháº¿ Ä‘á»™ ${newRole === 'owner' ? 'Chá»§ xe' : 'KhÃ¡ch thuÃª'}`);
        onClose();
      } catch (error) {
        console.error("Lá»—i Ä‘á»•i vai trÃ²:", error);
        window.showAlert("Lá»—i Ä‘á»•i vai trÃ²: " + error.message);
      } finally {
        setSaving(false);
      }
    });
  };

  const favoriteCars = cars.filter(c => user.favorites?.includes(c.id));

  const handleLocationChange = async (newLocation) => {
    setLocation(newLocation);
    try {
      if (!user.isGuest) {
        await updateDoc(doc(db, "users", user.uid), { location: newLocation });
      }
      onSave({ ...user, location: newLocation });
    } catch (err) {
      console.error("Lá»—i cáº­p nháº­t vá»‹ trÃ­:", err);
      window.showAlert("Lá»—i cáº­p nháº­t vá»‹ trÃ­: " + err.message);
    }
  };

  return (
    <ModuleFrame className="account-screen" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {currentView === "menu" && (
        <div className="account-menu">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button className="icon-button" onClick={onClose}><ChevronLeft size={20}/></button>
            <h2 style={{ margin: 0, fontSize: 20 }}>TÃ i khoáº£n</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--m-border)' }}>
            <img src={user.avatar} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--m-dark)' }}>{user.name || user.email}</div>
            <div style={{ fontSize: 12, color: 'var(--m-subtle)' }}>Vai trÃ²: {user.role === 'owner' ? 'Chá»§ xe' : 'KhÃ¡ch thuÃª'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--m-border)', marginTop: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-dark)', flexShrink: 0 }}>Khu vá»±c:</span>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <LocationPicker 
                label="" 
                value={location} 
                onChange={handleLocationChange} 
                variant="borderless"
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            {ADMIN_EMAILS.includes(user.email) && onAdmin && (
              <button className="menu-btn" onClick={onAdmin} style={{ color: 'var(--m-green)' }}>Trang Quáº£n trá»‹ viÃªn</button>
            )}
            <button className="menu-btn" onClick={() => setCurrentView("profile")}>Cáº­p nháº­t há»“ sÆ¡</button>
            <button className="menu-btn" onClick={handleSwitchRole}>Äá»•i sang cháº¿ Ä‘á»™ {user.role === 'owner' ? 'KhÃ¡ch thuÃª' : 'Chá»§ xe'}</button>
            <button className="menu-btn" onClick={() => setCurrentView("favorites")}>Xe yÃªu thÃ­ch ({favoriteCars.length})</button>
            <button className="menu-btn" onClick={() => setCurrentView("reviews")}>ÄÃ¡nh giÃ¡ cá»§a tÃ´i</button>
            <button className="menu-btn" onClick={handleCopyLink}>Giá»›i thiá»‡u báº¡n bÃ¨ (Copy Link)</button>
            <button className="menu-btn" onClick={() => setCurrentView("policy")}>ChÃ­nh sÃ¡ch báº£o vá»‡ dá»¯ liá»‡u</button>
            <button className="menu-btn" onClick={() => setCurrentView("disclaimer")}>Miá»…n trá»« trÃ¡ch nhiá»‡m & An toÃ n</button>
            <button className="menu-btn" style={{ color: 'var(--m-red)' }} onClick={() => window.showAlert('TÃ­nh nÄƒng Ä‘ang phÃ¡t triá»ƒn')}>XÃ³a tÃ i khoáº£n</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--m-subtle)' }}>
            PhiÃªn báº£n 06.26.v1.1
          </div>
        </div>
      )}

      {currentView === "profile" && (
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid var(--m-border)', boxShadow: 'var(--shadow-sm)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--m-border)' }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Cáº­p nháº­t há»“ sÆ¡</h2>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div className="search-box" style={{ margin: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ width: '90px', flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)', margin: 0 }}>TÃªn hiá»ƒn thá»‹</label>
              <input type="text" style={{ flex: 1, border: 'none', background: 'transparent', width: '100%', fontSize: 15, fontWeight: 500, color: 'var(--m-dark)', outline: 'none' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nháº­p tÃªn hiá»ƒn thá»‹..." />
             </div>
             <div className="search-box" style={{ margin: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ width: '90px', flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--m-subtle)', margin: 0 }}>Sá»‘ Ä‘iá»‡n thoáº¡i</label>
              <input type="tel" style={{ flex: 1, border: 'none', background: 'transparent', width: '100%', fontSize: 15, fontWeight: 500, color: 'var(--m-dark)', outline: 'none' }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i..." />
             </div>
             <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
              <button className="secondary" style={{ flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 600, borderRadius: 'var(--r-md)' }} onClick={() => setCurrentView("menu")}>Há»§y</button>
              <button className="primary" style={{ flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 600, borderRadius: 'var(--r-md)' }} onClick={handleSave} disabled={saving}>{saving ? "Äang lÆ°u..." : "LÆ°u thay Ä‘á»•i"}</button>
             </div>
           </div>
        </div>
      )}

      {currentView === "favorites" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Xe yÃªu thÃ­ch</h2>
           </div>
           {favoriteCars.length === 0 ? (
             <p style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40 }}>ChÆ°a cÃ³ xe yÃªu thÃ­ch nÃ o.</p>
           ) : (
             <div className="car-grid">
               {favoriteCars.map(car => (
                 <CarCard key={car.id} car={car} adminMode={false} onView={() => window.showAlert("TÃ­nh nÄƒng xem chi tiáº¿t Ä‘ang phÃ¡t triá»ƒn")} onMap={() => {}} liked={true} onToggleLike={() => onToggleFavorite(car.id)} />
               ))}
             </div>
           )}
        </div>
      )}

      {currentView === "reviews" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>ÄÃ¡nh giÃ¡ cá»§a tÃ´i</h2>
           </div>
           <div style={{ textAlign: 'center', color: 'var(--m-subtle)', marginTop: 40, padding: 24, background: 'var(--m-surface)', borderRadius: 12, border: '1px solid var(--m-border)' }}>
             <Star size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
             <p>Báº¡n chÆ°a cÃ³ Ä‘Ã¡nh giÃ¡ nÃ o.</p>
           </div>
        </div>
      )}

      {currentView === "policy" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>ChÃ­nh sÃ¡ch báº£o máº­t</h2>
           </div>
           <div style={{ fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--m-border)' }}>
             <h3 style={{marginTop: 0}}>1. Thu tháº­p thÃ´ng tin</h3>
             <p>ChÃºng tÃ´i thu tháº­p cÃ¡c thÃ´ng tin cÆ¡ báº£n bao gá»“m tÃªn, email, sá»‘ Ä‘iá»‡n thoáº¡i vÃ  thÃ´ng tin Ä‘Äƒng nháº­p Google Ä‘á»ƒ Ä‘á»‹nh danh ngÆ°á»i dÃ¹ng vÃ  há»— trá»£ liÃªn láº¡c trong quÃ¡ trÃ¬nh thuÃª xe.</p>
             <h3>2. Sá»­ dá»¥ng thÃ´ng tin</h3>
             <p>ThÃ´ng tin cá»§a báº¡n Ä‘Æ°á»£c sá»­ dá»¥ng riÃªng cho má»¥c Ä‘Ã­ch káº¿t ná»‘i giá»¯a chá»§ xe vÃ  khÃ¡ch thuÃª, quáº£n lÃ½ lá»‹ch trÃ¬nh vÃ  cáº£i thiá»‡n cháº¥t lÆ°á»£ng dá»‹ch vá»¥. ChÃºng tÃ´i cam káº¿t khÃ´ng bÃ¡n dá»¯ liá»‡u cho bÃªn thá»© ba.</p>
             <h3>3. Báº£o máº­t dá»¯ liá»‡u</h3>
             <p>Dá»¯ liá»‡u cá»§a báº¡n Ä‘Æ°á»£c lÆ°u trá»¯ an toÃ n trÃªn mÃ¡y chá»§ Firebase cá»§a Google vá»›i cÃ¡c lá»›p báº£o máº­t chuáº©n quá»‘c táº¿. Máº­t kháº©u vÃ  token xÃ¡c thá»±c Ä‘Æ°á»£c mÃ£ hÃ³a toÃ n trÃ¬nh.</p>
             <h3>4. Quyá»n cá»§a ngÆ°á»i dÃ¹ng</h3>
             <p>Báº¡n cÃ³ quyá»n yÃªu cáº§u xem, sá»­a Ä‘á»•i hoáº·c xÃ³a toÃ n bá»™ thÃ´ng tin cÃ¡ nhÃ¢n cá»§a mÃ¬nh trÃªn há»‡ thá»‘ng cá»§a chÃºng tÃ´i báº¥t cá»© lÃºc nÃ o thÃ´ng qua chá»©c nÄƒng XÃ³a tÃ i khoáº£n trong á»©ng dá»¥ng.</p>
           </div>
        </div>
      )}

      {currentView === "disclaimer" && (
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
             <button className="icon-button" onClick={() => setCurrentView("menu")}><ChevronLeft size={20}/></button>
             <h2 style={{ margin: 0, fontSize: 18 }}>Miá»…n trá»« trÃ¡ch nhiá»‡m & An toÃ n</h2>
           </div>
           
           <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--m-border)', marginBottom: 20 }}>
             <h3 style={{ fontSize: 16, color: 'var(--m-red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
               <ShieldAlert size={18} /> Miá»…n trá»« trÃ¡ch nhiá»‡m
             </h3>
             <ul style={{ paddingLeft: 20, fontSize: 14, color: 'var(--m-dark)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
               <li>Ná»n táº£ng nÃ y hoáº¡t Ä‘á»™ng <strong>hoÃ n toÃ n nhÆ° má»™t trung gian thÃ´ng tin</strong> káº¿t ná»‘i Chá»§ xe vÃ  KhÃ¡ch thuÃª.</li>
               <li>ChÃºng tÃ´i <strong>khÃ´ng xÃ¡c minh danh tÃ­nh, báº±ng lÃ¡i, giáº¥y tá» xe, hay tÃ¬nh tráº¡ng xe thá»±c táº¿</strong> cá»§a báº¥t ká»³ cÃ¡ nhÃ¢n nÃ o tham gia.</li>
               <li>ChÃºng tÃ´i <strong>khÃ´ng can thiá»‡p, khÃ´ng xá»­ lÃ½ tranh cháº¥p, khÃ´ng chá»‹u trÃ¡ch nhiá»‡m</strong> cho báº¥t ká»³ thiá»‡t háº¡i, máº¥t mÃ¡t, tai náº¡n, hay rá»§i ro phÃ¡p lÃ½ nÃ o phÃ¡t sinh trong quÃ¡ trÃ¬nh giao dá»‹ch vÃ  thuÃª xe.</li>
               <li>Viá»‡c giao dá»‹ch, Ä‘áº·t cá»c, vÃ  kÃ½ há»£p Ä‘á»“ng lÃ  sá»± thá»a thuáº­n tá»± nguyá»‡n giá»¯a Chá»§ xe vÃ  KhÃ¡ch thuÃª. Báº¡n hoÃ n toÃ n tá»± chá»‹u trÃ¡ch nhiá»‡m vá»›i quyáº¿t Ä‘á»‹nh cá»§a mÃ¬nh.</li>
             </ul>
           </div>

           <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 12, border: '1px solid #bbf7d0' }}>
             <h3 style={{ fontSize: 16, color: 'var(--m-green)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
               <Info size={18} /> Máº¹o giao dá»‹ch an toÃ n
             </h3>
             <ul style={{ paddingLeft: 20, fontSize: 14, color: '#166534', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
               <li><strong>Kiá»ƒm tra ká»¹ giáº¥y tá»:</strong> LuÃ´n yÃªu cáº§u xem giáº¥y tá» xe báº£n gá»‘c (CÃ  váº¹t, ÄÄƒng kiá»ƒm, Báº£o hiá»ƒm) vÃ  CCCD/GPLX cá»§a ngÆ°á»i giao dá»‹ch trÆ°á»›c khi giao xe hoáº·c giao tiá»n.</li>
               <li><strong>Kiá»ƒm tra xe thá»±c táº¿:</strong> Chá»¥p áº£nh vÃ  quay video toÃ n bá»™ tÃ¬nh tráº¡ng xe (tráº§y xÆ°á»›c, ná»™i tháº¥t, Ä‘á»“ng há»“ km, váº¡ch xÄƒng) trÆ°á»›c khi nháº­n xe vÃ  sau khi tráº£ xe.</li>
               <li><strong>LÃ m há»£p Ä‘á»“ng rÃµ rÃ ng:</strong> LuÃ´n pháº£i cÃ³ há»£p Ä‘á»“ng thuÃª xe báº±ng vÄƒn báº£n minh báº¡ch vá» giÃ¡ cáº£, tiá»n cá»c, vÃ  quy Ä‘á»‹nh pháº¡t.</li>
               <li><strong>Cáº©n tháº­n vá»›i cá»c trá»±c tuyáº¿n:</strong> Háº¡n cháº¿ chuyá»ƒn cá»c trÆ°á»›c cho nhá»¯ng xe cÃ³ giÃ¡ ráº» báº¥t thÆ°á»ng hoáº·c chá»§ xe cÃ³ dáº¥u hiá»‡u máº­p má», há»‘i thÃºc.</li>
               <li><strong>Sá»­ dá»¥ng tÃ­nh nÄƒng BÃ¡o cÃ¡o:</strong> Náº¿u phÃ¡t hiá»‡n xe lá»«a Ä‘áº£o hoáº·c thÃ´ng tin sai lá»‡ch, hÃ£y sá»­ dá»¥ng nÃºt BÃ¡o cÃ¡o trÃªn trang chi tiáº¿t xe Ä‘á»ƒ chÃºng tÃ´i xem xÃ©t xÃ³a bá».</li>
             </ul>
           </div>
        </div>
      )}
    </ModuleFrame>
  );
}
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
          <h2>ÄÃ£ xáº£y ra lá»—i khi táº£i trang nÃ y</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#fff', padding: 20, borderRadius: 8, marginTop: 20 }}>
            {this.state.error && this.state.error.toString()}
            {'\n'}
            {this.state.error && this.state.error.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}>Táº£i láº¡i trang</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("web-thue-xe-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

