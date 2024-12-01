import socketAuthMiddleware from '~/middleware/socketAuth.js';
import { handleSocketError } from '~/middleware/errorHandlingMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const rooms = {};

const setupSocketIO = (io) => {
    io.use((socket, next) => {
        socketAuthMiddleware(socket, (err) => {
            if (err) return handleSocketError(err, socket, next);
            next();
        });
    });

    io.on('connection', (socket) => {
        console.warn(`User connected:`, socket.user.id);

        socket.on('createRoom', () => {
            if (socket.user.accountType !== 'Premium') {
                return socket.emit('createRoomFailed', 'Please upgrade your account to perform this function.');
            }
            const roomId = uuidv4();
            rooms[roomId] = {
                host: socket.user.id,
                members: [socket.user.username],
                songState: { isPlaying: false, currentTime: 0 },
            };
            socket.join(roomId);
            socket.roomId = roomId;
            socket.emit('createRoomSuccess', roomId);
            io.to(roomId).emit('members', rooms[roomId].members);
        });

        socket.on('joinRoom', (roomId) => {
            if (socket.roomId && socket.roomId !== roomId) {
                return socket.emit('joinRoomFailed', 'Leave your current room before joining another.');
            }
            if (socket.roomId && socket.roomId === roomId) {
                return socket.emit('joinRoomFailed', 'You are in the room');
            }
            if (!rooms[roomId]) {
                return socket.emit('joinRoomFailed', 'Room does not exist.');
            }

            socket.join(roomId);
            socket.roomId = roomId;

            rooms[roomId].members.push(socket.user.username);
            socket.to(roomId).emit('memberJoined', { username: socket.user.username });
            socket.emit('joinRoomSuccess', { roomId, permit: false });
            io.to(roomId).emit('members', rooms[roomId].members);
        });

        socket.on('leaveRoom', () => {
            const roomId = socket.roomId;
            if (rooms[roomId]) {
                if (rooms[roomId].host === socket.user.id) {
                    socket.roomId = null;
                    socket.emit('leaveRoomSuccess');
                    io.to(roomId).emit('roomClosed');
                    delete rooms[roomId];
                } else {
                    socket.roomId = null;
                    socket.emit('leaveRoomSuccess');
                    const memberIndex = rooms[roomId].members.indexOf(socket.user.username);
                    if (memberIndex !== -1) {
                        rooms[roomId].members.splice(memberIndex, 1);
                    }
                    io.to(roomId).emit('members', rooms[roomId].members);
                }
            } else if (socket.roomId) {
                socket.roomId = null;
                socket.emit('leaveRoomSuccess');
            } else {
                socket.emit('leaveRoomFailed');
            }
        });

        socket.on('SyncAudio', (data) => {
            const roomId = socket.roomId;
            const room = rooms[roomId];
            rooms[roomId].songState.isPlaying = data.isPlaying;
            rooms[roomId].songState.currentTime = data.currentTime;
            socket
                .to(roomId)
                .emit('UpdateAudio', { isPlaying: room.songState.isPlaying, currentTime: room.songState.currentTime });
        });

        socket.on('disconnect', () => {
            console.error(`User disconnected:`, socket.user.id);
            const roomId = socket.roomId;
            if (!roomId) return;

            socket.leave(roomId);
            socket.roomId = null;

            const room = rooms[roomId];
            if (!room) return;

            if (room.host === socket.user.id) {
                io.to(roomId).emit('roomClosed');
                delete rooms[roomId];
            } else {
                room.members = room.members.filter((m) => m !== socket.user.username);
                io.to(roomId).emit('members', rooms[roomId].members);
                socket.to(roomId).emit('memberLeft', { username: socket.user.username });
            }
        });
    });
};

export default setupSocketIO;
