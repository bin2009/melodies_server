import socketAuthMiddleware from '~/middleware/socketAuth.js';
import { handleSocketError } from '~/middleware/errorHandlingMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import db from '~/models';
import { userService } from '~/services/userService';

const rooms = new Map();
const userSockets = new Map(); // Track user's active sockets
let ioRoot;

const setupSocketIO = (io) => {
    ioRoot = io;
    io.use((socket, next) => {
        socketAuthMiddleware(socket, (err) => {
            if (err) return handleSocketError(err, socket, next);
            next();
        });
    });

    io.on('connection', async (socket) => {
        if (!socket.user) return;

        const userId = socket.user.id;
        // Track user's sockets
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        const user = await userService.getInfoUserService(socket.user);

        socket.on('createRoom', () => {
            if (socket.user.accountType !== 'PREMIUM') {
                return socket.emit('createRoomFailed', 'Please upgrade to premium.');
            }

            if (isUserInAnyRoom(userId)) {
                return socket.emit('createRoomFailed', 'You are already in a room.');
            }

            const roomId = uuidv4();
            const room = {
                id: roomId,
                host: userId,
                members: new Set([userId]),
                max: user.package[0].room ?? 0,
                currentSong: {
                    song: null,
                    isPlaying: false,
                    currentTime: 0,
                },
                waitingList: [],
                proposalList: [],
                timestamp: Date.now(),
            };

            rooms.set(roomId, room);
            socket.join(roomId);
            socket.roomId = roomId;
            socket.emit('createRoomSuccess', roomId);
        });

        socket.on('joinRoom', (roomId) => {
            const room = rooms.get(roomId);
            if (!room) {
                return socket.emit('joinRoomFailed', 'Room not found');
            }

            if (room.members.size >= room.max) {
                return socket.emit('joinRoomFailed', 'Room is full');
            }

            const currentRoom = getCurrentUserRoom(userId);
            if (currentRoom && currentRoom !== roomId) {
                leaveRoom(socket, currentRoom);
            }

            if (!room.members.has(userId)) {
                room.members.add(userId);
                socket.join(roomId);
                socket.roomId = roomId;

                broadcastToRoom(io, roomId, 'memberJoined', {
                    user: socket.user,
                    members: Array.from(room.members),
                });

                socket.emit('joinRoomSuccess', {
                    roomData: getRoomData(room),
                    isHost: room.host === userId,
                });
            } else {
                socket.join(roomId);
                socket.roomId = roomId;
                socket.emit('roomData', getRoomData(room));
            }
        });

        socket.on('leaveRoom', () => {
            if (!socket.roomId) return;
            leaveRoom(socket, socket.roomId);
        });

        socket.on('SyncAudio', (data) => {
            const room = rooms.get(socket.roomId);
            if (!room || room.host !== userId) return;

            const now = Date.now();
            updateRoomAudio(room, data, now);
            broadcastAudioUpdate(io, socket.roomId, room);
        });

        socket.on('disconnect', () => {
            const userSocketSet = userSockets.get(userId);
            userSocketSet.delete(socket.id);

            if (userSocketSet.size === 0) {
                userSockets.delete(userId);
                if (socket.roomId) {
                    leaveRoom(socket, socket.roomId);
                }
            }
        });

        // Add other event handlers (addSongToProposalList, selectSongToPlay, etc.)
    });
};

const isUserInAnyRoom = (userId) => {
    for (const room of rooms.values()) {
        if (room.members.has(userId)) return true;
    }
    return false;
};

const getCurrentUserRoom = (userId) => {
    for (const [roomId, room] of rooms.entries()) {
        if (room.members.has(userId)) return roomId;
    }
    return null;
};

const leaveRoom = (socket, roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const userId = socket.user.id;
    room.members.delete(userId);

    if (room.host === userId) {
        broadcastToRoom(io, roomId, 'roomClosed', 'Host left the room');
        rooms.delete(roomId);
    } else {
        broadcastToRoom(io, roomId, 'memberLeft', {
            user: socket.user,
            members: Array.from(room.members),
        });
    }

    socket.leave(roomId);
    socket.roomId = null;
};

const getRoomData = (room) => ({
    id: room.id,
    members: Array.from(room.members),
    currentSong: room.currentSong,
    waitingList: room.waitingList,
    proposalList: room.proposalList,
});

const broadcastToRoom = (io, roomId, event, data) => {
    io.to(roomId).emit(event, data);
};

const updateRoomAudio = (room, data, now) => {
    if (room.currentSong.isPlaying !== data.isPlaying || now - room.timestamp > 1000) {
        room.currentSong.isPlaying = data.isPlaying;
        room.currentSong.currentTime = data.currentTime;
        room.timestamp = now;
    }
};

const broadcastAudioUpdate = (io, roomId, room) => {
    broadcastToRoom(io, roomId, 'UpdateAudio', {
        isPlaying: room.currentSong.isPlaying,
        currentTime: room.currentSong.currentTime,
    });
    broadcastToRoom(io, roomId, 'animation', room.currentSong.isPlaying);
};

export default setupSocketIO;
