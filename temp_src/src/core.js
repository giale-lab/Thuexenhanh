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

const bodyStyleOptions = ["Đô thị", "Gia đình", "Gầm cao", "Du lịch", "Công tác", "Dịch vụ"];

export { bodyStyleOptions };

const AMENITY_OPTIONS = [
  "Bản đồ VM", "Camera 360", "Cam hành trình", "Cam lùi", "Cảm biến lốp", "GPS", "ETC", "Túi khí", "Lốp dự phòng", "Cảm biến va chạm", "Cửa sổ trời", "ADAS", "Ghế da"
];

export { AMENITY_OPTIONS };

const provinceDistricts = {
  "TP.HCM": ["Quận 1","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8","Quận 10","Quận 11","Quận 12","Bình Thạnh","Gò Vấp","Phú Nhuận","Tân Bình","Tân Phú","Bình Tân","Bình Chánh","Cần Giờ","Củ Chi","Hóc Môn","Nhà Bè","Thủ Đức","TP.Thủ Đức"],
  "Hà Nội": ["Hoàn Kiếm","Ba Đình","Đống Đa","Hai Bà Trưng","Hoàng Mai","Long Biên","Tây Hồ","Cầu Giấy","Thanh Xuân","Hà Đông","Đông Anh","Gia Lâm","Sóc Sơn","Từ Liêm","Thường Tín","Mê Linh"],
  "Đà Nẵng": ["Hải Châu","Thanh Khê","Liên Chiểu","Ngũ Hành Sơn","Sơn Trà","Cẩm Lệ","Hòa Vang"],
  "Hải Phòng": ["Hồng Bàng","Ngô Quyền","Lê Chân","Kiến An","Hải An","Đồ Sơn","Dương Kinh","Thuỷ Nguyên","An Dương","An Lão","Kiến Thụy","Tiên Lãng","Vĩnh Bảo","Cát Hải"],
  "Cần Thơ": ["Ninh Kiều","Bình Thủy","Cái Răng","Ô Môn","Thốt Nốt","Phong Điền","Cờ Đỏ","Thới Lai","Vĩnh Thạnh"]
};

export { provinceDistricts };

const locationProvinces = [
  "TP.HCM","Hà Nội","Đà Nẵng","Hải Phòng","Cần Thơ",
  "Bà Rịa - Vũng Tàu","Bình Dương","Đồng Nai","Khánh Hòa","Lâm Đồng",
  "Quảng Ninh","Thanh Hóa","Nghệ An","Thừa Thiên Huế","Quảng Nam",
  "Bình Định","Phú Yên","Bình Thuận","Ninh Thuận","Gia Lai",
  "Đắk Lắk","Lào Cai","Vĩnh Phúc","Bắc Ninh","Hải Dương",
  "Hưng Yên","Nam Định","Thái Bình","Ninh Bình","Long An",
  "Tiền Giang","Kiên Giang","An Giang","Sóc Trăng","Cà Mau","Đắk Nông","Kon Tum","Bình Phước","Tây Ninh"
];

export { locationProvinces };

const locationOptions = locationProvinces;

export { locationOptions };

