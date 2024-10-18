require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// http & socketio
const http = require('http');
const { Server } = require('socket.io');

// redis
const { connectRedis } = require('./services/redisService');
connectRedis();

app.use(express.json());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);

// database
require('./models');

// config view
const configViewEngine = require('./config/viewEngine');
configViewEngine(app);

// config route
const userRoute = require('./routes/userRoute');
app.use('/api', userRoute);
const songRoute = require('./routes/songRoute');
app.use('/api', songRoute);

// initialize server
const port = process.env.PORT || 3000;
// const server = http.createServer(app);
// const io = new Server(server);

// // socket
// io.on('connection', (socket) => {
//     console.log('A user connected: ', socket.id);

//     socket.on('chat message', (msg) => {
//         io.emit('chat message', msg);
//     });

//     socket.on('disconnect', () => {
//         console.log('user has left');
//     });
// });

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
