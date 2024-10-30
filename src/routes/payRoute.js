const express = require('express');
const router = express.Router();

function formatDate(date) {
    const pad = (num) => String(num).padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Tháng bắt đầu từ 0
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function formatTime(date) {
    const pad = (num) => String(num).padStart(2, '0');
    
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${hours}${minutes}${seconds}`;
}

function sortObject(obj) {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
}

router.get('/create_payment_url', function (req, res, next) {
    var ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    // var config = require('config');
    // var dateFormat = require('dateformat');

    
    var tmnCode = process.env.MERCHANT_ID;
    var secretKey = process.env.SECRET_KEY;
    var vnpUrl = process.env.VNPAY_URL;
    var returnUrl = process.env.RETURN_URL;

    var date = new Date();

    // var createDate = dateFormat(date, 'yyyymmddHHmmss');
    var createDate = formatDate(date);
    // var orderId = dateFormat(date, 'HHmmss');
    var orderId = formatTime(date);
    var amount = req.body.amount;
    var bankCode = req.body.bankCode;

    // Thêm 1 ngày vào ngày hiện tại
    var expireDate = new Date(date);
    expireDate.setDate(date.getDate() + 1);
    
    var orderInfo = req.body.orderDescription;
    var orderType = req.body.orderType;
    var locale = req.body.language;
    if(locale === null || locale === ''){
        locale = 'vn';
    }
    var currCode = 'VND';
    var vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_CreateDate'] = createDate;
    // vnp_Params['vnp_Merchant'] = ''
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_ExpireDate'] = expireDate;
    
    vnp_Params['vnp_TxnRef'] = orderId;
    if(bankCode !== null && bankCode !== ''){
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    var querystring = require('qs');
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var crypto = require("crypto");     
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    // res.redirect(vnpUrl)
    res.send(vnpUrl);
});
// Vui lòng tham khảo thêm tại code demo


module.exports = router;