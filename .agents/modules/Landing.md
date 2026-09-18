# MODULE: LANDING (Trang chủ / Landing Page)

## 1. Trách nhiệm (Single Responsibility)
- Đóng vai trò là "Mặt tiền" (Landing Page) khi người dùng truy cập vào trang chủ `/`.
- Nhiệm vụ chính là thu hút (Convert) khách hàng bấm vào nút "Tìm Xe Tự Lái Ngay" hoặc "Đăng ký".
- Cung cấp các thông tin nổi bật: Tính năng, Lợi ích, Hướng dẫn sử dụng (How it works).
- Giao diện phải cực kỳ đẹp, chuẩn Marketing, mượt mà trên Mobile và Desktop.

## 2. Kiến trúc & Vị trí
- File gốc: `src/modules/Landing/LandingPage.jsx`
- Các component hỗ trợ (nếu có): `HeroSection`, `Features`, `Testimonials`, `Footer`.
- URL hoạt động: `/`
- CSS: Đặt trong file `styles.css` hoặc sử dụng inline styling/CSS Variables hiện có. Không tự tiện tạo thêm file CSS mới nếu không thật sự cần thiết.

## 3. Quy tắc cốt lõi (Anti-Corruption)
1. **Không chứa Logic Nặng:** Trang Landing chủ yếu là UI/UX. Không gọi các hàm lấy danh sách xe phức tạp ở đây (việc đó để trang `/trang-chu` - Overview lo).
2. **SEO & Hiệu suất:** Không sử dụng các thư viện hoạt ảnh (Animation) quá nặng làm chậm trang. Sử dụng CSS Animation hoặc `framer-motion` cơ bản.
3. **Responsive tuyệt đối:** Mọi chi tiết từ chữ, padding, nút bấm đều phải dùng đơn vị tương đối (clamp, %, vw, rem) hoặc Media Queries để đảm bảo không bị vỡ layout trên điện thoại.
