# Tối Ưu Token & Context

1. **Chỉ đọc những gì cần thiết**: Các AI chỉ dùng `grep_search` hoặc `view_file` những file thuộc module của mình.
2. **Sử dụng Công cụ Sửa Code**: Khi chỉnh sửa file cho người dùng, tuyệt đối không in lại toàn bộ file nếu chỉ sửa vài dòng. Sử dụng công cụ `replace_file_content` hoặc `write_to_file` để thực thi trực tiếp.
3. **Không lặp lại kiến thức**: Đọc file này một lần, không yêu cầu mô tả lại hệ thống ở mỗi câu lệnh.
4. **Ngắn gọn**: Trả lời thẳng vào vấn đề, bớt giải thích dài dòng trừ khi có thay đổi lớn.
