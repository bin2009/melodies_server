import { v4 as uuidv4 } from 'uuid';
import { PACKAGE_TIME } from '~/data/enum';
import db from '~/models';

import payos from '~/config/paymentConfig';

const createPaymentService = async ({ user, data } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const pack = await db.SubscriptionPackage.findByPk(data.packageId);
        const days = PACKAGE_TIME[pack.time];
        const startDate = Date.now();
        const id = uuidv4();

        const payment = await db.Subscriptions.create(
            {
                id: id,
                userId: user.id,
                packageId: data.packageId,
                startDate: startDate,
                endDate: new Date(startDate + 86400 * 1000 * days),
                status: 'Pending',
            },
            { transaction },
        );
        console.log('paymentL ', payment);

        const quantity = 1;
        const price = quantity * pack.fare;
        const items = [{ name: pack.name, quantity: 1, price: pack.fare }];

        // vietqr
        const currentDate = Number(String(Date.now()).slice(-6));
        console.log('orderCode: ', currentDate);

        const order = {
            amount: price,
            description: pack.description,
            orderCode: currentDate,
            items: items,
            returnUrl: `${process.env.DOMAIN}/success.html`,
            cancelUrl: `${process.env.DOMAIN}/cancel.html`,
            expiredAt: Math.floor(Date.now() / 1000) + 2 * 60,
        };
        const paymentLink = await payos.createPaymentLink(order);
        await transaction.commit();

        listenForPaymentStatus(currentDate, id, user.id);

        return paymentLink.checkoutUrl;
    } catch (error) {
        await transaction.rollback();

        throw error;
    }
};

const listenForPaymentStatus = (orderCode, id, userId) => {
    const interval = setInterval(async () => {
        const transaction = await db.sequelize.transaction();
        try {
            const paymentDetails = await getPayment(orderCode);
            switch (paymentDetails.status) {
                case 'EXPIRED':
                    await db.Subscriptions.update({ status: 'Expired' }, { where: { id: id } }, { transaction });
                    clearInterval(interval);
                    break;
                case 'PAID':
                    await db.Subscriptions.update({ statusUse: false }, { where: { userId: userId } }, { transaction });
                    await Promise.all([
                        db.Subscriptions.update(
                            { status: 'Paid', statusUse: true },
                            { where: { id: id } },
                            { transaction },
                        ),
                        db.User.update({ accountType: 'Premium' }, { where: { id: userId } }, { transaction }),
                    ]);
                    clearInterval(interval);
                    break;
                case 'CANCELLED':
                    await db.Subscriptions.update({ status: 'Cancelled' }, { where: { id: id } }, { transaction });
                    clearInterval(interval);
                    break;
                default:
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
            clearInterval(interval);
        }
    }, 1000);
};

const getPayment = async (orderCode) => {
    try {
        const paymentDetails = await payos.getPaymentLinkInformation(orderCode);
        return paymentDetails;
    } catch (error) {
        throw error;
    }
};

export const paymentService = {
    createPaymentService,
    getPayment,
};
