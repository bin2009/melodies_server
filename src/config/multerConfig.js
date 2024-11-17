import multer from 'multer';

export const audioUpload = multer({
    limits: {
        fileSize: 100 * 1024 * 1024, // Giới hạn dung lượng file audio là 10MB
    },
    fileFilter: (req, file, cb) => {
        console.log('file: ', file);
        if (file.mimetype === 'audio/mp4') {
            console.log(true);
            cb(null, true);
        } else {
            console.log(false);
            cb(null, false);
            cb(new Error('baoloc'));
        }
    },
});

export const imageUpload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn dung lượng file ảnh là 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'));
        }
    },
});

// Middleware xử lý lỗi
export const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Lỗi từ multer
        return res.status(400).json({ error: err.message });
    } else if (err) {
        // Lỗi khác
        return res.status(400).json({ error: err.message });
    }
    next();
};
