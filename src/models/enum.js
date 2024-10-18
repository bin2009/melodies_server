const AlbumTypes = {
    ALBUM: 'album',
    SINGLE: 'single',
    EP: 'ep',
};

const TimePackageTypes = {
    PACK0: '7',
    PACK1: '30',
    PACK2: '60',
    PACK3: '90',
    PACK4: '120',
};

const PremiumTypes = {
    PRE1: 'non-ads',
    PRE2: 'download',
    PRE2: 'non-ads-can-download',
};

const PaymentTypes = {
    PAY1: 'VNPAY',
};

const PaymentStatus = {
    PENDING: 'Pending',
    SUCCESS: 'Success',
    FAILED: 'Failed',
    CANCEL: 'Cancel',
};

module.exports = {
    AlbumTypes,
    TimePackageTypes,
    PremiumTypes,
    PaymentTypes,
    PaymentStatus,
};
