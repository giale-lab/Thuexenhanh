�import imageCompression from 'browser-image-compression';
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

const colorOptions = ["Trắng", "Đen", "Bạc", "Đỏ", "Xám", "Xanh lam", "Vàng", "Nâu", "Khác"];

export { colorOptions };

const seatOptions = ["4", "5", "7", "9", "16", "29", "45"];

export { seatOptions };

const yearOptions = Array.from({length: new Date().getFullYear() - 1999}, (_, i) => (new Date().getFullYear() - i).toString());

export { yearOptions };

const bodyStyleOptions = ["Đô th�9", "Gia �ình", "Gầm cao", "Du l�9ch", "Công tác", "D�9ch vụ"];

export { bodyStyleOptions };

const AMENITY_OPTIONS = [
  "Bản �� VM", "Camera 360", "Cam hành trình", "Cam lùi", "Cảm biến l�p", "GPS", "ETC", "Túi khí", "L�p dự phòng", "Cảm biến va chạm", "Cửa s�" trời", "ADAS", "Ghế da"
];

export { AMENITY_OPTIONS };

const provinceDistricts = {
  "TP.HCM": ["Quận 1","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8","Quận 10","Quận 11","Quận 12","Bình Thạnh","Gò Vấp","Phú Nhuận","Tân Bình","Tân Phú","Bình Tân","Bình Chánh","Cần Giờ","Củ Chi","Hóc Môn","Nhà Bè","Thủ Đức","TP.Thủ Đức"],
  "Hà N�"i": ["Hoàn Kiếm","Ba Đình","Đ�ng Đa","Hai Bà Trưng","Hoàng Mai","Long Biên","Tây H�","Cầu Giấy","Thanh Xuân","Hà Đông","Đông Anh","Gia Lâm","Sóc Sơn","Từ Liêm","Thường Tín","Mê Linh"],
  "Đà Nẵng": ["Hải Châu","Thanh Khê","Liên ChiỒu","Ngũ Hành Sơn","Sơn Trà","Cẩm L�!","Hòa Vang"],
  "Hải Phòng": ["H�ng Bàng","Ngô Quyền","Lê Chân","Kiến An","Hải An","Đ� Sơn","Dương Kinh","Thuỷ Nguyên","An Dương","An Lão","Kiến Thụy","Tiên Lãng","Vĩnh Bảo","Cát Hải"],
  "Cần Thơ": ["Ninh Kiều","Bình Thủy","Cái RĒng","� Môn","Th�t N�t","Phong Điền","Cờ Đỏ","Th�:i Lai","Vĩnh Thạnh"]
};

export { provinceDistricts };

const locationProvinces = [
  "TP.HCM","Hà N�"i","Đà Nẵng","Hải Phòng","Cần Thơ",
  "Bà R�9a - Vũng Tàu","Bình Dương","Đ�ng Nai","Khánh Hòa","Lâm Đ�ng",
  "Quảng Ninh","Thanh Hóa","Ngh�! An","Thừa Thiên Huế","Quảng Nam",
  "Bình Đ�9nh","Phú Yên","Bình Thuận","Ninh Thuận","Gia Lai",
  "Đắk Lắk","Lào Cai","Vĩnh Phúc","Bắc Ninh","Hải Dương",
  "Hưng Yên","Nam Đ�9nh","Thái Bình","Ninh Bình","Long An",
  "Tiền Giang","Kiên Giang","An Giang","Sóc TrĒng","Cà Mau","Đắk Nông","Kon Tum","Bình Phư�:c","Tây Ninh"
];

export { locationProvinces };

const locationOptions = locationProvinces;

export { locationOptions };

