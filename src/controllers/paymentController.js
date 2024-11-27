import { StatusCodes } from 'http-status-codes';
import { paymentService } from '~/services/paymentService';

const createPayment = async (req, res, next) => {
    try {
        const paymentUrl = await paymentService.createPaymentService({ user: req.user, data: req.body });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get payment url',
            paymentUrl: paymentUrl,
        });
    } catch (error) {
        next(error);
    }
};

const getPayment = async (req, res, next) => {
    try {
        console.log('orderCode: ', req.params.orderCode);
        const a = await paymentService.getPayment(req.params.orderCode);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get payment url',
            a: a,
        });
    } catch (error) {
        next(error);
    }
};

export const paymentController = {
    createPayment,
    getPayment,
};
