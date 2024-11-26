import express from 'express';
const Router = express.Router();
import PayOS from '@payos/node';

const YOUR_DOMAIN = 'http://localhost:20099';

const payos = new PayOS(
    '55a8ea5c-79b5-4477-882d-acaebf3ab3ca',
    '91461a89-e2e2-4707-9bfa-3bb77a68afdc',
    '3139adbbc3befe847acb97bda57942a66500d0e5f057a8245d9cc3e965295739',
);

Router.route('/create').post();

Router.route('/create-payment').post(async (req, res, next) => {
    try {
        const order = {
            amount: 10000,
            description: 'Thanh toan demo',
            orderCode: 16,
            returnUrl: `${YOUR_DOMAIN}/success.html`,
            cancelUrl: `${YOUR_DOMAIN}/cancel.html`,
        };

        const paymentLink = await payos.createPaymentLink(order);
        res.redirect(303, paymentLink.checkoutUrl);
    } catch (error) {
        next(error);
    }
});

Router.route('/receive-hook').post(async (req, res, next) => {
    try {
        console.log(req.body);
        res.json();
    } catch (error) {
        next(error);
    }
});

export default Router;
