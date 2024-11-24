let io;
let chatRooms = {};

class RoomService {
    constructor() {
        this.io = null;
    }

    setSocketIO = (socketIO) => {
        this.io = socketIO;
        this.io.on('connection', (socket) => {
            console.log('a user connected', socket.id);
            console.log('rooms: ', this.io.sockets.adapter.rooms);

            socket.on('test', (data) => {
                socket.join(data);
                console.log('rooms2: ', this.io.sockets.adapter.rooms);
            });

            socket.on('disconnect', () => {
                console.log('user disconnected', socket.id);
            });

            socket.on('error', (err) => {
                console.error('Socket error:', err.message);
                socket.emit('error', err.message);
            });
        });

        this.io.on('error', (err) => {
            console.error('Global socket error:', err.message);
        });
    };

    createRoomService = (userId) => {
        const roomId = Date.now().toString();
        this.io.emit('test', userId);
        return roomId;
    };
}

export default new RoomService();
