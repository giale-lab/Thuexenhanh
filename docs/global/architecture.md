# Kiến trúc Tích hợp Liền Mạch (Architecture)

1. **Độc lập tính năng (Isolation)**: Mỗi module (VD: Auth, Cars) chỉ giải quyết bài toán của mình. Tuyệt đối không để Cars trực tiếp can thiệp Auth.
2. **Giao tiếp qua Props & Context**: 
   - Hệ thống dùng `App.jsx` làm Shell (Vỏ ngoài) để quản lý State toàn cục và truyền Props xuống các module.
   - Dữ liệu user hiện tại được truyền qua biến `currentUser`.
3. **Dùng chung UI**: Mọi module phải import sử dụng `src/modules/Shared/UIKit.jsx` (ví dụ Nút bấm, Field nhập liệu) để giao diện luôn đồng nhất 100% trên toàn App.
