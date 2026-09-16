# Các Lỗi Thường Gặp (Known Issues)

1. **Lỗi Syntax khi Replace**: Không dùng regex replace bừa bãi trong file lớn vì có thể chèn nhầm vị trí, gây lỗi gãy thẻ JSX (đã từng xảy ra với file App.jsx).
2. **Mất Dữ Liệu User (Local vs Firestore)**: Hàm auth.onAuthStateChanged phải luôn lấy TOÀN BỘ dữ liệu Firestore rải (`...data`) vào currentUser, nếu không sẽ bị mất field credits hoặc unlockedCars mỗi khi reload trang.
3. **Lỗi Biến Chưa Khai Báo (ReferenceError)**: Chú ý khi tách module, các biến dùng chung (như LogoWhite, GuestAvatar) phải đổi sang đường dẫn string tuyệt đối (VD: `/guest-avatar.png`) thay vì import lỗi.
