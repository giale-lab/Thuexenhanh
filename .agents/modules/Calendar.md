# MODULE: CALENDAR SYSTEM (Hệ thống Lịch & Chọn Ngày)

## 1. Trách nhiệm (Single Responsibility)
- Quản lý toàn bộ logic chọn ngày, giờ thuê xe và quản lý lịch bận (Blocked Dates) của chủ xe.
- Bao gồm các thành phần chính:
  - `DateTimePickerModal`: Popup chọn ngày/giờ bắt đầu và kết thúc (Dùng cho khách thuê và bộ lọc tìm kiếm).
  - `BlockedDatesManager`: Quản lý các ngày xe không trống (Dùng cho Chủ xe khi đăng/sửa xe).
  - `isWeekendRange`, `formatBusyDates`, `getDaysInMonth`... (trong `core.js`): Các hàm tiện ích xử lý logic ngày tháng.

## 2. Kiến trúc & Vị trí
- File gốc chứa UI Lịch: `src/modules/Cars/CarForm.jsx` (Chứa `DateTimePickerModal` và `BlockedDatesManager`).
- File tiện ích (Utils): `src/core.js` (chứa các hàm tính toán ngày).
- Styling: `styles.css` (Giao diện lịch hiện tại được xây dựng hoàn toàn bằng Grid CSS và Flexbox thuần, không dùng thư viện ngoài như react-datepicker).

## 3. Quy tắc cốt lõi (Anti-Corruption)
1. **Không Dùng Thư Viện Lịch Bên Ngoài:** Hệ thống hiện tại đang sử dụng logic Date thuần của Javascript để tối ưu dung lượng và hoàn toàn làm chủ UI. Tuyệt đối KHÔNG `npm install` các thư viện như `moment.js`, `date-fns` hay `react-datepicker` để tránh làm phình to (bloat) ứng dụng.
2. **Hiệu suất Render:** Lịch (Calendar) re-render rất nhiều lần mỗi khi user hover chuột qua các ngày (để tạo hiệu ứng in-range). Cần sử dụng `useMemo` cẩn thận hoặc tách component nhỏ để tránh giật lag trên điện thoại.
3. **Múi giờ (Timezone):** Tất cả ngày tháng được so sánh và lưu trữ phải chú ý đến múi giờ địa phương (Local Time, cụ thể là GMT+7 Việt Nam). Luôn `setHours(0,0,0,0)` khi so sánh các mốc ngày thuần túy.
