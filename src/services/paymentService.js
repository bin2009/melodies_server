const createPaymentService = async ({ data } = {}) => {
    try {
        const order = {
            amount: data.amount,
            description: data.description,
            orderCode: data.orderCode,
            returnUrl: `${YOUR_DOMAIN}/success.html`,
            cancelUrl: `${YOUR_DOMAIN}/cancel.html`,
        };
        const paymentLink = await payos.createPaymentLink(order);
        // res.redirect(303, paymentLink.checkoutUrl);
        return paymentLink.checkoutUrl;
    } catch (error) {
        throw error;
    }
};

export const paymentService = {
    createPaymentService,
};
