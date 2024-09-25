// Example using an in-memory store. Replace with your database logic.
const { where } = require('sequelize');
const { Subscription } = require('./schema.js')


exports.create = async (subscription,userName) => {
    try {
        if (!await Subscription.findOne({ where: { endpoint: subscription.endpoint } })) {
            const newUser = await Subscription.create({
                name: userName,
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime,
                keys: subscription.keys
            });
        } else {
            await Subscription.update(
                { name: userName },
                { where: { endpoint: subscription.endpoint } }
            );
        }
    } catch (err) {
       console.log(err);  
    }
};

exports.findAll = async (usersId) => {
    try {
        let userData;
        userData = await Subscription.findOne({ where: { id: usersId } });
        return JSON.parse(JSON.stringify(userData));
    } catch (err) {
        console.log(err); 
    }
};
