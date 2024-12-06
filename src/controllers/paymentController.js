import { StatusCodes } from 'http-status-codes';
import { paymentService } from '~/services/paymentService';
import ApiError from '~/utils/ApiError';

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

const getPaymentDetail = async (req, res, next) => {
    try {
        if (!req.params.paymentId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: payment id');
        const paymentDetail = await paymentService.getPaymentDetailService({
            user: req.user,
            paymentId: req.params.paymentId,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get payment detail',
            paymentDetail: paymentDetail,
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
    getPaymentDetail,
    getPayment,
};
