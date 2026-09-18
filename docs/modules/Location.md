# Module: Location

**Đường dẫn**: `src/modules/Shared/Location.jsx`

## 1. Nhiệm Vụ Cốt Lõi (Responsibilities)
- Quản lý và phát triển các tính năng độc lập thuộc module Location.
- Cung cấp tính năng Bản đồ hiện đại (Mapbox) để hiển thị danh sách xe dưới dạng cụm (Clustering).
- Quản lý công cụ chọn tọa độ chính xác (MapboxLocationPicker) cho phép kéo thả ghim và lưu trữ `lat`, `lng`.

## 2. Liên Kết & Phụ Thuộc (Dependencies)
- **App.jsx / Overview.jsx**: Sử dụng `MapboxClusterViewer` để hiển thị Toggle View Danh sách/Bản đồ.
- **CarForm.jsx**: Sử dụng `MapboxLocationPicker` để chọn tọa độ xe khi đăng.
- **Account.jsx**: Sử dụng `MapboxLocationPicker` để thiết lập vị trí gốc của chủ xe.
- **Thư viện ngoài**: `mapbox-gl`, `react-map-gl`, `use-supercluster`, `supercluster`.

## 3. Trạng Thái Hiện Tại (Current State)
- **Tình trạng**: Đã tích hợp thành công Mapbox. 
- **Todo**: Khách hàng cần thêm API Key vào biến môi trường `VITE_MAPBOX_TOKEN`.

## 4. Nhật Ký Cập Nhật (Module Changelog)
> **LƯU Ý DÀNH CHO AI**: Mỗi khi kết thúc một cuộc hội thoại hoặc có thay đổi logic lớn, bạn BẮT BUỘC phải ghi chú lại vào đây bằng tiếng Việt ngắn gọn để đồng bộ với các AI ở luồng khác. Tránh lặp lại kiến thức đã có.

- [2026-09] Khởi tạo module. Đã cấu trúc kiến trúc đa luồng.
- [2026-09-18] Tích hợp hệ thống Mapbox, thay thế MapModal cũ. Bổ sung `MapboxLocationPicker` và `MapboxClusterViewer` (có gộp cụm). Cập nhật `App.jsx`, `Account.jsx`, `CarForm.jsx` để lưu và hiển thị toạ độ chính xác (lat, lng).
