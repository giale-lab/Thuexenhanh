# AGENTS.md — Thuê Xe Nhanh Web App

> Tài liệu này dành cho các AI Agent (Gemini/Claude). Đọc kỹ TOÀN BỘ trước khi thực hiện bất kỳ thay đổi nào.

---

## 1. Mục Tiêu Tối Ưu & Triết Lý Code (CỐT LÕI)

- **Sửa chính xác lỗi cần sửa, không lan man:** Chỉ tập trung vào đúng vấn đề được yêu cầu, tuyệt đối không chỉnh sửa các file hoặc đoạn code không liên quan để tránh gây lỗi phụ.
- **Đồng bộ thông tin hiển thị:** Trong app sẽ có những thông tin dùng chung cần đồng bộ (ví dụ: data xe, filter). Chỉ dùng chính nguồn thông tin đó để hiển thị ở các chỗ khác nhau (tránh tạo ra nhiều luồng dữ liệu rời rạc).
- **Hiểu cấu trúc trước, quét lỗi sau:** Luôn phải nắm vững kiến trúc của file `App.jsx` và luồng dữ liệu trước khi đi tìm và sửa lỗi. Đừng vội vã thay thế code khi chưa hiểu bối cảnh.
- **Tối ưu điện thoại là Ưu Tiên Số 1:** Mọi UI/UX phải được thiết kế và kiểm tra để hiển thị hoàn hảo trên giao diện mobile (responsive, không bị vỡ layout, dễ bấm).
- **Dữ liệu lưu online (Firebase):** Hệ thống lưu trữ hoàn toàn trên Firebase (Firestore, Auth, Storage). Luôn lưu ý cấu trúc dữ liệu lưu online, phân quyền bảo mật (chỉ gắn `userId`/`ownerId` hợp lệ) khi thực hiện các tác vụ đọc/ghi.
- **Cẩn trọng với thay đổi lớn:** Khi có những thay đổi lớn về kiến trúc hoặc logic, phải suy nghĩ thật chắc chắn và lập kế hoạch rõ ràng để tránh phải hoàn lại phiên bản cũ (rollback).
- **UI/UX ngay ngắn, chuẩn xác:** Luôn ngay hàng thẳng lối. Phải thiết lập hệ thống margin, padding và grid thật chuẩn xác, gọn gàng, và thống nhất trên toàn app.

---

## 2. Kiến trúc tổng quan

### Tech Stack
- **Frontend**: React + Vite (SPA).
- **Backend (BaaS)**: Firebase (Auth Google OAuth, Firestore, Storage).
- **Styling**: Vanilla CSS tại `src/styles.css`, dùng CSS variables (`var(--m-...)`).
- **Icons**: `lucide-react`.
- **Deploy**: Chạy `npm run build:web`, sau đó upload trực tiếp nội dung trong thư mục `dist/` lên `public_html/` (DirectAdmin). Lưu ý: **không cần nén thành file zip**.

### Các Tích Hợp (Integrations)
- **Upload Ảnh (ImgBB)**: Dùng endpoint `https://api.imgbb.com/1/upload` với API Key là `eafca81cff8a069dcd6db33b5aff5792`.

---

## 3. Cấu trúc Module (MỚI)

Ứng dụng sử dụng cấu trúc React module chuẩn. App được chia thành các thư mục:
- `src/core/`: Chứa cấu hình Firebase, hằng số, hàm tiện ích.
- `src/contexts/`: Chứa React Context (`AppContext.jsx`) để quản lý state toàn cục.
- `src/modules/`: Chứa các Component theo tính năng (`Auth`, `Cars`, `Admin`, `Shared`).
- `src/App.jsx`: Đóng vai trò là Shell/Router, bọc các Context Provider và render module tương ứng.

> **CẢNH BÁO**: Các file `part1.jsx` đến `part5.jsx` đã bị xóa. KHÔNG DÙNG cấu trúc ghép file cũ.

---

## 4. Quy tắc chỉnh sửa Code (Anti-Corruption Rules)

### ❌ KHÔNG được làm:
1. **Không gom code thành một file khổng lồ**. Hãy giữ các module nhỏ gọn.
2. **Không dùng `.replace()` với regex quá rộng** (`[\s\S]*?`) trên các file lớn.
3. **Không apply nhiều patch liên tiếp mà không kiểm tra**.

### ✅ PHẢI làm:
1. **Luôn import đúng đường dẫn** giữa các module.
2. **Dùng `multi_replace_file_content`** với `StartLine`/`EndLine` cụ thể hoặc `write_to_file` để tạo file mới.
3. **Chạy `npm run build:web`** và kiểm tra output sau MỖI lần sửa file.

