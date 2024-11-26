import { paymentService } from '~/services/paymentService';

const createPayment = async (req, res, next) => {
    try {
        const paymentUrl = await paymentService.createPaymentService({ data: req.body });
    } catch (error) {
        next(error);
    }
};

export const paymentController = {
    createPayment,
};
