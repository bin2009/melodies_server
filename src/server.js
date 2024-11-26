// require('dotenv').config();
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import connection from '~/config/database';
import { errorHandlingMiddleware } from './middleware/errorHandlingMiddleware';

import authRoute from '~/routes/authRoute';
import adminRoute from '~/routes/adminRoute';
import songRoute from '~/routes/songRoute';
import userRoute from '~/routes/userRoute';
import artistRoute from '~/routes/artistRoute';
import albumRoute from '~/routes/albumRoute';
import paymentRoute from '~/routes/paymentRoute';

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
app.use('/api/payment', paymentRoute);

// handle error
app.use(errorHandlingMiddleware);

// initialize server
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