---

## 5. Các hàm/biến KHÔNG ĐƯỢC xóa

| Tên | Vị trí | Ghi chú |
|-----|--------|---------|
| `isWeekendRange(start, end)` | Sau import | Tính giá cuối tuần |
| `getCarWeight(car)` | Trước Overview | Sắp xếp xe ưu tiên |
| `sorters` (object) | Trước Overview | Logic sort danh sách |
| `inferSmartFilters(query)` | Trước Overview | Parse câu tìm kiếm tự nhiên |
| `activeChips(filters, query)` | Trước Overview | Render filter chips |
| `toggleFavorite` | Trong `App` | Lưu xe yêu thích vào Firestore + localStorage |

---

## 6. Luồng dữ liệu quan trọng

### Đồng bộ Dữ liệu Xe (Data Synchronization)
- **Quy tắc TỐI THƯỢNG**: Bất kỳ thông tin nào thêm vào form `AddCarForm` (Nhiên liệu, năm SX, số ghế...) đều phải được hiển thị và đồng bộ tương ứng ở các nơi:
  1. `AddCarForm` (Input form)
  2. `validateCar()` (Xác thực dữ liệu)
  3. `CarDetailModal` (Chi tiết cho khách xem)
  4. `CarCard` (Thẻ tóm tắt ở trang chủ)
  5. `Overview` (Bộ lọc tìm kiếm)

### Giá cuối tuần (`isWeekend`)
- Khai báo ngoài `useMemo` trong `Overview`:
  `const isWeekend = isWeekendRange(rentalTimeRange?.startDate, rentalTimeRange?.endDate);`
- Truyền prop `isWeekend` xuống `<CarCard>` và `<CarDetailModal>`.

### Auth Flow & Dữ liệu
1. `auth.onAuthStateChanged()` → Firestore check user doc.
2. Admin xác định qua `ADMIN_EMAILS`.
3. Khi tạo document mới (xe, báo cáo, đánh giá), **bắt buộc** phải gán `userId`/`ownerId = currentUser.uid`.
4. **Chuyển đổi vai trò & Hồ sơ:**
   - Khách xem thử (`isGuest=true`) không được phép sử dụng chế độ Chủ xe đầy đủ.
   - Khi chuyển sang Chủ xe lần đầu, hiển thị popup **OwnerWizard**.
   - Nếu hồ sơ đủ (có CCCD, SĐT, Email), khi hoàn tất popup, hệ thống sẽ lưu cờ `ownerWizardCompleted: true` lên Firestore để không hiển thị lại popup này ở các lần sau.
5. **Hệ thống Credit & Mở khóa SĐT:**
   - Dùng chung 1 quỹ Điểm chung cho toàn tài khoản. Miễn phí (0 Token) mỗi lần mở số điện thoại cho khách thuê (vì khách mang lại tiền).
   - Các xe đã mở SĐT được lưu trong mảng `unlockedCars` trên Firestore.
   - Nếu xe đã nằm trong `unlockedCars`, UI sẽ **tự động hiển thị ngay SĐT** (bỏ qua bước bấm "Liên hệ chủ xe"), và không trừ điểm lại.
6. **Đồng bộ Dữ liệu Local & Firestore (RẤT QUAN TRỌNG):**
   - Hàm `auth.onAuthStateChanged` **BẮT BUỘC** phải tải toàn bộ data từ Firestore bằng phép rải (spread operator `...data`) vào `currentUser`.
   - Tuyệt đối không chỉ pick lẻ tẻ vài trường (name, email), vì sẽ làm mất dữ liệu `credits`, `cccdNumber`, `unlockedCars` mỗi khi F5/reload trang.
7. **Cache & Deploy:**
   - SPA React/Vite luôn sinh ra tên file JS mới (hash).
   - Tuyệt đối không để trình duyệt hoặc Cloudflare cache file `index.html`. Luôn phải giữ các thẻ `<meta http-equiv="Cache-Control"...>` trong `index.html` để đảm bảo user tải bản cập nhật mới nhất.

---

## 7. Checklist Trọn Vẹn Một Task

- [ ] Hiểu cấu trúc file, vị trí cần sửa trước khi gõ lệnh thay đổi.
- [ ] Sửa trực tiếp, chính xác vấn đề (Không chỉnh sửa dư thừa).
- [ ] Giao diện (Grid, margin, padding) ngay ngắn, chuẩn xác.
- [ ] Kiểm tra ưu tiên UI Mobile (≤ 640px) hoạt động mượt mà.
- [ ] Data Firestore được cập nhật đồng bộ các trường liên quan.
- [ ] `npm run build:web` → Build thành công không lỗi.
