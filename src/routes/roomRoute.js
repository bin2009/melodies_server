import express from 'express';
import { authMiddleWare } from '~/middleware/authMiddleWare';
const Router = express.Router();
import { roomController } from '~/controllers/roomController';

Router.route('/create').post(authMiddleWare.verifyToken, roomController.createRoom);
Router.route('/').get((req, res) => res.render('room.ejs'));
// router.get('/create', roomController.createRoom);
// router.get('/check/:roomCode', roomController.checkRoom);
// router.get('/', roomController.chatRoom);

export default Router;
