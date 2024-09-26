const bcrypt = require('bcrypt');
const { Client } = require('pg');

const { config } = require('../Config/db');
const { createToken } = require('../Config/token.js');
const webPush = require('../Config/pushConfig.js');


module.exports.registrationPage = (req, res) => {
    return res.render('adminPannel/registration');
};

module.exports.registration = async (req, res) => {
    const connection = new Client(config);
    try {
        await connection.connect();
        if (!req.body) {
            console.log("Please fill the form");
        }

        const { fname, lname, email, password } = req.body;
        const name = fname + ' ' + lname;
        const hashpassword = await bcrypt.hash(password, 10);
        const data = await connection.query(`select insert_ss_admin($1,$2,$3)`, [name, email, hashpassword]);
        if (data) {
            return res.redirect('/admin');
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
        await connection.end();
    }
};

module.exports.loginPage = (req, res) => {
    return res.render('adminPannel/login');
};

module.exports.login = async (req, res) => {
    const connection = new Client(config);
    try {
        await connection.connect();
        if (!req.body) {
            console.log("Please fill the form");
            return res.redirect('/admin');
        }

        const { email, password } = req.body;

        const checkEmail = await connection.query(`select * from login_ss_admin($1)`, [email]);

        console.log(checkEmail.rows[0]);

        if (!checkEmail.rows[0]) {
            console.log("User not found");
            return res.redirect('/admin');
        }

        const checkPass = await bcrypt.compare(password, checkEmail.rows[0].password);

        if (!checkPass) {
            console.log("Please enter right password");
            return res.redirect('/admin');
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
                await connection.end();
                return res.redirect('/admin/home');
            }
            else {
                console.log("Token not created");
            }
        }
    }
    catch (e) {
        console.log(e);
        await connection.end();
        return res.redirect('back');
    }
};

module.exports.logout = (req, res) => {
    try {
        res.clearCookie('user');
        res.clearCookie('toAu');
        return res.redirect('/admin/');
    }
    catch (e) {
        console.log(e);
        console.log("Something went wrong");
    }
};

module.exports.home = async (req, res) => {
    const connection = new Client(config);
    try {
        await connection.connect();
        const currentUser = req.cookies.user;
        const data = await connection.query('select * from ss_user_subscription');
        const user = data.rows;
        console.log(user);
        console.log()
        return res.render('adminPannel/index', { currentUser, user });
    }
    catch (e) {
        console.log(e);
        console.log("Something went wrong");
    }
    finally {
        await connection.end();
    }
};

module.exports.notify = async (req, res) => {
    const connection = new Client(config);
    try {
        await connection.connect();
        const { ids, body, title } = req.body;
        const payload = JSON.stringify({
            "title": body,
            "body": title,
            "vibrate": [200, 100, 200],
            "data": { url: "http://localhost:8070/" },
            "timestamp": Date.now(),
            "actions": [
                { action: "Explore Now", title: "Explore Now", icon: "http://localhost:8070/send.png" },
                { action: "dismiss", title: "Dismiss" }
            ]
        });
        let subscriptions = [];
        for (let id of ids) {
            let x = await connection.query(`select * from ss_user_subscription where t_id = ${id}`);
            subscriptions.push(x.rows[0]);
        }

        // Use a regular for...of loop to await each sendNotification call
        for (let subscription of subscriptions) {
            try {
                // console.log('Subscription ID:', subscription.id);
                await webPush.sendNotification(subscription, payload);
            } catch (error) {
                console.error('Error sending notification', error);
            }
        }

        res.status(200).json({});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    finally {
        await connection.end();
    }
};