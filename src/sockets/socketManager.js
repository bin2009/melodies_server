import socketAuthMiddleware from '~/middleware/socketAuth.js';
import { handleSocketError } from '~/middleware/errorHandlingMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const rooms = {};
const notification = {};
let ioRoot;
let loc2;

const setupSocketIO = (io) => {
    ioRoot = io;
    io.use((socket, next) => {
        socketAuthMiddleware(socket, (err) => {
            if (err) return handleSocketError(err, socket, next);
            next();
        });
    });

    io.on('connection', (socket) => {
        if (socket.user) {
            console.warn(`User connected:`, socket.user.id);
            notification[socket.user.id] = socket;

            socket.on('createRoom', () => {
                if (socket.user.accountType !== 'Premium') {
                    return socket.emit('createRoomFailed', 'Please upgrade your account to perform this function.');
                }
                if (socket.roomId) {
                    return socket.emit('createRoomFailed', 'You already have a room, please exit the previous room');
                }
                const roomId = uuidv4();
                rooms[roomId] = {
                    host: socket.user.id,
                    // members: [{ [socket.user.id]: socket.user }],
                    members: [socket.user],
                    songState: { isPlaying: true, currentTime: 0 },
                    currentSong: { song: {}, isPlaying: true, currentTime: 0 },
                    proposalList: [],
                    waitingList: [],
                    now: 0,
                };
                socket.join(roomId);
                socket.roomId = roomId;
                socket.emit('createRoomSuccess', roomId);
                // socket.emit('members', rooms[roomId].members);
                // io.to(roomId).emit('members', rooms[roomId].members);
                // io.to(roomId).emit('members', rooms[roomId].members);
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

                // rooms[roomId].members.push(socket.user.username);
                // rooms[roomId].members.push({ [socket.user.id]: socket.user });
                rooms[roomId].members.push(socket.user);

                socket.to(roomId).emit('memberJoined', { username: socket.user.username });
                socket.emit('joinRoomSuccess', {
                    roomId,
                    permit: false,
                    currentSong: rooms[roomId].currentSong,
                    waitingList: rooms[roomId].waitingList,
                    proposalList: rooms[roomId].proposalList,
                });
                io.to(roomId).emit('members', rooms[roomId].members);
            });

            socket.on('leaveRoom', () => {
                const roomId = socket.roomId;
                const room = rooms[socket.roomId];
                if (room) {
                    if (room.host === socket.user.id) {
                        // Gửi thông báo đến tất cả thành viên trong phòng
                        socket.emit('leaveRoomSuccess');
                        socket.to(roomId).emit('roomClosed', 'The room has been closed because the owner left.');

                        for (const client of io.sockets.adapter.rooms.get(roomId) || []) {
                            const socketInstance = io.sockets.sockets.get(client);
                            if (socketInstance) {
                                delete socketInstance.roomId; // Xóa giá trị roomId
                            }
                        }
                        io.in(roomId).socketsLeave(roomId);
                        delete rooms[roomId];
                    } else {
                        socket.leave(roomId);
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

            socket.on('getData', () => {
                const room = rooms[socket.roomId];
                if (room.host === socket.user.id) {
                    socket.emit('members', rooms[socket.roomId].members);
                } else {
                    socket.emit('members', rooms[socket.roomId].members);
                    socket.emit('roomData', {
                        roomId: socket.roomId,
                        permit: false,
                        currentSong: rooms[socket.roomId].currentSong,
                        waitingList: rooms[socket.roomId].waitingList,
                        proposalList: rooms[socket.roomId].proposalList,
                        currentSong: rooms[socket.roomId].currentSong,
                    });
                }
            });

            socket.on('SyncAudio', (data) => {
                // console.log('data:', data);
                const room = rooms[socket.roomId];
                const a = Date.now();
                // if (room.currentSong.isPlaying !== data.isPlaying) {
                //     room.currentSong.isPlaying = data.isPlaying;
                //     room.currentSong.currentTime = data.currentTime;
                //     room.now = a;
                //     socket.to(socket.roomId).emit('UpdateAudio', {
                //         isPlaying: room.currentSong.isPlaying,
                //         currentTime: room.currentSong.currentTime,
                //     });
                // } else {
                //     if (a - room.now > 1000) {
                //         room.currentSong.currentTime = data.currentTime;
                //         room.now = a;
                //         socket.to(socket.roomId).emit('UpdateAudio', {
                //             isPlaying: room.currentSong.isPlaying,
                //             currentTime: room.currentSong.currentTime,
                //         });
                //     }
                // }
                // if (a - room.now > 1000) {
                room.currentSong.isPlaying = data.isPlaying;
                room.currentSong.currentTime = data.currentTime;
                room.now = a;
                socket.to(socket.roomId).emit('UpdateAudio', {
                    isPlaying: room.currentSong.isPlaying,
                    currentTime: room.currentSong.currentTime,
                });
                // }
            });

            socket.on('addSongToProposalList', (song) => {
                const room = rooms[socket.roomId];
                const proposalListMap = new Map(room.proposalList.map((song) => [song.id, song]));
                const checkSong = proposalListMap.get(song.id);
                if (checkSong) {
                    socket.emit('addSongToProposalListFailed', 'Song existed in proposal list');
                } else {
                    room.proposalList.push(song);
                    socket.emit('addSongToProposalListSuccess');
                    // console.log('room: ', room.proposalList);
                    io.to(socket.roomId).emit('updateProposalList', room.proposalList);
                }
            });

            socket.on('addSongToWaitingList', (song) => {
                const room = rooms[socket.roomId];
                const waitingListMap = new Map(room.waitingList.map((song) => [song.id, song]));
                const checkSong = waitingListMap.get(song.id);
                if (checkSong) {
                    socket.emit('addSongToWaitingListFailed', 'Song existed in waiting list');
                } else {
                    room.waitingList.push(song);
                    socket.emit('addSongToWaitingListSuccess');
                    io.to(socket.roomId).emit('updateWaitingList', room.waitingList);
                }
            });

            socket.on('forwardSong', (songId) => {
                const room = rooms[socket.roomId];
                const proposalListMap = new Map(room.proposalList.map((song) => [song.id, song]));
                const waitingListMap = new Map(room.waitingList.map((song) => [song.id, song]));

                const song = proposalListMap.get(songId);

                if (song) {
                    const checkSongExists = waitingListMap.get(song.id);
                    if (checkSongExists) {
                        socket.emit('forwardSongFailed', 'Song existed in waiting list');
                        room.proposalList = room.proposalList.filter((s) => s.id !== checkSongExists.id);
                        io.to(socket.roomId).emit('updateListSong', {
                            waitingList: room.waitingList,
                            proposalList: room.proposalList,
                        });
                    } else {
                        room.waitingList.push(song);
                        room.proposalList = room.proposalList.filter((s) => s.id !== songId);
                        io.to(socket.roomId).emit('updateListSong', {
                            waitingList: room.waitingList,
                            proposalList: room.proposalList,
                        });
                    }
                } else {
                    socket.emit('refreshListSong');
                    // handle refresh list song : 2
                }
            });

            socket.on('selectSongToPlay', (songId) => {
                // console.log('songId: ', songId);
                const room = rooms[socket.roomId];
                const waitingListMap = new Map(room.waitingList.map((song) => [song.id, song]));
                const song = waitingListMap.get(songId);
                // console.log('song find: ', song);
                if (song) {
                    room.currentSong.song = song;
                    room.isPlaying = true;
                    room.currentTime = 0;
                    loc2 = Date.now();
                    room.now = loc2;
                    io.to(socket.roomId).emit('playSong', room.currentSong);
                    console.log('loc2:', loc2);
                } else {
                    socket.emit('refreshListSong');
                }
            });

            socket.on('SendMessage', (data) => {
                io.to(socket.roomId).emit('ServerSendMessage', { user: socket.user, message: data.message });
            });

            socket.on('nextSong', () => {
                // lấy ra bài đang hát -> index -> xóa bài hát từ index
                const room = rooms[socket.roomId];
                const currentSongId = room.currentSong.song.id;
                const waitingListMap = room.waitingList.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {});
                const index = room.waitingList.findIndex((item) => item.id === currentSongId);
                if (room.waitingList.length === index + 1) {
                    console.log('đã hết bài tiếp theo');
                    socket.emit('nextSongFailed', 'You are listening to the last song');
                } else {
                    room.currentSong.song = room.waitingList[index + 1];
                    room.currentSong.isPlaying = true;
                    room.currentSong.currentTime = 0;
                    // room.waitingList.splice(index, 1);
                    io.to(socket.roomId).emit('playSong', room.currentSong);
                    io.to(socket.roomId).emit('updateListSong', {
                        waitingList: room.waitingList,
                        proposalList: room.proposalList,
                    });
                    console.log('bài hát: ', waitingListMap[currentSongId]);
                    console.log('index ', index);
                }
            });

            socket.on('previousSong', () => {
                const room = rooms[socket.roomId];
                const currentSongId = room.currentSong.song.id;
                const waitingListMap = room.waitingList.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {});
                const index = room.waitingList.findIndex((item) => item.id === currentSongId);
                if (index === 0) {
                    console.log('đã hết bài');
                    socket.emit('previousSongFailed', 'You are listening to the first song');
                } else {
                    room.currentSong.song = room.waitingList[index - 1];
                    room.currentSong.isPlaying = true;
                    room.currentSong.currentTime = 0;
                    // room.waitingList.splice(index, 1);
                    io.to(socket.roomId).emit('playSong', room.currentSong);
                    io.to(socket.roomId).emit('updateListSong', {
                        waitingList: room.waitingList,
                        proposalList: room.proposalList,
                    });
                    // console.log('bài hát: ', waitingListMap[currentSongId]);
                    console.log('index ', index);
                }
            });

            socket.on('randomSongPlay', () => {
                const room = rooms[socket.roomId];
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
                    io.to(socket.roomId).emit('playSong', room.currentSong);
                }
            });

            // socket.on('skipBackward', () => {
            //     const room = rooms[socket.roomId];
            //     console.log('ban đầu: ', room.currentSong.currentTime);
            //     const currentTime = room.currentSong.currentTime;
            //     if (currentTime - 5 < 0) {
            //         room.currentSong.currentTime = 0;
            //     } else {
            //         room.currentSong.currentTime = currentTime - 5;
            //     }
            //     console.log('lúc sau: ', room.currentSong.currentTime);
            //     socket.to(socket.roomId).emit('UpdateAudio', {
            //         isPlaying: room.currentSong.isPlaying,
            //         currentTime: room.currentSong.currentTime,
            //     });
            // });

            socket.on('repeatSong', () => {
                const room = rooms[socket.roomId];
                socket.to(socket.roomId).emit('repeatSong');
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
        }
    });
};

const sendMessageToUser = (userId, event, data) => {
    const socket = notification[userId];
    if (socket) {
        console.log('demo:', event, data);
        socket.emit(event, data);
    } else {
        console.error(`Socket not found for user ID: ${userId}`);
    }
};

export default setupSocketIO;
// module.exports = setupSocketIO;
export { sendMessageToUser };
