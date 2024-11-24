// require('dotenv').config();
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';

import connection from '~/config/database';
import { errorHandlingMiddleware } from './middleware/errorHandlingMiddleware';

import authRoute from '~/routes/authRoute';
import adminRoute from '~/routes/adminRoute';
import songRoute from '~/routes/songRoute';
import userRoute from '~/routes/userRoute';
import artistRoute from '~/routes/artistRoute';
import albumRoute from '~/routes/albumRoute';
import roomRoute from '~/routes/roomRoute';

const app = express();

const corsOptions2 = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
};
// app.use(cors(corsOptions2));
app.use(cors());
// app.options('*', cors(corsOptions));
// app.use(cors({ origin: 'http://171.251.5.239:20099' }));
app.use(cookieParser());

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
connection();

// config view
const configViewEngine = require('./config/viewEngine');
configViewEngine(app);

// confi route
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);
app.use('/api', songRoute);
app.use('/api', userRoute);
app.use('/api/artist', artistRoute);
app.use('/api/album', albumRoute);
app.use('/api/room', roomRoute);

// handle error
app.use(errorHandlingMiddleware);

// initialize server
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// const { handleSocketConnection } = require('~/controllers/roomController');
// io.on('connection', (socket) => {
//     handleSocketConnection(socket, io);
// });

import { configureSocket } from '~/config/socketConfig';
configureSocket(io);

server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
