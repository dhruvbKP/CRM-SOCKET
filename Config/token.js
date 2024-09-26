const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const base64Encode = (data) => {
    return Buffer.from(data).toString('base64').replace(/=+$/, '');
}

const base64Decode = (data) => {
    data = data.replace(/-/g, '+').replace(/_/g, '/');
    switch (data.length % 4) {
        case 0: break;
        case 2: data += '=='; break;
        case 3: data += '='; break;
        default: throw new Error('Illegal base64url string!');
    }
    return Buffer.from(data, 'base64').toString('utf8');
}

const createToken = (payload) => {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const encodeHeader = base64Encode(JSON.stringify(header));
    const encodePayload = base64Encode(JSON.stringify(payload));

    const signatureInput = `${encodeHeader}_${encodePayload}`;
    const signature = crypto.createHmac('sha256', process.env.SECRET_KEY).update(signatureInput).digest('base64');
    const encodeSignature = base64Encode(signature);

    return `${encodeHeader}_${encodePayload}_${encodeSignature}`;
};

const validateToken = (req, res, next) => {
    const binaryToText = (binaryString) => {
        const binaryArray = binaryString.split(' ');

        const text = binaryArray.map(binary => {
            const asciiValue = parseInt(binary, 2);
            return String.fromCharCode(asciiValue);
        }).join('');

        return text;
    };

    const token = binaryToText(req.cookies.toAu);

    if (!token) {
        console.log('Token not found');
        return res.redirect('/');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = token.split('_');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        console.log('Invalid token format');
        return res.redirect('/');
    }

    const signatureInput = `${encodedHeader}_${encodedPayload}`;
    const signature = crypto.createHmac('sha256', process.env.SECRET_KEY).update(signatureInput).digest('base64');
    const expectedSignature = base64Encode(signature);

    if (expectedSignature === encodedSignature) {
        try {
            const payload = base64Decode(encodedPayload);
            req.payload = JSON.parse(payload);
            next();
        } catch (error) {
            console.log('Invalid token payload');
            return res.redirect('/');
        }
    } else {
        console.log('Invalid token signature');
        return res.redirect('/');
    }
};

const validateAdminToken = (req, res, next) => {
    const binaryToText = (binaryString) => {
        const binaryArray = binaryString.split(' ');

        const text = binaryArray.map(binary => {
            const asciiValue = parseInt(binary, 2);
            return String.fromCharCode(asciiValue);
        }).join('');

        return text;
    };

    const token = binaryToText(req. cookies.toAu);

    if (!token) {
        console.log('Token not found');
        return res.redirect('/admin');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = token.split('_');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        console.log('Invalid token format');
        return res.redirect('/admin');
    }

    const signatureInput = `${encodedHeader}_${encodedPayload}`;
    const signature = crypto.createHmac('sha256', process.env.SECRET_KEY).update(signatureInput).digest('base64');
    const expectedSignature = base64Encode(signature);

    if (expectedSignature === encodedSignature) {
        try {
            const payload = base64Decode(encodedPayload);
            req.payload = JSON.parse(payload);
            next();
        } catch (error) {
            console.log('Invalid token payload');
            return res.redirect('/admin');
        }
    } else {
        console.log('Invalid token signature');
        return res.redirect('/admin');
    }
};

module.exports = { createToken, validateAdminToken, validateToken };