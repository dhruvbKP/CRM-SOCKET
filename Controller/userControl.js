const bcrypt = require('bcrypt');
const pgClient = require('../Config/db.js');
const { createToken } = require('../Config/token.js');
const { decryptData } = require('../keyDecrypt.js');

const registerpage = (req, res) => {
    return res.render('registration');
};

const registration = async (req, res) => {

    const client = await pgClient.connect();
    try {
        if (!req.body) {
            console.log("Please fill the form");
        }
        const { fname, lname, email, password } = req.body;
        const name = fname + ' ' + lname;
        const hashpassword = await bcrypt.hash(password, 10);
        req.body.status = false;
        const data = await client.query(`select insert_ss_user($1,$2,$3,$4)`, [name, email, hashpassword, req.body.status]);
        if (data) {
            return res.redirect('/');
        }
        else {
            return res.redirect('back');
        }
    }
    catch (e) {
        console.log(e);
        return res.redirect('back');
    }
    finally {
        await client.release();
    }
};

const loginPage = (req, res) => {
    return res.render('login');
};

const login = async (req, res) => {
    const client = await pgClient.connect();
    try {
        if (!req.body) {
            console.log("Please fill the form");
        }

        const { user_id } = req.body;
        const { partner_key } = req.headers;

        const [partnerid, name, secret_key] = await decryptData(partner_key);

        const schemaName = `partner_${partnerid}_${name.trim().replace(/\s+/g, "_").toLowerCase()}`;

        console.log(schemaName, '-- partner --');

        const checkUser = await client.query(`SELECT * FROM ${schemaName}.users WHERE user_id = ${user_id}`);

        console.log(checkUser.rows[0]);

        if (!checkUser.rows[0]) {
            console.log("User not found");
            return res.redirect('back');
        }
        const payload = {
            id: checkUser.rows[0].id,
            external_user_id: checkUser.rows[0].external_user_id,
        }
        const token = createToken(payload);
        if (token) {
            const binaryToken = (event) => {
                return event.split('').map(char => {
                    const asciiValue = char.charCodeAt(0);
                    const binaryValue = asciiValue.toString(2);
                    return binaryValue.padStart(8, '0');
                }).join(' ');
            };
            const binaryTokenString = binaryToken(token);
            res.cookie('toAu', binaryTokenString);
            res.cookie('user', checkUser.rows[0]);
            return res.redirect('/home');
        }
    }
    catch (e) {
        console.log(e);
        return res.redirect('back');
    }
    finally {
        await client.release();
    }
};

const logout = async (req, res) => {

    const client = await pgClient.connect();
    try {
        const userData = req.cookies.user;
        const checkEmail = await client.query(`select * from login_ss_user($1)`, [userData[0].email]);

        if (!checkEmail) {
            console.log("User not found");
        } else {
            const falseStatus = await client.query(`select ss_user_logout($1)`, [checkEmail.rows[0].id]);
            if (!falseStatus) {
                console.log("User not activated");
                return res.redirect('back');
            }
            else {
                res.clearCookie('user');
                res.clearCookie('toAu');
                return res.redirect('/');
            }
        }
    }
    catch (e) {
        console.log(e);
        console.log("Something went wrong");
    }
    finally {
        await client.release();
    }
};

const home = (req, res) => {
    const currentUser = [{ user_id: req.cookies.user.user_id, external_user_id: req.cookies.user.external_user_id }];

    return res.render('index', { currentUser });
};

module.exports = { registerpage, registration, loginPage, login, logout, home }