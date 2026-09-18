# MODULE: ADMIN (AdminDashboard.jsx)

## 1. Trách nhiệm (Single Responsibility)
- Quản lý tổng quan hệ thống dành riêng cho tài khoản có quyền Quản trị viên (ADMIN_EMAILS).
- Cung cấp các tab tính năng: 
  - **Thống kê (Stats):** Lượt xem, lượt click liên hệ, tổng xe...
  - **Duyệt xe (Requests):** Phê duyệt xe chờ duyệt, từ chối xe.
  - **Người dùng (Users):** Quản lý danh sách user, cấp token (Cộng/trừ điểm).
  - **Báo cáo (Reports):** Xử lý báo cáo xe (Car Reports) và báo cáo cộng đồng (Community Reports).
  - **Góp ý (Feedbacks):** Xem góp ý từ người dùng.

## 2. Kiến trúc & Vị trí
- File gốc: src/modules/Admin/AdminDashboard.jsx.
- Route: /admin.
- Dữ liệu: Lấy trực tiếp từ Firestore collections: cars, users, requests, feedbacks, reports.
- UI: Sử dụng thư viện biểu đồ recharts để hiển thị thống kê.

## 3. Quy tắc cốt lõi (Anti-Corruption)
1. **Bảo mật:** Bất kỳ thao tác Ghi/Xóa/Sửa nào (duyệt xe, cộng tiền, xóa báo cáo) đều phải kiểm tra quyền (thường thao tác này diễn ra trên Firebase Rules, nhưng phía Frontend cần chặn UI nếu currentUser.role !== 'admin').
2. **Hiệu suất (Performance):** Data admin thường rất lớn. Sử dụng onSnapshot cẩn thận hoặc phân trang/giới hạn (limit) để tránh tải toàn bộ database xuống trình duyệt.
3. **Thao tác User:** Khi cộng/trừ Token cho user, phải dùng runTransaction hoặc kiểm tra chặt chẽ updateDoc để không ghi đè mất dữ liệu hiện tại của user.
