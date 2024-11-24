// import { roomService } from '~/services/roomService';
import roomService from '~/services/roomService';

const createRoom = async (req, res, next) => {
    try {
        console.log('user: ', req.user);
        const roomId = roomService.createRoomService(req.user);
        res.status(200).json({ roomId: roomId });
    } catch (error) {
        next(error);
    }
};

export const roomController = {
    createRoom,
};
