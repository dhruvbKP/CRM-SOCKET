let cryptoJS = require('crypto-js');
const decryptData = async (partnerKey) => {
    try {
        if (partnerKey) {
            partnerKey = decodeURIComponent(partnerKey);
            const key = cryptoJS.enc.Utf8.parse("acg7ay8h447825cg");
            const iv = cryptoJS.enc.Utf8.parse("8080808080808080");
            const DecryptedSession = cryptoJS.AES.decrypt(partnerKey, key, {
                keySize: 128 / 8,
                iv: iv,
                mode: cryptoJS.mode.CBC,
                padding: cryptoJS.pad.Pkcs7,
            }).toString(cryptoJS.enc.Utf8);
            const DecryptData = DecryptedSession.split(':');

            if (DecryptData) {
                return DecryptData;
            } else {
                console.log("Data not decrypted correctly");
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
    }
};

module.exports = {decryptData}