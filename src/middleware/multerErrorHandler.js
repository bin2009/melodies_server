// import multer from 'multer';

// const multerErrorHandler = (err, req, res, next) => {
//     if (err instanceof multer.MulterError) {
//         // Xử lý các lỗi đặc thù của multer
//         switch (err.code) {
//             case 'LIMIT_FILE_SIZE':
//                 return res.status(400).json({ message: 'File is too large. Maximum size is 30MB.' });
//             default:
//                 return res.status(500).json({ message: 'An error occurred during the upload.' });
//         }
//     } else if (err) {
//         // Xử lý lỗi khác
//         return res.status(400).json({ message: err.message });
//     }
//     next(); // Nếu không có lỗi, tiếp tục
// };

// export default multerErrorHandler;
