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

export const PLAYLIST_TYPE = Object.freeze({
    MYMUSIC: 'My music',
    FAVOURITE: 'My favorite',
});

export const REPORT_STATUS = Object.freeze({
    AI: 'AI',
    PENDING: 'Pending',
    DELETE: 'Deleted',
    NOTDELETE: 'Not deleted',
});

export const ROLE = Object.freeze({
    Admin: 'Admin',
    User: 'User',
});

export const ACCOUNT_STATUS = Object.freeze({
    NORMAL: 'Normal',
    LOCK3: 'Block 3 days',
    LOCK7: 'Block 7 days',
    PERMANENT: 'Block permanent',
});

export const NOTIFICATIONS_TYPE = Object.freeze({
    SYSTEM: 'System',
    PAYMENT: 'Payment',
    COMMENT: 'Comment',
    PACKAGE: 'Package',
});