const operatingAreaOptions = ["Hà N�"i", "TP.HCM", "Đà Nẵng", "Hà N�"i và t�0nh lân cận", "TP.HCM, Vũng Tàu, Đà Lạt", "Toàn qu�c"];

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
      fuel: "XĒng",
      engine: "",
    transmission: "S� tự ��"ng",
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
    condition: "T�t",
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
      title: "Thông tin cơ bản",
      description: "Tên xe, hãng, dòng xe và s� ch�.",
      fields: [
        ["basicInfo.brand", "Hãng xe", "select", true, brandOptions],
        ["basicInfo.model", "Dòng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.year", "NĒm sản xuất", "select", true, yearOptions],
        ["basicInfo.plate", "BiỒn s� xe", "text", true, null, "12A34567"],
        ["basicInfo.seats", "S� ch� ng�i", "select", true, seatOptions],
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "Giá cho thuê",
      description: "Giá theo ngày và ��9a �iỒm nhận xe.",
      fields: [
        ["rentalInfo.status", "Trạng thái", "select", true, [
          ["available", "Xe tr�ng"],
          ["busy", "Xe bận"]
        ]],
        ["rentalInfo.dayPrice", "Giá thuê theo ngày", "number", true],
        ["rentalInfo.weekendPrice", "Giá cu�i tuần", "number", false],
        ["rentalInfo.pickupLocation", "��9a �iỒm nhận xe", "select", true, locationOptions],
          ["rentalInfo.driverIncluded", "Có tài xế", "boolean"]
      ]
    },
          {
        module: "Module_RentalConditionsSection",
        title: "Điều ki�!n thuê",
        description: "Các yêu cầu bắt bu�"c ��i v�:i khách thuê.",
        fields: [
          ["rentalInfo.requireDeposit", "Yêu cầu �ặt cọc", "boolean"],
          ["rentalInfo.requireMotorbike", "Thế chấp xe máy", "boolean"],
          ["rentalInfo.requireLicense", "Đ�i chiếu GPLX", "boolean"]
        ]
      },
      {
        module: "Module_OwnerContactSection",
      title: "Thông tin chủ xe",
      description: "S� �i�!n thoại �Ồ khách liên h�!.",
      fields: [
        ["ownerInfo.name", "Tên chủ xe", "text", true],
        ["ownerInfo.phone", "SĐT chủ xe", "tel", true]
      ]
    }
  ];

  if (packageType === "basic") return basicFields;

  return [
    {
      module: "Module_BasicInfoSection",
      title: "Thông tin cơ bản",
      description: "Nhận di�!n xe, phân loại và các thông tin hiỒn th�9 chính.",
      fields: [
        ["basicInfo.brand", "Hãng xe", "select", true, brandOptions],
        ["basicInfo.model", "Dòng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.year", "NĒm sản xuất", "select", true, yearOptions],
        ["basicInfo.plate", "BiỒn s� xe", "text", true, null, "12A34567"],
        ["basicInfo.exteriorColor", "Màu xe", "select", false, colorOptions],
        ["basicInfo.seats", "S� ch� ng�i", "select", true, seatOptions],
        ["basicInfo.vehicleType", "Loại xe", "select", false, ["Sedan", "SUV", "MPV", "Hatchback", "Pickup", "Minivan"]]
      ]
    },
    {
      module: "Module_TechnicalInfoSection",
      title: "Thông tin kỹ thuật",
      description: "Thông s� vận hành giúp lọc và tư vấn xe chính xác.",
      fields: [
        ["technicalInfo.fuel", "Loại nhiên li�!u", "select", true, ["XĒng", "Dầu Diesel", "Hybrid", "Đi�!n"]],
        ...(form.technicalInfo?.fuel === "Đi�!n" ? [
          ["technicalInfo.engine", "Mã lực / Moment xoắn", "select", false, ["Dư�:i 150 HP", "150 - 10 HP", "200 - 300 HP", "Trên 300 HP"]],
          ["technicalInfo.fuelConsumption", "Mức tiêu hao (km / 1% pin)", "select", true, ["Dư�:i 3 km/1%", "3 - 5 km/1%", "5 - 7 km/1%", "Trên 7 km/1%"]]
        ] : [
          ["technicalInfo.engine", "Dung tích ��"ng cơ", "select", false, ["1.0L", "1.5L", "2.0L", "2.0L Bi-Turbo", "2.4L", "2.5L"]],
          ["technicalInfo.fuelConsumption", "Mức tiêu hao nhiên li�!u", "select", true, ["4-5L/100km", "5-6L/100km", "6-7L/100km", "7-8L/100km", "8L+/100km"]]
        ]),
        ["technicalInfo.transmission", "H�"p s�", "select", true, ["S� tự ��"ng", "S� sàn"]],
        ["technicalInfo.drivetrain", "H�! dẫn ��"ng", "select", false, ["FWD", "RWD", "AWD", "4WD"]]
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "Thông tin cho thuê",
      description: "Giá, �iều ki�!n, khu vực hoạt ��"ng và trạng thái khai thác.",
      fields: [
        ["rentalInfo.status", "Trạng thái cho thuê", "select", true, [
          ["available", "Xe tr�ng"],
          ["busy", "Xe bận"]
        ]],
        ["rentalInfo.dayPrice", "Giá thuê theo ngày", "number", true],
        ["rentalInfo.weekendPrice", "Giá cu�i tuần", "number", false],
        ["rentalInfo.pickupLocation", "��9a �iỒm nhận xe", "select", true, locationOptions],
          ["rentalInfo.dailyKmLimit", "Gi�:i hạn km m�i ngày", "number"],
          ["rentalInfo.overKmFee", "Phí vượt/km", "number"],
          ["rentalInfo.extraOptions", "", "extra_options_group"],
        ...(form.technicalInfo?.fuel === "Đi�!n" ? [["rentalInfo.chargeFee", "Phí sạc pin (VNĐ/1%)", "toggle_number"], ["rentalInfo.freeCharge", "Mi�&n phí sạc pin (km)", "toggle_number"]] : [])
      ]
    },
          {
        module: "Module_RentalConditionsSection",
        title: "Điều ki�!n thuê",
        description: "Các yêu cầu bắt bu�"c ��i v�:i khách thuê.",
        fields: [
          ["rentalInfo.requireDeposit", "Yêu cầu �ặt cọc", "boolean"],
          ["rentalInfo.requireMotorbike", "Thế chấp xe máy", "boolean"],
          ["rentalInfo.requireLicense", "Đ�i chiếu GPLX", "boolean"]
        ]
      },
      {
        module: "Module_OwnerContactSection",
      title: "Thông tin chủ xe",
      description: "S� �i�!n thoại �Ồ khách liên h�!.",
      fields: [
        ["ownerInfo.name", "Tên chủ xe", "text", true],
        ["ownerInfo.phone", "SĐT chủ xe", "tel", true]
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

const VN_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ NĒm', 'Thứ Sáu', 'Thứ Bảy'];

export { VN_DAYS };

const fmtRangeDate = (key) => {
  if (!key) return '';
  const d = new Date(key + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} (${VN_DAYS[d.getDay()]})`;
};

export { fmtRangeDate };

const fmtRangeLabel = (r) => r.start === r.end
  ? fmtRangeDate(r.start)
  : `${fmtRangeDate(r.start)} � ${fmtRangeDate(r.end)}`;

export { fmtRangeLabel };

const getCarWeight = (car) => {
  let weight = 1;
  if (car.status?.isDemo) weight = 2;
  if (car.status?.isVerified) weight = 3;
  // Ưu tiên hiỒn th�9 trên cùng (Chạy Ads / Đẩy tin)
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
  if (text.includes("tu dong")) inferred.transmission = "S� tự ��"ng";
  if (text.includes("so san")) inferred.transmission = "S� sàn";
  if (text.includes("suv")) inferred.vehicleType = "SUV";
  if (text.includes("sedan")) inferred.vehicleType = "Sedan";
  if (text.includes("xang")) inferred.fuel = "XĒng";
  if (text.includes("diesel")) inferred.fuel = "Diesel";
  if (text.includes("hybrid")) inferred.fuel = "Hybrid";
  if (text.includes("dien")) inferred.fuel = "Đi�!n";
  if (text.includes("free sac") || text.includes("sac mien phi")) {
    inferred.fuel = "Đi�!n";
    inferred.freeCharge = "true";
  }
  if (text.includes("con trong") || text.includes("ranh")) inferred.status = "available";
  if (text.includes("bao duong")) inferred.status = "maintenance";
  if (text.includes("ha noi")) inferred.location = "Hà N�"i";
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
    brand: "Hãng",
    seats: "S� ch�",
    vehicleType: "Loại xe",
    transmission: "H�"p s�",
    fuel: "Nhiên li�!u",
    status: "Trạng thái",
    location: "��9a �iỒm",
    maxPrice: "Giá t�i �a",
    driver: "Tài xế",
    freeCharge: "Free sạc"
  };
  const chips = Object.entries(filters)
    .filter(([key, v]) => v && key !== "owner" && !(Array.isArray(v) && v.length === 0))
    .map(([key, value]) => ({
      key,
      label: key === "maxPrice" ? `Dư�:i ${formatCurrency(value)}/ngày` : key === "freeCharge" ? "Ch�0 xe Free sạc" : `${labels[key]}: ${statusText(value)}`
    }));
  if (filters.owner) chips.push({ key: "owner", label: `Xe của: ${filters.owner.name}` });
  if (query) chips.unshift({ key: "query", label: query });
  return chips;
}

export { activeChips };

function validateCar(form, packageType = "full") {
  const errors = {};
  const year = Number(form.basicInfo.year);
  if (!form.basicInfo.name) errors["basicInfo.name"] = "Vui lòng nhập tên xe.";
  if (!form.basicInfo.brand) errors["basicInfo.brand"] = "Vui lòng chọn hãng xe.";
  if (!form.basicInfo.model) errors["basicInfo.model"] = "Vui lòng chọn dòng xe.";
  if (!form.basicInfo.plate) {
    errors["basicInfo.plate"] = "BiỒn s� không �ược �Ồ tr�ng.";
  } else {
    const rawPlate = form.basicInfo.plate.replace(/[-.\s]/g, "").toUpperCase();
    if (!/^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$/.test(rawPlate)) {
      errors["basicInfo.plate"] = "BiỒn s� không hợp l�! (VD: 51H12345).";
    }
  }
  if (!year || year > new Date().getFullYear() || year < 1990) errors["basicInfo.year"] = "NĒm sản xuất phải hợp l�!.";
  if (!Number(form.basicInfo.seats)) errors["basicInfo.seats"] = "S� ch� phải là s� hợp l�!.";
  
  if (packageType !== "basic") {
    if (!form.technicalInfo.fuel) errors["technicalInfo.fuel"] = "Chọn loại nhiên li�!u.";
      
    if (!form.technicalInfo.transmission) errors["technicalInfo.transmission"] = "Chọn h�"p s�.";
      if (form.technicalInfo.fuel !== '� i�!n' && !form.technicalInfo.fuelConsumption) errors["technicalInfo.fuelConsumption"] = "Chọn mức tiêu hao nhiên li�!u.";
  }
  
  if (!Number(form.rentalInfo.dayPrice)) errors["rentalInfo.dayPrice"] = "Giá thuê ngày phải là s� hợp l�!.";
  if (!form.rentalInfo.pickupLocation) errors["rentalInfo.pickupLocation"] = "Vui lòng nhập ��9a �iỒm nhận xe.";
  if (!form.ownerInfo?.name) errors["ownerInfo.name"] = "Vui lòng nhập tên chủ xe.";
  if (!phoneDigits(form.ownerInfo?.phone).match(/^0?\d{9,11}$/)) errors["ownerInfo.phone"] = "SĐT chủ xe chưa hợp l�!.";
  return errors;
}

export { validateCar };

function getOwnerInfo(car) {
  return {
    name: car.ownerInfo?.name || "Anh Minh - Chủ xe",
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
    .replace(/�/g, "d");
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
  return n.toLocaleString('vi-VN') + '�';
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
    available: "Còn tr�ng",
    rented: "Đang thuê",
    maintenance: "Bảo dưỡng",
    hidden: "Tạm ẩn",
    true: "Có tài xế",
    false: "Tự lái"
  }[value] || value;
}

export { statusText };

function formatBusyDates(blockedDates) {
  if (!blockedDates || !blockedDates.length) return null;
  const first = blockedDates[0];
  const start = typeof first === 'string' ? first : first.start;
  const end = typeof first === 'string' ? first : first.end;
  const tag = (typeof first === 'object' && first.tag === 'rented') ? 'Khách thuê' : 'L�9ch bận';
  
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
    text = "Có l�9ch";
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
    .replace(/�/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
export { generateSlug };
