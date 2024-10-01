const cryptoJs = require('crypto-js');

module.exports.decryptData = async (partnerKey) => {
    try {
        if (partnerKey) {
            partnerKey = decodeURIComponent(partnerKey);
            const key = cryptoJs.enc.Utf8.parse("acg7ay8h447825cg");
            const iv = cryptoJs.enc.Utf8.parse("8080808080808080");
            const DecryptedSession = cryptoJs.AES.decrypt(partnerKey, key, {
                keySize: 128 / 8,
                iv: iv,
                mode: cryptoJs.mode.CBC,
                padding: cryptoJs.pad.Pkcs7,
            }).toString(cryptoJs.enc.Utf8);
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