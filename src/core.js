import imageCompression from 'browser-image-compression';
import { auth, db, signInWithGoogle, logout, uploadFile, verifyEmail } from "./firebase";
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, query, where } from "firebase/firestore";


function isWeekendRange(startDate, endDate) {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() === 0 || cur.getDay() === 6) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

export { isWeekendRange };

const ADMIN_EMAILS = ['acmecovn.ltd@gmail.com', 'huynhbaogia.le@gmail.com', 'brandon.gia96@gmail.com'];

export { ADMIN_EMAILS };

const STORAGE_KEY = "web-thue-xe-cars";

export { STORAGE_KEY };

const carModelsData = {
  Toyota: ["Vios", "Innova", "Innova Cross", "Camry", "Fortuner", "Corolla Altis", "Corolla Cross", "Yaris", "Yaris Cross", "Raize", "Hilux", "Land Cruiser", "Land Cruiser Prado", "Alphard", "Avanza Premio", "Veloz Cross"],
  Hyundai: ["Grand i10", "Accent", "Elantra", "Creta", "Tucson", "Santa Fe", "Palisade", "Stargazer", "Custin", "Ioniq 5", "Venue", "Kona", "Solati"],
  Kia: ["Morning", "Soluto", "K3", "K5", "Sonet", "Seltos", "Sportage", "Sorento", "Carnival", "Carens", "Cerato", "Sedona"],
  Mazda: ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-8", "BT-50"],
  Honda: ["Brio", "City", "Civic", "Accord", "HR-V", "CR-V", "BR-V"],
  Ford: ["Ranger", "Everest", "Explorer", "Territory", "Transit", "EcoSport", "Focus"],
  Mitsubishi: ["Attrage", "Xpander", "Xpander Cross", "Outlander", "Pajero Sport", "Triton"],
  VinFast: ["Fadil", "VF 3", "VF 5", "VF e34", "VF 6", "VF 7", "VF 8", "VF 9", "Lux A2.0", "Lux SA2.0", "President"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLS", "Maybach", "G-Class", "V-Class", "EQB", "EQE", "EQS"],
  BMW: ["3 Series", "5 Series", "7 Series", "X3", "X4", "X5", "X6", "X7", "Z4", "i4", "i7", "iX3"],
  Audi: ["A3", "A4", "A6", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  Lexus: ["ES", "LS", "NX", "RX", "GX", "LX", "LM", "IS"],
  Volvo: ["XC40", "XC60", "XC90", "S90", "V60"],
  Porsche: ["Macan", "Cayenne", "Panamera", "Taycan", "911"],
  Peugeot: ["2008", "3008", "5008", "408", "Traveller"],
  Subaru: ["Forester", "Outback", "BRZ", "WRX"],
  Nissan: ["Almera", "Kicks", "Navara", "Terra"],
  Suzuki: ["Swift", "Ertiga", "XL7", "Jimny", "Ciaz", "Blind Van"],
  Isuzu: ["D-Max", "mu-X"],
  MG: ["MG5", "ZS", "HS", "RX5"],
  Skoda: ["Karoq", "Kodiaq"],
  Haval: ["H6"],
  Wuling: ["HongGuang MiniEV"],
  BYD: ["Atto 3", "Dolphin", "Seal"],
  Chevrolet: ["Colorado", "Trailblazer", "Cruze", "Spark"],
  Volkswagen: ["Teramont", "Tiguan", "Touareg", "Virtus", "T-Cross"]
};

export { carModelsData };

const brandOptions = Object.keys(carModelsData);

export { brandOptions };

const colorOptions = ["Tráº¯ng", "Äen", "Báº¡c", "Äá»", "XÃ¡m", "Xanh lam", "VÃ ng", "NÃ¢u", "KhÃ¡c"];

export { colorOptions };

const seatOptions = ["4", "5", "7", "9", "16", "29", "45"];

export { seatOptions };

const yearOptions = Array.from({length: new Date().getFullYear() - 1999}, (_, i) => (new Date().getFullYear() - i).toString());

export { yearOptions };

const bodyStyleOptions = ["ÄÃ´ thá»‹", "Gia Ä‘Ã¬nh", "Gáº§m cao", "Du lá»‹ch", "CÃ´ng tÃ¡c", "Dá»‹ch vá»¥"];

export { bodyStyleOptions };

const AMENITY_OPTIONS = [
  "Báº£n Ä‘á»“ VM", "Camera 360", "Cam hÃ nh trÃ¬nh", "Cam lÃ¹i", "Cáº£m biáº¿n lá»‘p", "GPS", "ETC", "TÃºi khÃ­", "Lá»‘p dá»± phÃ²ng", "Cáº£m biáº¿n va cháº¡m", "Cá»­a sá»• trá»i", "ADAS", "Gháº¿ da"
];

export { AMENITY_OPTIONS };

const provinceDistricts = {
  "TP.HCM": ["Quáº­n 1","Quáº­n 3","Quáº­n 4","Quáº­n 5","Quáº­n 6","Quáº­n 7","Quáº­n 8","Quáº­n 10","Quáº­n 11","Quáº­n 12","BÃ¬nh Tháº¡nh","GÃ² Váº¥p","PhÃº Nhuáº­n","TÃ¢n BÃ¬nh","TÃ¢n PhÃº","BÃ¬nh TÃ¢n","BÃ¬nh ChÃ¡nh","Cáº§n Giá»","Cá»§ Chi","HÃ³c MÃ´n","NhÃ  BÃ¨","Thá»§ Äá»©c","TP.Thá»§ Äá»©c"],
  "HÃ  Ná»™i": ["HoÃ n Kiáº¿m","Ba ÄÃ¬nh","Äá»‘ng Äa","Hai BÃ  TrÆ°ng","HoÃ ng Mai","Long BiÃªn","TÃ¢y Há»“","Cáº§u Giáº¥y","Thanh XuÃ¢n","HÃ  ÄÃ´ng","ÄÃ´ng Anh","Gia LÃ¢m","SÃ³c SÆ¡n","Tá»« LiÃªm","ThÆ°á»ng TÃ­n","MÃª Linh"],
  "ÄÃ  Náºµng": ["Háº£i ChÃ¢u","Thanh KhÃª","LiÃªn Chiá»ƒu","NgÅ© HÃ nh SÆ¡n","SÆ¡n TrÃ ","Cáº©m Lá»‡","HÃ²a Vang"],
  "Háº£i PhÃ²ng": ["Há»“ng BÃ ng","NgÃ´ Quyá»n","LÃª ChÃ¢n","Kiáº¿n An","Háº£i An","Äá»“ SÆ¡n","DÆ°Æ¡ng Kinh","Thuá»· NguyÃªn","An DÆ°Æ¡ng","An LÃ£o","Kiáº¿n Thá»¥y","TiÃªn LÃ£ng","VÄ©nh Báº£o","CÃ¡t Háº£i"],
  "Cáº§n ThÆ¡": ["Ninh Kiá»u","BÃ¬nh Thá»§y","CÃ¡i RÄƒng","Ã” MÃ´n","Thá»‘t Ná»‘t","Phong Äiá»n","Cá» Äá»","Thá»›i Lai","VÄ©nh Tháº¡nh"]
};

export { provinceDistricts };

const locationProvinces = [
  "TP.HCM","HÃ  Ná»™i","ÄÃ  Náºµng","Háº£i PhÃ²ng","Cáº§n ThÆ¡",
  "BÃ  Rá»‹a - VÅ©ng TÃ u","BÃ¬nh DÆ°Æ¡ng","Äá»“ng Nai","KhÃ¡nh HÃ²a","LÃ¢m Äá»“ng",
  "Quáº£ng Ninh","Thanh HÃ³a","Nghá»‡ An","Thá»«a ThiÃªn Huáº¿","Quáº£ng Nam",
  "BÃ¬nh Äá»‹nh","PhÃº YÃªn","BÃ¬nh Thuáº­n","Ninh Thuáº­n","Gia Lai",
  "Äáº¯k Láº¯k","LÃ o Cai","VÄ©nh PhÃºc","Báº¯c Ninh","Háº£i DÆ°Æ¡ng",
  "HÆ°ng YÃªn","Nam Äá»‹nh","ThÃ¡i BÃ¬nh","Ninh BÃ¬nh","Long An",
  "Tiá»n Giang","KiÃªn Giang","An Giang","SÃ³c TrÄƒng","CÃ  Mau","Äáº¯k NÃ´ng","Kon Tum","BÃ¬nh PhÆ°á»›c","TÃ¢y Ninh"
];

export { locationProvinces };

const locationOptions = locationProvinces;

export { locationOptions };

const operatingAreaOptions = ["HÃ  Ná»™i", "TP.HCM", "ÄÃ  Náºµng", "HÃ  Ná»™i vÃ  tá»‰nh lÃ¢n cáº­n", "TP.HCM, VÅ©ng TÃ u, ÄÃ  Láº¡t", "ToÃ n quá»‘c"];

export { operatingAreaOptions };

const seedCars = [];

export { seedCars };

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
      fuel: "XÄƒng",
      engine: "",
    transmission: "Sá»‘ tá»± Ä‘á»™ng",
    drivetrain: "",
    fuelConsumption: "",
    mileage: ""
  },
  rentalInfo: {
    status: "available",
    dayPrice: "",
    weekendPrice: "",
    deposit: "",
      requireDeposit: false,
      requireMotorbike: false,
      requireLicense: false,
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
  depositType: "none",
  depositAmount: 0,
  internalNotes: ""
};

export { emptyForm };

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
        ["basicInfo.plate", "Biá»ƒn sá»‘ xe", "text", true, null, "12A34567"],
        ["basicInfo.seats", "Sá»‘ chá»— ngá»“i", "select", true, seatOptions],
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
        ["rentalInfo.weekendPrice", "GiÃ¡ cuá»‘i tuáº§n", "number", false],
        ["rentalInfo.pickupLocation", "Ä‘á»‹a Ä‘iá»ƒm nháº­n xe", "select", true, locationOptions],
          ["rentalInfo.driverIncluded", "CÃ³ tÃ i xáº¿", "boolean"]
      ]
    },
          {
        module: "Module_RentalConditionsSection",
        title: "Äiá»u kiá»‡n thuÃª",
        description: "CÃ¡c yÃªu cáº§u báº¯t buá»™c Ä‘á»‘i vá»›i khÃ¡ch thuÃª.",
        fields: [
          ["rentalInfo.requireDeposit", "YÃªu cáº§u Ä‘áº·t cá»c", "boolean"],
          ["rentalInfo.requireMotorbike", "Tháº¿ cháº¥p xe mÃ¡y", "boolean"],
          ["rentalInfo.requireLicense", "Äá»‘i chiáº¿u GPLX", "boolean"]
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
        ["basicInfo.year", "NÄƒm sáº£n xuáº¥t", "select", true, yearOptions],
        ["basicInfo.plate", "Biá»ƒn sá»‘ xe", "text", true, null, "12A34567"],
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
        ["technicalInfo.fuel", "Loáº¡i nhiÃªn liá»‡u", "select", true, ["XÄƒng", "Dáº§u Diesel", "Hybrid", "Äiá»‡n"]],
        ...(form.technicalInfo?.fuel === "Äiá»‡n" ? [
          ["technicalInfo.engine", "MÃ£ lá»±c / Moment xoáº¯n", "select", false, ["DÆ°á»›i 150 HP", "150 - 10 HP", "200 - 300 HP", "TrÃªn 300 HP"]],
          ["technicalInfo.fuelConsumption", "Má»©c tiÃªu hao (km / 1% pin)", "select", true, ["DÆ°á»›i 3 km/1%", "3 - 5 km/1%", "5 - 7 km/1%", "TrÃªn 7 km/1%"]]
        ] : [
          ["technicalInfo.engine", "Dung tÃ­ch Ä‘á»™ng cÆ¡", "select", false, ["1.0L", "1.5L", "2.0L", "2.0L Bi-Turbo", "2.4L", "2.5L"]],
          ["technicalInfo.fuelConsumption", "Má»©c tiÃªu hao nhiÃªn liá»‡u", "select", true, ["4-5L/100km", "5-6L/100km", "6-7L/100km", "7-8L/100km", "8L+/100km"]]
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
        ["rentalInfo.weekendPrice", "GiÃ¡ cuá»‘i tuáº§n", "number", false],
        ["rentalInfo.pickupLocation", "Ä‘á»‹a Ä‘iá»ƒm nháº­n xe", "select", true, locationOptions],
          ["rentalInfo.dailyKmLimit", "Giá»›i háº¡n km má»—i ngÃ y", "number"],
          ["rentalInfo.overKmFee", "PhÃ­ vÆ°á»£t/km", "number"],
          ["rentalInfo.extraOptions", "", "extra_options_group"],
        ...(form.technicalInfo?.fuel === "Äiá»‡n" ? [["rentalInfo.chargeFee", "PhÃ­ sáº¡c pin (VNÄ/1%)", "toggle_number"], ["rentalInfo.freeCharge", "Miá»…n phÃ­ sáº¡c pin (km)", "toggle_number"]] : [])
      ]
    },
          {
        module: "Module_RentalConditionsSection",
        title: "Äiá»u kiá»‡n thuÃª",
        description: "CÃ¡c yÃªu cáº§u báº¯t buá»™c Ä‘á»‘i vá»›i khÃ¡ch thuÃª.",
        fields: [
          ["rentalInfo.requireDeposit", "YÃªu cáº§u Ä‘áº·t cá»c", "boolean"],
          ["rentalInfo.requireMotorbike", "Tháº¿ cháº¥p xe mÃ¡y", "boolean"],
          ["rentalInfo.requireLicense", "Äá»‘i chiáº¿u GPLX", "boolean"]
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

export { getFieldGroups };

const formatCompactDateTime = (d, time) => {
  if (!d) return "";
  const date = new Date(d);
  const dayName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${time || "00:00"} ${dayName}, ${dd}/${mm}`;
};

export { formatCompactDateTime };

function formatShortDate(d) {
  if (!d) return "";
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayName = days[d.getDay()];
  const dateStr = d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayName}, ${dateStr}`;
}

export { formatShortDate };

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export { getDaysInMonth };

function getFirstDayOfMonth(year, month) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export { getFirstDayOfMonth };

const toLocalKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export { toLocalKey };

const VN_DAYS = ['Chá»§ Nháº­t', 'Thá»© Hai', 'Thá»© Ba', 'Thá»© TÆ°', 'Thá»© NÄƒm', 'Thá»© SÃ¡u', 'Thá»© Báº£y'];

export { VN_DAYS };

const fmtRangeDate = (key) => {
  if (!key) return '';
  const d = new Date(key + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} (${VN_DAYS[d.getDay()]})`;
};

export { fmtRangeDate };

const fmtRangeLabel = (r) => r.start === r.end
  ? fmtRangeDate(r.start)
  : `${fmtRangeDate(r.start)} â€“ ${fmtRangeDate(r.end)}`;

export { fmtRangeLabel };

const getCarWeight = (car) => {
  let weight = 1;
  if (car.status?.isDemo) weight = 2;
  if (car.status?.isVerified) weight = 3;
  // Æ¯u tiÃªn hiá»ƒn thá»‹ trÃªn cÃ¹ng (Cháº¡y Ads / Äáº©y tin)
  if (car.status?.promotedUntil && new Date(car.status.promotedUntil).getTime() > Date.now()) {
    weight = 10;
  }
  return weight;
};

export { getCarWeight };

const sorters = {

  newest: (a, b) => getCarWeight(b) - getCarWeight(a) || new Date(b.createdAt) - new Date(a.createdAt),
  priceAsc: (a, b) => getCarWeight(b) - getCarWeight(a) || (a.rentalInfo.weekendPrice && window.currentIsWeekend ? a.rentalInfo.weekendPrice : a.rentalInfo.dayPrice) - (b.rentalInfo.weekendPrice && window.currentIsWeekend ? b.rentalInfo.weekendPrice : b.rentalInfo.dayPrice),
  priceDesc: (a, b) => getCarWeight(b) - getCarWeight(a) || (b.rentalInfo.weekendPrice && window.currentIsWeekend ? b.rentalInfo.weekendPrice : b.rentalInfo.dayPrice) - (a.rentalInfo.weekendPrice && window.currentIsWeekend ? a.rentalInfo.weekendPrice : a.rentalInfo.dayPrice),
  yearDesc: (a, b) => getCarWeight(b) - getCarWeight(a) || b.basicInfo.year - a.basicInfo.year,
  seatsDesc: (a, b) => getCarWeight(b) - getCarWeight(a) || b.basicInfo.seats - a.basicInfo.seats,
  available: (a, b) => getCarWeight(b) - getCarWeight(a) || Number(b.rentalInfo.status === "available") - Number(a.rentalInfo.status === "available"),
  popular: (a, b) => getCarWeight(b) - getCarWeight(a) || (b.status?.popularity || 0) - (a.status?.popularity || 0)
};

export { sorters };

function inferSmartFilters(query) {
  const text = normalize(query);
  const inferred = {};
  const seats = text.match(/(\d+)\s*cho/);
  const price = text.match(/duoi\s*(\d+(?:[.,]\d+)?)\s*(trieu|k|nghin|ngan)?/);
  if (seats) inferred.seats = seats[1];
  if (text.includes("tu dong")) inferred.transmission = "Sá»‘ tá»± Ä‘á»™ng";
  if (text.includes("so san")) inferred.transmission = "Sá»‘ sÃ n";
  if (text.includes("suv")) inferred.vehicleType = "SUV";
  if (text.includes("sedan")) inferred.vehicleType = "Sedan";
  if (text.includes("xang")) inferred.fuel = "XÄƒng";
  if (text.includes("diesel")) inferred.fuel = "Diesel";
  if (text.includes("hybrid")) inferred.fuel = "Hybrid";
  if (text.includes("dien")) inferred.fuel = "Äiá»‡n";
  if (text.includes("free sac") || text.includes("sac mien phi")) {
    inferred.fuel = "Äiá»‡n";
    inferred.freeCharge = "true";
  }
  if (text.includes("con trong") || text.includes("ranh")) inferred.status = "available";
  if (text.includes("bao duong")) inferred.status = "maintenance";
  if (text.includes("ha noi")) inferred.location = "HÃ  Ná»™i";
  if (text.includes("tp hcm") || text.includes("sai gon")) inferred.location = "TP.HCM";
  if (text.includes("co tai xe")) inferred.driver = "true";
  if (text.includes("tu lai")) inferred.driver = "false";
  if (price) {
    const number = Number(price[1].replace(",", "."));
    inferred.maxPrice = price[2] === "trieu" ? number * 1000000 : number * 1000;
  }
  return inferred;
}

export { inferSmartFilters };

function activeChips(filters, query) {
  const labels = {
    brand: "HÃ£ng",
    seats: "Sá»‘ chá»—",
    vehicleType: "Loáº¡i xe",
    transmission: "Há»™p sá»‘",
    fuel: "NhiÃªn liá»‡u",
    status: "Tráº¡ng thÃ¡i",
    location: "Ä‘á»‹a Ä‘iá»ƒm",
    maxPrice: "GiÃ¡ tá»‘i Ä‘a",
    driver: "TÃ i xáº¿",
    freeCharge: "Free sáº¡c"
  };
  const chips = Object.entries(filters)
    .filter(([key, v]) => v && key !== "owner" && !(Array.isArray(v) && v.length === 0))
    .map(([key, value]) => ({
      key,
      label: key === "maxPrice" ? `DÆ°á»›i ${formatCurrency(value)}/ngÃ y` : key === "freeCharge" ? "Chá»‰ xe Free sáº¡c" : `${labels[key]}: ${statusText(value)}`
    }));
  if (filters.owner) chips.push({ key: "owner", label: `Xe cá»§a: ${filters.owner.name}` });
  if (query) chips.unshift({ key: "query", label: query });
  return chips;
}

export { activeChips };

function validateCar(form, packageType = "full") {
  const errors = {};
  const year = Number(form.basicInfo.year);
  if (!form.basicInfo.name) errors["basicInfo.name"] = "Vui lÃ²ng nháº­p tÃªn xe.";
  if (!form.basicInfo.brand) errors["basicInfo.brand"] = "Vui lÃ²ng chá»n hÃ£ng xe.";
  if (!form.basicInfo.model) errors["basicInfo.model"] = "Vui lÃ²ng chá»n dÃ²ng xe.";
  if (!form.basicInfo.plate) {
    errors["basicInfo.plate"] = "Biá»ƒn sá»‘ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.";
  } else {
    const rawPlate = form.basicInfo.plate.replace(/[-.\s]/g, "").toUpperCase();
    if (!/^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$/.test(rawPlate)) {
      errors["basicInfo.plate"] = "Biá»ƒn sá»‘ khÃ´ng há»£p lá»‡ (VD: 51H12345).";
    }
  }
  if (!year || year > new Date().getFullYear() || year < 1990) errors["basicInfo.year"] = "NÄƒm sáº£n xuáº¥t pháº£i há»£p lá»‡.";
  if (!Number(form.basicInfo.seats)) errors["basicInfo.seats"] = "Sá»‘ chá»— pháº£i lÃ  sá»‘ há»£p lá»‡.";
  
  if (packageType !== "basic") {
    if (!form.technicalInfo.fuel) errors["technicalInfo.fuel"] = "Chá»n loáº¡i nhiÃªn liá»‡u.";
      
    if (!form.technicalInfo.transmission) errors["technicalInfo.transmission"] = "Chá»n há»™p sá»‘.";
      if (!form.technicalInfo.fuelConsumption) errors["technicalInfo.fuelConsumption"] = "Chá»n má»©c tiÃªu hao nhiÃªn liá»‡u.";
  }
  
  if (!Number(form.rentalInfo.dayPrice)) errors["rentalInfo.dayPrice"] = "GiÃ¡ thuÃª ngÃ y pháº£i lÃ  sá»‘ há»£p lá»‡.";
  if (!form.rentalInfo.pickupLocation) errors["rentalInfo.pickupLocation"] = "Vui lÃ²ng nháº­p Ä‘á»‹a Ä‘iá»ƒm nháº­n xe.";
  if (!form.ownerInfo?.name) errors["ownerInfo.name"] = "Vui lÃ²ng nháº­p tÃªn chá»§ xe.";
  if (!phoneDigits(form.ownerInfo?.phone).match(/^0?\d{9,11}$/)) errors["ownerInfo.phone"] = "SÄT chá»§ xe chÆ°a há»£p lá»‡.";
  return errors;
}

export { validateCar };

function getOwnerInfo(car) {
  return {
    name: car.ownerInfo?.name || "Anh Minh - Chá»§ xe",
    phone: car.ownerInfo?.phone || "090 123 4567",
    zaloPhone: car.ownerInfo?.zaloPhone || car.ownerInfo?.phone || "0901234567"
  };
}

export { getOwnerInfo };

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export { phoneDigits };

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export { blobToDataUrl };

function getAtPath(obj, path) {
  return path.split(".").reduce((v, k) => v?.[k], obj);
}

export { getAtPath };

function setAtPath(obj, path, value) {
  const copy = clone(obj);
  const parts = path.split(".");
  let pointer = copy;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!pointer[parts[i]]) pointer[parts[i]] = {};
    pointer = pointer[parts[i]];
  }
  pointer[parts.at(-1)] = value;
  return copy;
}

export { setAtPath };

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

export { clone };

function normalizeCarForm(car) {
  return {
    ...clone(emptyForm),
    ...clone(car),
    basicInfo: { ...emptyForm.basicInfo, ...clone(car.basicInfo || {}) },
    technicalInfo: { ...emptyForm.technicalInfo, ...clone(car.technicalInfo || {}) },
    rentalInfo: { ...emptyForm.rentalInfo, ...clone(car.rentalInfo || {}) },
    documents: { ...emptyForm.documents, ...clone(car.documents || {}) },
    descriptions: { ...emptyForm.descriptions, ...clone(car.descriptions || {}) },
    ownerInfo: { ...emptyForm.ownerInfo, ...clone(car.ownerInfo || {}) },
    status: { ...emptyForm.status, ...clone(car.status || {}) },
    images: clone(car.images || [])
  };
}

export { normalizeCarForm };

function normalize(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä‘/g, "d");
}

export { normalize };

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

export { unique };

function formatCurrency(value) {
  if (!value && value !== 0) return '';
  const n = Number(value);
  if (!n) return '';
  return n.toLocaleString('vi-VN') + 'Ä‘';
}

export { formatCurrency };

function fmtNum(value) {
  const n = Number(value);
  if (!n && n !== 0) return '';
  return n.toLocaleString('vi-VN');
}

export { fmtNum };

function statusText(value) {
  return {
    available: "CÃ²n trá»‘ng",
    rented: "Äang thuÃª",
    maintenance: "Báº£o dÆ°á»¡ng",
    hidden: "Táº¡m áº©n",
    true: "CÃ³ tÃ i xáº¿",
    false: "Tá»± lÃ¡i"
  }[value] || value;
}

export { statusText };

function formatBusyDates(blockedDates) {
  if (!blockedDates || !blockedDates.length) return null;
  const first = blockedDates[0];
  const start = typeof first === 'string' ? first : first.start;
  const end = typeof first === 'string' ? first : first.end;
  const tag = (typeof first === 'object' && first.tag === 'rented') ? 'KhÃ¡ch thuÃª' : 'Lá»‹ch báº­n';
  
  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1];
    return d;
  };

  let text = '';
  if (start && end && start !== end) {
    text = `${formatDate(start)} - ${formatDate(end)}`;
  } else if (start) {
    text = formatDate(start);
  } else {
    text = "CÃ³ lá»‹ch";
  }
  
  if (blockedDates.length > 1) {
    text += ` (+${blockedDates.length - 1})`;
  }
  return `${tag}: ${text}`;
}

export { formatBusyDates };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export { today };

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { delay };



export const uploadToImgBB = async (file) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || 'eafca81cff8a069dcd6db33b5aff5792';
  try {
    const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
    const compressedFile = await imageCompression(file, options);
    const base64Data = await imageCompression.getDataUrlFromFile(compressedFile);
    const base64Str = base64Data.split(',')[1];
    const formData = new FormData();
    formData.append('image', base64Str);
    
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error('Upload ImgBB th?t b?i');
    
    return {
      url: data.data.url,
      thumb_url: data.data.thumb ? data.data.thumb.url : data.data.url,
      name: file.name
    };
  } catch (err) {
    console.error('L?i upload ?nh:', err);
    throw err;
  }
};

function generateSlug(text) {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ä‘/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
export { generateSlug };