const operatingAreaOptions = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hà Nội và tỉnh lân cận", "TP.HCM, Vũng Tàu, Đà Lạt", "Toàn quốc"];

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
      fuel: "Xăng",
      engine: "",
    transmission: "Số tự động",
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
    condition: "Tốt",
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
      description: "Tên xe, hãng, dòng xe và số chỗ.",
      fields: [
        ["basicInfo.brand", "Hãng xe", "select", true, brandOptions],
        ["basicInfo.model", "Dòng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.year", "Năm sản xuất", "select", true, yearOptions],
        ["basicInfo.plate", "Biển số xe", "text", true, null, "12A34567"],
        ["basicInfo.seats", "Số chỗ ngồi", "select", true, seatOptions],
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "Giá cho thuê",
      description: "Giá theo ngày và địa điểm nhận xe.",
      fields: [
        ["rentalInfo.status", "Trạng thái", "select", true, [
          ["available", "Xe trống"],
          ["busy", "Xe bận"]
        ]],
        ["rentalInfo.dayPrice", "Giá thuê theo ngày", "number", true],
        ["rentalInfo.weekendPrice", "Giá cuối tuần", "number", false],
        ["rentalInfo.pickupLocation", "Địa điểm nhận xe", "select", true, locationOptions],
          ["rentalInfo.driverIncluded", "Có tài xế", "boolean"]
      ]
    },
          {
        module: "Module_RentalConditionsSection",
        title: "Điều kiện thuê",
        description: "Các yêu cầu bắt buộc đối với khách thuê.",
        fields: [
          ["rentalInfo.requireDeposit", "Yêu cầu đặt cọc", "boolean"],
          ["rentalInfo.requireMotorbike", "Thế chấp xe máy", "boolean"],
          ["rentalInfo.requireLicense", "Đối chiếu GPLX", "boolean"]
        ]
      },
      {
        module: "Module_OwnerContactSection",
      title: "Thông tin chủ xe",
      description: "Số điện thoại để khách liên hệ.",
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
      description: "Nhận diện xe, phân loại và các thông tin hiển thị chính.",
      fields: [
        ["basicInfo.brand", "Hãng xe", "select", true, brandOptions],
        ["basicInfo.model", "Dòng xe", "select", true, carModelsData[form.basicInfo.brand] || []],
        ["basicInfo.year", "Năm sản xuất", "select", true, yearOptions],
        ["basicInfo.plate", "Biển số xe", "text", true, null, "12A34567"],
        ["basicInfo.exteriorColor", "Màu xe", "select", false, colorOptions],
        ["basicInfo.seats", "Số chỗ ngồi", "select", true, seatOptions],
        ["basicInfo.vehicleType", "Loại xe", "select", false, ["Sedan", "SUV", "MPV", "Hatchback", "Pickup", "Minivan"]]
      ]
    },
    {
      module: "Module_TechnicalInfoSection",
      title: "Thông tin kỹ thuật",
      description: "Thông số vận hành giúp lọc và tư vấn xe chính xác.",
      fields: [
        ["technicalInfo.fuel", "Loại nhiên liệu", "select", true, ["Xăng", "Dầu Diesel", "Hybrid", "Điện"]],
        ...(form.technicalInfo?.fuel === "Điện" ? [
          ["technicalInfo.engine", "Mã lực / Moment xoắn", "select", false, ["Dưới 150 HP", "150 - 200 HP", "200 - 300 HP", "Trên 300 HP"]],
          ["technicalInfo.fuelConsumption", "Mức tiêu hao (km / 1% pin)", "select", true, ["Dưới 3 km/1%", "3 - 5 km/1%", "5 - 7 km/1%", "Trên 7 km/1%"]]
        ] : [
          ["technicalInfo.engine", "Dung tích động cơ", "select", false, ["1.0L", "1.5L", "2.0L", "2.0L Bi-Turbo", "2.4L", "2.5L"]],
          ["technicalInfo.fuelConsumption", "Mức tiêu hao nhiên liệu", "select", true, ["4-5L/100km", "5-6L/100km", "6-7L/100km", "7-8L/100km", "8L+/100km"]]
        ]),
        ["technicalInfo.transmission", "Hộp số", "select", true, ["Số tự động", "Số sàn"]],
        ["technicalInfo.drivetrain", "Hệ dẫn động", "select", false, ["FWD", "RWD", "AWD", "4WD"]]
      ]
    },
    {
      module: "Module_RentalInfoSection",
      title: "Thông tin cho thuê",
      description: "Giá, điều kiện, khu vực hoạt động và trạng thái khai thác.",
      fields: [
        ["rentalInfo.status", "Trạng thái cho thuê", "select", true, [
          ["available", "Xe trống"],
          ["busy", "Xe bận"]
        ]],
        ["rentalInfo.dayPrice", "Giá thuê theo ngày", "number", true],
        ["rentalInfo.weekendPrice", "Giá cuối tuần", "number", false],
        ["rentalInfo.pickupLocation", "Địa điểm nhận xe", "select", true, locationOptions],
          ["rentalInfo.dailyKmLimit", "Giới hạn km mỗi ngày", "number"],
          ["rentalInfo.overKmFee", "Phí vượt/km", "number"],
          ["rentalInfo.extraOptions", "", "extra_options_group"],
        ...(form.technicalInfo?.fuel === "Điện" ? [["rentalInfo.chargeFee", "Phí sạc pin (VNĐ/1%)", "toggle_number"], ["rentalInfo.freeCharge", "Miễn phí sạc pin (km)", "toggle_number"]] : [])
      ]
    },
          {
        module: "Module_RentalConditionsSection",
        title: "Điều kiện thuê",
        description: "Các yêu cầu bắt buộc đối với khách thuê.",
        fields: [
          ["rentalInfo.requireDeposit", "Yêu cầu đặt cọc", "boolean"],
          ["rentalInfo.requireMotorbike", "Thế chấp xe máy", "boolean"],
          ["rentalInfo.requireLicense", "Đối chiếu GPLX", "boolean"]
        ]
      },
      {
        module: "Module_OwnerContactSection",
      title: "Thông tin chủ xe",
      description: "Số điện thoại để khách liên hệ.",
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

const VN_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export { VN_DAYS };

const fmtRangeDate = (key) => {
  if (!key) return '';
  const d = new Date(key + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} (${VN_DAYS[d.getDay()]})`;
};

export { fmtRangeDate };

const fmtRangeLabel = (r) => r.start === r.end
  ? fmtRangeDate(r.start)
  : `${fmtRangeDate(r.start)} – ${fmtRangeDate(r.end)}`;

export { fmtRangeLabel };

const getCarWeight = (car) => {
  let weight = 1;
  if (car.status?.isDemo) weight = 2;
  if (car.status?.isVerified) weight = 3;
  // Ưu tiên hiển thị trên cùng (Chạy Ads / Đẩy tin)
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
  if (text.includes("tu dong")) inferred.transmission = "Số tự động";
  if (text.includes("so san")) inferred.transmission = "Số sàn";
  if (text.includes("suv")) inferred.vehicleType = "SUV";
  if (text.includes("sedan")) inferred.vehicleType = "Sedan";
  if (text.includes("xang")) inferred.fuel = "Xăng";
  if (text.includes("diesel")) inferred.fuel = "Diesel";
  if (text.includes("hybrid")) inferred.fuel = "Hybrid";
  if (text.includes("dien")) inferred.fuel = "Điện";
  if (text.includes("free sac") || text.includes("sac mien phi")) {
    inferred.fuel = "Điện";
    inferred.freeCharge = "true";
  }
  if (text.includes("con trong") || text.includes("ranh")) inferred.status = "available";
  if (text.includes("bao duong")) inferred.status = "maintenance";
  if (text.includes("ha noi")) inferred.location = "Hà Nội";
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
    seats: "Số chỗ",
    vehicleType: "Loại xe",
    transmission: "Hộp số",
    fuel: "Nhiên liệu",
    status: "Trạng thái",
    location: "Địa điểm",
    maxPrice: "Giá tối đa",
    driver: "Tài xế",
    freeCharge: "Free sạc"
  };
  const chips = Object.entries(filters)
    .filter(([key, v]) => v && key !== "owner" && !(Array.isArray(v) && v.length === 0))
    .map(([key, value]) => ({
      key,
      label: key === "maxPrice" ? `Dưới ${formatCurrency(value)}/ngày` : key === "freeCharge" ? "Chỉ xe Free sạc" : `${labels[key]}: ${statusText(value)}`
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
    errors["basicInfo.plate"] = "Biển số không được để trống.";
  } else {
    const rawPlate = form.basicInfo.plate.replace(/[-.\s]/g, "").toUpperCase();
    if (!/^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$/.test(rawPlate)) {
      errors["basicInfo.plate"] = "Biển số không hợp lệ (VD: 51H12345).";
    }
  }
  if (!year || year > new Date().getFullYear() || year < 1990) errors["basicInfo.year"] = "Năm sản xuất phải hợp lệ.";
  if (!Number(form.basicInfo.seats)) errors["basicInfo.seats"] = "Số chỗ phải là số hợp lệ.";
  
  if (packageType !== "basic") {
    if (!form.technicalInfo.fuel) errors["technicalInfo.fuel"] = "Chọn loại nhiên liệu.";
      
    if (!form.technicalInfo.transmission) errors["technicalInfo.transmission"] = "Chọn hộp số.";
      if (!form.technicalInfo.fuelConsumption) errors["technicalInfo.fuelConsumption"] = "Chọn mức tiêu hao nhiên liệu.";
  }
  
  if (!Number(form.rentalInfo.dayPrice)) errors["rentalInfo.dayPrice"] = "Giá thuê ngày phải là số hợp lệ.";
  if (!form.rentalInfo.pickupLocation) errors["rentalInfo.pickupLocation"] = "Vui lòng nhập địa điểm nhận xe.";
  if (!form.ownerInfo?.name) errors["ownerInfo.name"] = "Vui lòng nhập tên chủ xe.";
  if (!phoneDigits(form.ownerInfo?.phone).match(/^0?\d{9,11}$/)) errors["ownerInfo.phone"] = "SĐT chủ xe chưa hợp lệ.";
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
    .replace(/đ/g, "d");
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
  return n.toLocaleString('vi-VN') + 'đ';
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
    available: "Còn trống",
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
  const tag = (typeof first === 'object' && first.tag === 'rented') ? 'Khách thuê' : 'Lịch bận';
  
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
    text = "Có lịch";
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

