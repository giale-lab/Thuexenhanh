# Module: CarForm

**Đường dẫn**: `src/modules/Cars/CarForm.jsx`

## 1. Nhiệm Vụ Cốt Lõi (Responsibilities)
- Quản lý và phát triển các tính năng độc lập thuộc module CarForm.
- (AI phụ trách module này tự điền chi tiết vào đây sau khi nhận việc).

## 2. Liên Kết & Phụ Thuộc (Dependencies)
- (Các module/component khác mà module này gọi tới)
- (Các Context/State dùng chung)

## 3. Trạng Thái Hiện Tại (Current State)
- **Tình trạng**: Đang khởi tạo...
- **Todo**: Tách code từ file cũ sang.

## 4. Nhật Ký Cập Nhật (Module Changelog)
> **LƯU Ý DÀNH CHO AI**: Mỗi khi kết thúc một cuộc hội thoại hoặc có thay đổi logic lớn, bạn BẮT BUỘC phải ghi chú lại vào đây bằng tiếng Việt ngắn gọn để đồng bộ với các AI ở luồng khác. Tránh lặp lại kiến thức đã có.

- [2026-09] Khởi tạo module. Đã cấu trúc kiến trúc đa luồng.
- [2026-09-18] Fix lỗi "bấm tạo xe mới nhảy qua cài đặt" ở `App.jsx` -> Chuyển hướng chính xác đến `/cai-dat/ho-so` thay vì menu cài đặt chung để người dùng điền thông tin định danh (CCCD, SĐT).
- [2026-09-18] Fix lỗi ReferenceError: BannerImagePC is not defined khi mở Onboarding Modal. Đã bổ sung import `BannerImagePC` và `BannerImageMobile` từ thư mục assets.
- [2026-09-18] Tạm thời bỏ qua bước kiểm tra hoàn thiện hồ sơ (`checkProfileForOwner`) khi bấm Thêm xe mới theo yêu cầu của user để tiện xem trước giao diện form.
