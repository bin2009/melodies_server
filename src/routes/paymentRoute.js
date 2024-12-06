import express from 'express';
const Router = express.Router();

import { paymentController } from '~/controllers/paymentController';
import { authMiddleWare } from '~/middleware/authMiddleWare';

Router.route('/create').post(authMiddleWare.verifyToken, paymentController.createPayment);
Router.route('/:paymentId').get(authMiddleWare.verifyToken, paymentController.getPaymentDetail);
Router.route('/:orderCode').get(paymentController.getPayment);

export default Router;
