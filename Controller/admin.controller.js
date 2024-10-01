const bcrypt = require('bcrypt');
const { Client } = require('pg');

const { config } = require('../Config/db');
const { createToken } = require('../Config/token.js');
const webPush = require('../Config/pushConfig.js');

var schemaName;

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

        const { userName, secretKey } = req.body;

        console.log(req.body);

        const checkEmail = await connection.query(`select * from public.partners where name = $1 and secretkey = $2`, [userName, secretKey]);

        if (!checkEmail.rows[0]) {
            console.log("User not found");
            return res.redirect('/admin');
        }

        res.cookie('schemaName','partner_' + checkEmail.rows[0].partnerid + '_' + checkEmail.rows[0].name.replace(/\s+/g, '_').toLowerCase());

        console.log(schemaName);

        // const checkPass = await bcrypt.compare(password, checkEmail.rows[0].password);

        // if (!checkPass) {
        //     console.log("Please enter right password");
        //     return res.redirect('/admin');
        // }
        // else {
        const payload = {
            partnerid: checkEmail.rows[0].partnerid,
            name: checkEmail.rows[0].name,
            secretkey: checkEmail.rows[0].secretkey
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
           
            return res.redirect('/admin/home');
        }
        else {
            console.log("Token not created");
        }
        // }
    }
    catch (e) {
        console.log(e);
        return res.redirect('back');
    }finally{
        await connection.end();
    }
};

module.exports.logout = (req, res) => {
    try {
        res.clearCookie('user');
        res.clearCookie('toAu');
        return res.redirect('/admin/');
    }
    catch (e) {
        console.log("Something went wrong", e);
    }
};

module.exports.home = async (req, res) => {
    const connection = new Client(config);
    try {
        await connection.connect();
        const currentUser = req.cookies.user;
        const schemaname = req.cookies.schemaName;
        const data = await connection.query(`select DISTINCT user_id from ${schemaname}.push_subscription;`);
        console.log(data.rows[0]);
        const activeUsers = (await connection.query(`select * from ${schemaname}.register where status = true;`)).rows;
        const user = data.rows;
        return res.render('adminPannel/index', { currentUser, activeUsers, user });
    }
    catch (e) {
        console.log("Something went wrong", e);
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
        let subscriptionsAlluser = [];
        for (let id of ids) {
            let x = await connection.query(`select endpoint, expirationTime, keys from ss_user_subscription where userid = ${id}`);
            x.rows.forEach(x => {
                subscriptionsAlluser.push(x)
            })
        }

        // Use a regular for...of loop to await each sendNotification call
        for (let subscription of subscriptionsAlluser) {
            try {
                await webPush.sendNotification(subscription, payload);
            } catch (error) {
                if (error.statusCode === 410) {
                    await connection.query(
                        'DELETE FROM public.ss_user_subscription WHERE endpoint = $1',
                        [subscription.endpoint]
                    );
                } else {
                    console.error('Error sending notification:', error);
                }
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