# Luật Tổng của App (Global Rules)

1. **Mobile First**: Giao diện luôn phải ưu tiên điện thoại, thiết kế Responsive, không vỡ layout.
2. **Tối ưu Component**: Hạn chế component render lại (dùng useMemo, useCallback).
3. **Giữ nguyên định dạng**: Tuyệt đối không thay đổi kiểu chữ, màu sắc (CSS Variables) cốt lõi nếu không có yêu cầu.
4. **Kiểm soát State**: Tránh đặt state ở quá cao nếu chỉ dùng nội bộ component.
5. **Bảo mật & Database**: Các query Firestore phải luôn gắn đúng userId/ownerId hợp lệ.
