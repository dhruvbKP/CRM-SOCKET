const bcrypt = require('bcrypt');
const pgClient = require('../Config/db.js');
const { createToken } = require('../Config/token.js');

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

        const { email, password } = req.body;

        const checkEmail = await client.query(`select * from login_ss_user($1)`, [email]);

        if (!checkEmail) {
            console.log("User not found");
            return res.redirect('back');
        }

        const checkPass = await bcrypt.compare(password, checkEmail.rows[0].password);

        if (!checkPass) {
            console.log("Please enter right password");
            return res.redirect('back');
        }
        else {
            const trueStatus = await client.query(`select ss_user_status($1)`, [checkEmail.rows[0].id]);
            if (!trueStatus) {
                console.log("User not activat");
                return res.redirect('back');
            }
            else {
                const payload = {
                    id: checkEmail.rows[0].id,
                    email: checkEmail.rows[0].email,
                    password: checkEmail.rows[0].password
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
                    res.cookie('user', checkEmail.rows);
                    return res.redirect('/home');
                }
            }
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
    const currentUser = req.cookies.user;

    return res.render('index', { currentUser });
};

module.exports = { registerpage, registration, loginPage, login, logout, home }