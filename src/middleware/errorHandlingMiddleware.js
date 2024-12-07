import { StatusCodes } from 'http-status-codes';
import { env } from '~/config/environment';
import multer from 'multer';

export const errorHandlingMiddleware = (err, req, res, next) => {
    // if (err instanceof multer.MulterError) {
    //     return res.status(400).json({ error: err.message });
    // }
    if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    const responseError = {
        // statusCode: err.statusCode,
        // message: err.message || StatusCodes[err.statusCode],
        // stack: err.stack,

        status: 'error',
        message: err.message || StatusCodes[err.statusCode],
        error: {
            code: err.statusCode,
            details: err.stack,
        },
    };
    // console.error(responseError);

    // Chỉ khi môi trường là DEV thì mới trả về Stack Trace để debug dễ dàng hơn, còn không thì xóa đi.
    if (env.BUILD_MODE !== 'dev') delete responseError.stack;

    // Đoạn này có thể mở rộng nhiều về sau như ghi Error Log vào file, bắn thông báo lỗi vào group Slack, Telegram, Email...vv Hoặc có thể viết riêng Code ra một file Middleware khác tùy dự án.
    // ...
    // console.error(responseError)

    // Trả responseError về phía Front-end
    return res.status(responseError.error.code).json(responseError);
};

export const handleSocketError = (err, socket, next) => {
    console.error('Socket Error:', err.message);
    if (err.data && err.data.code) {
        socket.emit('errorToken', { code: err.data.code, message: err.data.message });
        socket.disconnect();
    }
    // next();
};
