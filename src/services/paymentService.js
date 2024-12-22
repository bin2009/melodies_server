import { v4 as uuidv4 } from 'uuid';
import { ACCOUNTTYPE, NOTIFICATIONS, PACKAGE_TIME, PAYMENT } from '~/data/enum';
import db from '~/models';
import { sendMessageToUser } from '~/sockets/socketManager';

import payos from '~/config/paymentConfig';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import formatTime from '~/utils/timeFormat';

const createPaymentService = async ({ user, data } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const pack = await db.SubscriptionPackage.findByPk(data.packageId);
        const days = PACKAGE_TIME[pack.time];
        const startDate = Date.now();

        const payment = await db.Subscriptions.create(
            {
                userId: user.id,
                packageId: data.packageId,
                startDate: startDate,
                endDate: new Date(startDate + 86400 * 1000 * days),
                status: PAYMENT.PENDING,
            },
            { transaction },
        );
        await transaction.commit();

        const quantity = 1;
        const price = quantity * pack.fare;
        const items = [{ name: pack.name, quantity: 1, price: pack.fare }];

        const currentDate = Number(String(Date.now()));
        console.log('orderCode: ', currentDate);

        const order = {
            amount: price,
            description: pack.description,
            orderCode: currentDate,
            items: items,
            returnUrl: `${process.env.DOMAIN}/success.html`,
            cancelUrl: `${process.env.DOMAIN}/cancel.html`,
            expiredAt: Math.floor(Date.now() / 1000) + 5 * 60,
        };
        const paymentLink = await payos.createPaymentLink(order);

        listenForPaymentStatus(currentDate, payment, user.id, pack);

        return paymentLink.checkoutUrl;
    } catch (error) {
        await transaction.rollback();

        throw error;
    }
};

const listenForPaymentStatus = (orderCode, payment, userId, pack) => {
    const interval = setInterval(async () => {
        const transaction = await db.sequelize.transaction();
        try {
            const paymentDetails = await getPayment(orderCode);
            switch (paymentDetails.status) {
                case 'EXPIRED':
                    await Promise.all([
                        db.Subscriptions.update(
                            { status: PAYMENT.EXPIRED },
                            { where: { id: payment.id }, transaction },
                        ),
                        // db.Notifications.create(
                        //     {
                        //         userId: userId,
                        //         type: NOTIFICATIONS.PAYMENT_EXPIRED,
                        //         message: `Gói: ${pack.name} - Thời gian: ${PACKAGE_TIME[pack.time]} ngày - Giá: ${
                        //             pack.fare
                        //         }`,
                        //         from: payment.id,
                        //     },
                        //     { transaction },
                        // ),
                    ]);
                    clearInterval(interval);
                    // socket
                    // sendMessageToUser(userId, 'paymentStatus', {
                    //     status: 'Paid',
                    //     message: 'Payment successful. Your account is now Premium.',
                    // });
                    break;
                case 'PAID':
                    await db.Subscriptions.update({ statusUse: false }, { where: { userId: userId }, transaction });
                    const [noti] = await Promise.all([
                        db.Notifications.create(
                            {
                                userId: userId,
                                // type: NOTIFICATIONS.PAYMENT_PAID,
                                type: 'PAYMENT',
                                message: `Đăng kí thành công gói: ${pack.name} - Thời gian: ${
                                    PACKAGE_TIME[pack.time]
                                } ngày - Giá: ${pack.fare} `,
                                from: payment.id,
                            },
                            { transaction },
                        ),
                        db.Subscriptions.update(
                            { status: PAYMENT.PAID, statusUse: true },
                            { where: { id: payment.id }, transaction },
                        ),
                        db.User.update({ accountType: 'PREMIUM' }, { where: { id: userId }, transaction }),
                    ]);
                    clearInterval(interval);
                    sendMessageToUser(userId, 'newNoti', noti);
                    break;
                case 'CANCELLED':
                    await Promise.all([
                        db.Subscriptions.update(
                            { status: PAYMENT.CANCELLED },
                            { where: { id: payment.id }, transaction },
                        ),
                        // db.Notifications.create(
                        //     {
                        //         userId: userId,
                        //         type: NOTIFICATIONS.PAYMENT_CANCELLED,
                        //         message: `Gói: ${pack.name} - Thời gian: ${PACKAGE_TIME[pack.time]} ngày - Giá: ${
                        //             pack.fare
                        //         }`,
                        //         from: payment.id,
                        //     },
                        //     { transaction },
                        // ),
                    ]);
                    clearInterval(interval);
                    break;
                default:
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            clearInterval(interval);
            throw error;
        }
    }, 1000);
};

const getPaymentDetailService = async ({ user, paymentId } = {}) => {
    try {
        const payment = await db.Subscriptions.findByPk(paymentId);
        if (!payment) throw new ApiError(StatusCodes.NOT_FOUND, 'Payment invoice not found');
        if (!(user.role === 'Admin' || payment.userId === user.id))
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access');

        const paymentDetail = await db.Subscriptions.findOne({
            where: { id: paymentId },
            attributes: ['id', 'startDate', 'endDate', 'status', 'statusUse', 'createdAt'],
            include: [
                { model: db.SubscriptionPackage, as: 'package' },
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'name', 'email', 'image', 'accountType', 'status', 'createdAt'],
                },
            ],
        });

        const formatter = paymentDetail.toJSON();
        formatter.startDate = formatTime(formatter.startDate);
        formatter.endDate = formatTime(formatter.endDate);
        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.package.createdAt = formatTime(formatter.package.createdAt);
        formatter.package.updatedAt = formatTime(formatter.package.updatedAt);
        formatter.user.createdAt = formatTime(formatter.user.createdAt);
        return formatter;
    } catch (error) {
        throw error;
    }
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
    getPaymentDetailService,
    getPayment,
};
