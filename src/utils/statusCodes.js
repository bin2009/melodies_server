const statusCodes = {
    0: 200, // OK - Thành công
    1: 201, // Created - Tạo mới thành công
    2: 204, // No Content - Thành công nhưng không có nội dung trả về
    3: 400, // Bad Request - Yêu cầu không hợp lệ
    4: 401, // Unauthorized - Chưa xác thực, cần đăng nhập
    5: 403, // Forbidden - Không có quyền truy cập
    6: 404, // Not Found - Không tìm thấy tài nguyên
    7: 409, // Conflict - Xung đột (ví dụ như dữ liệu đã tồn tại)
    8: 500, // Internal Server Error - Lỗi phía server
    9: 502, // Bad Gateway - Máy chủ trung gian nhận được phản hồi không hợp lệ từ upstream server
    10: 503, // Service Unavailable - Dịch vụ tạm thời không khả dụng
};

module.exports = statusCodes;
