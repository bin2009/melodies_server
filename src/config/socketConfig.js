import { authMiddleWare } from '~/middleware/authMiddleWare';
// import { roomService } from '~/services/roomService';
import roomService from '~/services/roomService';
// const roomOwners = [];
// const rooms = [];

export const configureSocket = (io) => {
    io.on('connection', (socket) => {
        // roomService.setSocketIO(socket);
        // console.log('a user connected', socket.id);
        console.log('rooms', io.sockets.adapter.rooms);

        socket.on('createRoom', async (baoloc) => {
            const { accessToken, data } = baoloc;
            console.log('gửi thành công', baoloc);

            // veriffy
            await authMiddleWare.verifyTokenSocket(accessToken, socket, (err) => {
                if (err) {
                    throw err;
                }
            });
            socket.join(socket.user.id);
            socket.ROOM = socket.user.id;
            socket.ROLE = 'host';
            socket.emit('CreateRoomSuccess', socket.user.id);
            console.log('rooms', io.sockets.adapter.rooms);
            // Nếu xác thực thành công
            console.log('User authenticated:', socket.user);
        });

        socket.on('JoinRoom', async (baoloc) => {
            const { accessToken, roomId } = baoloc;
            // veriffy
            await authMiddleWare.verifyTokenSocket(accessToken, socket, (err) => {
                if (err) {
                    throw err;
                }
            });

            const rooms = Array.from(io.sockets.adapter.rooms.keys());

            if (rooms.includes(roomId)) {
                socket.join(roomId);
                socket.ROOM = roomId;
                socket.ROLE = 'guest';
                console.log('rooms3', io.sockets.adapter.rooms);
                socket.emit('JoinRoomSuccess', { roomId: roomId, permit: false });

                // Lấy danh sách người dùng trong phòng
                const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                console.log('user in room: ', usersInRoom);
                const userIds = usersInRoom.map((socketId) => {
                    // Bạn có thể lưu thêm thông tin user với socketId nếu cần
                    const socket = io.sockets.sockets.get(socketId);
                    return {
                        user: socket.user,
                        role: socket.ROLE,
                    };
                });

                // Gửi danh sách người dùng trong phòng
                io.to(roomId).emit('Users', userIds);
                // io.to(roomId).emit('Users');
            } else {
                socket.emit('JoinRoomFailed', roomId);
            }
        });

        socket.on('SyncAudio', async ({ accessToken, currentTime, isPlaying }) => {
            // console.log('haha: ', accessToken, currentTime, isPlaying);
            await authMiddleWare.verifyTokenSocket(accessToken, socket, (err) => {
                if (err) {
                    throw err;
                }
            });
            // const rooms = Array.from(io.sockets.adapter.rooms.keys());
            socket.to(socket.user.id).emit('UpdateAudio', { currentTime: currentTime, isPlaying: isPlaying });
            // if (rooms.includes(socket.user.id)) {
            //     socket.to(socket.user.id).emit('UpdateAudio', { currentTime: currentTime, isPlaying: isPlaying });
            // } else {
            //     socket.emit('PermissionUpdateFail', false);
            // }
        });

        socket.on('SendMessage', async ({ accessToken, message }) => {
            await authMiddleWare.verifyTokenSocket(accessToken, socket, (err) => {
                if (err) {
                    throw err;
                }
            });
            io.sockets.in(socket.ROOM).emit('ServerSendMessage', { user: socket.user, message: message });
        });

        socket.on('disconnect', () => {
            console.log('user disconnected', socket.id);
        });

        socket.on('error', (err) => {
            console.error('Socket.IO error:', err.message);
        });
    });

    // Xử lý lỗi toàn cục cho server Socket.IO
    io.on('error', (err) => {
        console.error('Global Socket.IO error:', err.message);
    });
};
