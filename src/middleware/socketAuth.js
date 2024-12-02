import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { userService } from '~/services/userService';
import ApiError from '~/utils/ApiError';

const SECRET_KEY = 'your_secret_key';

const socketAuthMiddleware = async (socket, next) => {
    const token = socket.handshake.auth.accessToken;
    if (!token) {
        const error = new Error('Token not provided');
        error.data = { code: 401, message: 'Authentication required' };
        return next(error);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await userService.getInfoUserService(decoded);
        socket.user = user; // Lưu userId vào socket
        next();
    } catch (err) {
        const error = new ApiError(StatusCodes.UNAUTHORIZED, err.message);
        error.data = { code: error.statusCode, message: error.message };
        next(error);
    }
};

export default socketAuthMiddleware;
