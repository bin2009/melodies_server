import socketAuthMiddleware from '~/middleware/socketAuth.js';
import { handleSocketError } from '~/middleware/errorHandlingMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import db from '~/models';
import { userService } from '~/services/userService';

const rooms = new Map();
const userSockets = new Map();
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
        console.warn('socket connect: ', socket.id);
        console.warn('socket connect - user id: ', socket.user.id);
        console.info('rooms:', rooms);

        const userId = socket.user.id;
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

            socket.user.host = true;

            const roomId = uuidv4();
            const room = {
                id: roomId,
                host: userId,
                members: new Map([[userId, socket.user]]),
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
            console.log('1. rooms: ', rooms);
            socket.join(roomId);
            socket.roomId = roomId;
            socket.emit('createRoomSuccess', roomId);
        });

        socket.on('joinRoom', ({ roomId, link }) => {
            console.log('2. : ', roomId);

            const room = rooms.get(roomId);

            console.log('3. ', room);

            if (!room) {
                if (link) {
                    return socket.emit('joinRoomLinkFailed', 'Room not found');
                } else {
                    return socket.emit('joinRoomFailed', 'Room not found');
                }
            }

            if (room.members.has(socket.user.id)) {
                socket.join(roomId);
                socket.roomId = roomId;
                if (link) {
                    return socket.emit('joinRoomLinkSuccess', {
                        roomData: getRoomData(room),
                        isHost: room.host === socket.user.id,
                        myId: socket.user.id,
                    });
                } else {
                    return socket.emit('joinRoomSuccess', {
                        roomData: getRoomData(room),
                        isHost: room.host === socket.user.id,
                        myId: socket.user.id,
                    });
                }
            } else {
                if (room.members.size >= room.max) {
                    if (link) {
                        return socket.emit('joinRoomLinkFailed', 'Room is full');
                    } else {
                        return socket.emit('joinRoomFailed', 'Room is full');
                    }
                }

                const currentRoom = getCurrentUserRoom(socket.user.id);
                if (currentRoom && currentRoom !== roomId) {
                    leaveRoom(socket, currentRoom, io);
                }

                room.members.set(socket.user.id, socket.user);
                socket.join(roomId);
                socket.roomId = roomId;
                socket.user.host = false;

                broadcastToRoom(io, roomId, 'memberJoined', {
                    user: socket.user,
                    members: Array.from(room.members.values()),
                });

                if (link) {
                    return socket.emit('joinRoomLinkSuccess', {
                        roomData: getRoomData(room),
                        isHost: room.host === socket.user.id,
                        myId: socket.user.id,
                    });
                } else {
                    return socket.emit('joinRoomSuccess', {
                        roomData: getRoomData(room),
                        isHost: room.host === socket.user.id,
                        myId: socket.user.id,
                    });
                }
            }
        });

        socket.on('leaveRoom', () => {
            if (!socket.roomId) return;
            const room = rooms.get(socket.roomId);
            leaveRoom(socket, socket.roomId, io);
        });

        socket.on('addSongToProposalList', (song) => {
            const room = rooms.get(socket.roomId);
            if (!room) return;

            const proposalListMap = new Map(room.proposalList.map((song) => [song.id, song]));
            const checkSong = proposalListMap.get(song.id);
            if (checkSong) {
                return socket.emit('addSongToProposalListFailed', 'Song existed in proposal list');
            } else {
                room.proposalList.push(song);
                socket.emit('addSongToProposalListSuccess');
                return broadcastToRoom(io, socket.roomId, 'updateProposalList', room.proposalList);
            }
        });

        socket.on('addSongToWaitingList', (song) => {
            console.log('addSongToWaitingList: ', song);
            const room = rooms.get(socket.roomId);
            const waitingListMap = new Map(room.waitingList.map((song) => [song.id, song]));
            const checkSong = waitingListMap.get(song.id);
            if (checkSong) {
                socket.emit('addSongToWaitingListFailed', 'Song existed in waiting list');
            } else {
                room.waitingList.push(song);
                socket.emit('addSongToWaitingListSuccess');
                broadcastToRoom(io, socket.roomId, 'updateWaitingList', room.waitingList);
            }
        });

        socket.on('forwardSong', (songId) => {
            const room = rooms.get(socket.roomId);
            if (!room) return;

            const songIndex = room.proposalList.findIndex((song) => song.id === songId);
            if (songIndex === -1) {
                return broadcastToRoom(io, socket.roomId, 'updateListSong', {
                    waitingList: room.waitingList,
                    proposalList: room.proposalList,
                });
            }

            const songExistsInWaiting = room.waitingList.some((song) => song.id === songId);
            if (songExistsInWaiting) {
                socket.emit('forwardSongFailed', 'Song existed in waiting list');
            } else {
                room.waitingList.push(room.proposalList[songIndex]);
            }

            room.proposalList.splice(songIndex, 1);

            broadcastToRoom(io, socket.roomId, 'updateListSong', {
                waitingList: room.waitingList,
                proposalList: room.proposalList,
            });
        });

        socket.on('selectSongToPlay', (songId) => {
            const room = rooms.get(socket.roomId);
            const waitingListMap = new Map(room.waitingList.map((song) => [song.id, song]));
            const song = waitingListMap.get(songId);
            if (song) {
                room.currentSong.song = song;
                room.currentSong.isPlaying = true;
                room.currentSong.currentTime = 0;
                broadcastToRoom(io, socket.roomId, 'playSong', room.currentSong);
            } else {
                broadcastToRoom(io, socket.roomId, 'updateListSong', {
                    waitingList: room.waitingList,
                    proposalList: room.proposalList,
                });
            }
        });

        socket.on('nextSong', () => {
            const room = rooms.get(socket.roomId);
            const currentSongId = room.currentSong.song.id;

            const index = room.waitingList.findIndex((item) => item.id === currentSongId);
            if (room.waitingList.length === index + 1) {
                socket.emit('nextSongFailed', 'You are listening to the last song');
            } else {
                room.currentSong.song = room.waitingList[index + 1];
                room.currentSong.isPlaying = true;
                room.currentSong.currentTime = 0;
                broadcastToRoom(io, socket.roomId, 'playSong', room.currentSong);
            }
        });

        socket.on('previousSong', () => {
            const room = rooms.get(socket.roomId);
            const currentSongId = room.currentSong.song.id;

            const index = room.waitingList.findIndex((item) => item.id === currentSongId);
            if (index === 0) {
                socket.emit('previousSongFailed', 'You are listening to the first song');
            } else {
                room.currentSong.song = room.waitingList[index - 1];
                room.currentSong.isPlaying = true;
                room.currentSong.currentTime = 0;
                broadcastToRoom(io, socket.roomId, 'playSong', room.currentSong);
            }
        });

        socket.on('randomSongPlay', () => {
            const room = rooms.get(socket.roomId);
            const currentSongId = room.currentSong.song.id;
            const otherSongs = room.waitingList.filter((item) => item.id !== currentSongId);

            if (otherSongs.length === 0) {
                socket.emit('randomSongPlayFailed', 'Waiting list has only 1 song');
            } else {
                const randomIndex = Math.floor(Math.random() * otherSongs.length);
                const randomSong = otherSongs[randomIndex];
                room.currentSong.song = randomSong;
                room.currentSong.isPlaying = true;
                room.currentSong.currentTime = 0;
                broadcastToRoom(io, socket.roomId, 'playSong', room.currentSong);
            }
        });

        socket.on('SyncAudio', (data) => {
            const room = rooms.get(socket.roomId);
            if (!room || room.host !== userId) return;

            const now = Date.now();
            // updateRoomAudio(room, data, now );
            updateRoomAudio(room, data, now, io, socket.roomId);
            // broadcastAudioUpdate(io, socket.roomId, room);
        });

        socket.on('SendMessage', (data) => {
            broadcastToRoom(io, socket.roomId, 'ServerSendMessage', {
                user: socket.user,
                message: data.message,
                userSend: socket.user.id,
            });
        });

        // --------------------

        socket.on('disconnect', () => {
            console.error(`User disconnected:`, socket.user.id);
            console.error(`Socket disconnected:`, socket.id);

            const userSocketSet = userSockets.get(socket.user.id);
            userSocketSet.delete(socket.id);

            if (userSocketSet.size === 0) {
                userSockets.delete(userId);
                if (socket.roomId) {
                    leaveRoom(socket, socket.roomId, io);
                }
            }
        });
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

