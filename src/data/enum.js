export const PACKAGE_TIME = Object.freeze({
    week: 7,
    '3month': 90,
});

export const NOTIFICATIONS = Object.freeze({
    PAYMENT_EXPIRED: 'Payment has expired',
    PAYMENT_PAID: 'Premium registration successful',
    PAYMENT_CANCELLED: 'Payment cancelled',

    REPORTED: 'You have reported a comment',
    COMMENT_REPORTED: 'Your comment has been reported',
    COMMENT_VIOLATION: 'Your comment has violated community standards',
});

export const PAYMENT = Object.freeze({
    PENDING: 'Pending',
    EXPIRED: 'Expired',
    PAID: 'Paid',
    CANCELLED: 'Cancelled',
});

export const ACCOUNTTYPE = Object.freeze({
    PREMIUM: 'Premium',
    FREE: 'Free',
});

export const SUSPENSION_DURATION = Object.freeze({
    WARNING: 'Warning',
    LOCK3: 3,
    LOCK7: 7,
    PERMANENT: 'permanent',
});
