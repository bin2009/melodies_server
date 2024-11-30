import CryptoJS from 'crypto-js';

const encodeData = (data) => {
    const payload = JSON.stringify(data.split('PBL6/')[1]);
    const SECRET_KEY = process.env.ENCODE_KEY;
    const encrypted = CryptoJS.AES.encrypt(payload, SECRET_KEY).toString();
    return encrypted;
};

export default encodeData;