const leaveRoom = (socket, roomId, io) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const userId = socket.user.id;
    room.members.delete(userId);

    if (room.host === userId) {
        broadcastToRoom(io, roomId, 'roomClosed', 'Host left the room');
        rooms.delete(roomId);
    } else {
        socket.emit('leaveRoomSuccess');
        broadcastToRoom(io, roomId, 'memberLeft', {
            user: socket.user,
            members: Array.from(room.members.values()),
        });
    }

    socket.leave(roomId);
    socket.roomId = null;
};

const getRoomData = (room) => ({
    id: room.id,
    members: Array.from(room.members.values()),
    currentSong: room.currentSong,
    waitingList: room.waitingList,
    proposalList: room.proposalList,
});

const broadcastToRoom = (io, roomId, event, data) => {
    io.to(roomId).emit(event, data);
};

const updateRoomAudio = (room, data, now, io, roomId) => {
    console.log('old', room.currentSong.isPlaying, '\t', room.currentSong.currentTime);
    // console.log('new: ', data, '\t', now);
    if (
        room.currentSong.isPlaying !== data.isPlaying ||
        Math.abs(data.currentTime - room.currentSong.currentTime) > 1
    ) {
        console.log('true');
        // if (room.currentSong.isPlaying !== data.isPlaying || now - room.timestamp > 1000) {
        room.currentSong.isPlaying = data.isPlaying;
        room.currentSong.currentTime = data.currentTime;
        room.timestamp = now;

        // update
        broadcastAudioUpdate(io, roomId, room);
    }
};

const broadcastAudioUpdate = (io, roomId, room) => {
    broadcastToRoom(io, roomId, 'UpdateAudio', {
        isPlaying: room.currentSong.isPlaying,
        currentTime: room.currentSong.currentTime,
    });
    broadcastToRoom(io, roomId, 'animation', room.currentSong.isPlaying);
};

const sendMessageToUser = (userId, event, data) => {
    const socketIds = userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) {
        console.error(`No active sockets found for user ID: ${userId}`);
        return false;
    }

    for (const socketId of socketIds) {
        ioRoot.to(socketId).emit(event, data);
    }
    return true;
};

export default setupSocketIO;

export { sendMessageToUser };
