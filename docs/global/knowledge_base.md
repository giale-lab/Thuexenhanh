# TỔNG QUAN KIẾN THỨC APP (KNOWLEDGE BASE)

> **Mục đích:** Đây là trái tim của dự án. File này chứa toàn bộ định hướng kinh doanh, quy tắc cốt lõi và luồng hoạt động của "Thuê Xe Nhanh". Mọi AI Agent BẮT BUỘC phải đọc và bám sát triết lý này trước khi ra quyết định code. File này cần được cập nhật khi có thay đổi lớn về business logic.

---

## 1. App "Thuê Xe Nhanh" là gì?
- **Định nghĩa**: Một nền tảng (Web App SPA) kết nối trực tiếp chủ xe ô tô tự lái và người thuê xe.
- **Giá trị cốt lõi**:
  - Không qua trung gian, không thu phí hoa hồng (0%).
  - Chủ xe và người thuê tự thương lượng trực tiếp qua SĐT/Zalo.
  - Thao tác đăng xe và tìm xe phải siêu tốc (xong trong 1 phút).

## 2. Mục tiêu chiến lược (Scale-up)
- Đạt mốc **2000 xe** trên hệ thống trong vòng 1 năm.
- **Tiêu chí tối thượng**: Hệ thống phải "Nhanh - Gọn - Nhẹ". Tốc độ tải trang là số 1. Luôn ưu tiên trải nghiệm trên thiết bị di động (Mobile First).

## 3. Hệ thống Tiền tệ & Lợi nhuận (Monetization)
Ứng dụng thu lợi nhuận thông qua hệ thống **Token** (Tương tự cơ chế của Chợ Tốt).
- **Quy đổi cơ bản**: Mua Token bằng tiền thật (qua hệ thống PayOS).
- **Phí đăng xe**: Trừ **1 Token** cho mỗi lần đăng 1 xe mới.
- **Phí đẩy bài**: Trừ **1 Token** để đẩy bài lên trang đầu.
- **Chỉnh sửa**: Chỉnh sửa bài viết hoàn toàn miễn phí.
- **Hoàn tiền (Refund)**: Nếu chủ xe xóa bài đăng trong vòng **24 giờ** kể từ lúc tạo, hệ thống sẽ hoàn lại 1 Token.

## 4. Kiến trúc Hệ thống (Tech Stack & Architecture)
- **Frontend**: React + Vite. Kiến trúc tách làm 10 module độc lập theo miền (Cars, Auth, Payment, Shared). `App.jsx` đóng vai trò là Shell kết nối.
- **Backend (BaaS)**: Firebase (Authentication, Firestore Database). 
- **Lưu trữ Ảnh**: Sử dụng API của ImgBB. Khi upload, lưu đồng thời bản `thumb_url` (để hiện ngoài trang chủ/lướt) và `full_url` (để xem chi tiết) nhằm tối ưu băng thông.
- **Tương lai (VPS)**: Sẽ có một VPS Backend (Node.js) chạy ngầm để xử lý Webhook thanh toán PayOS và chạy Search Engine (Typesense/Algolia) thay cho tìm kiếm Firebase mặc định.

## 5. Luồng hoạt động chính (User Flows)
- **Khách thuê xe (Renter)**: Vào app -> Cuộn vô tận (Infinite Scroll) hoặc Tìm kiếm xe -> Xem thông tin/ảnh Thumb -> Bấm vào chi tiết tải ảnh Full -> Lấy SĐT -> Tự gọi chủ xe chốt deal.
- **Chủ xe (Owner)**: Đăng nhập Google -> Nạp Token -> Nhập thông tin & Upload ảnh xe -> Hệ thống trừ Token -> Xe xuất hiện trên chợ.
- **Phân quyền**: Có hệ thống Admin (định nghĩa qua mảng `ADMIN_EMAILS`) để duyệt/khóa xe khi cần.

---
*(Lưu ý cho AI: Nếu hệ thống có cập nhật mới về thanh toán, luật trừ điểm, hoặc kiến trúc VPS, hãy chủ động ghi thêm vào file này).*
