const crypto = require('crypto');

// // Danh sách secretKey
// const secretKeys = {
//     key1: 'your-secret-key-1',
//     key2: 'your-secret-key-2',
// };

// Hàm mã hóa với 2 secretKey
function encryptURL(url, secretKey1, secretKey2) {
    console.log('url', url);
    console.log('url', secretKey1);
    console.log('url', secretKey2);
    const iv = crypto.randomBytes(16); // IV ngẫu nhiên cho mỗi bước mã hóa

    // Mã hóa lần 1 với secretKey1
    const cipher1 = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(secretKey1).digest(), iv);
    let encryptedStep1 = cipher1.update(url, 'utf8', 'base64');
    encryptedStep1 += cipher1.final('base64');

    // Mã hóa lần 2 với secretKey2
    const cipher2 = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(secretKey2).digest(), iv);
    let encryptedStep2 = cipher2.update(encryptedStep1, 'base64', 'base64');
    encryptedStep2 += cipher2.final('base64');

    return `${iv.toString('base64')}:${encryptedStep2}`; // Trả về IV và dữ liệu mã hóa 2 lần
}

export const baoloc = {
    encryptURL,
};
