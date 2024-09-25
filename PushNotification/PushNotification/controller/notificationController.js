const webPush = require('../confing/pushConfing.js');
const subscriptionModel = require('../model/subscriptionModel.js');
const path = require('path')

exports.subscribe = async (req, res) => {
    try {
        const { subscription, username } = req.body;
        await subscriptionModel.create(subscription, username);
        res.status(201).json({});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.notify = async (req, res) => {
    try {
        const { ids, body, title } = req.body;
        const payload = JSON.stringify({
            "title": body,
            "body": title,
            "vibrate": [200, 100, 200],
            "data": { url: "https://1c3a-103-251-16-214.ngrok-free.app/notification" },
            "timestamp": Date.now(),
            "actions": [
                { action: "Explore Now", title: "Explore Now", icon: "https://1c3a-103-251-16-214.ngrok-free.app/send.png" },
                { action: "dismiss", title: "Dismiss" }
            ]
        });
        let subscriptions = [];
        for (let id of ids) {
            let x = await subscriptionModel.findAll(id);
            subscriptions.push(x);
        }

        // Use a regular for...of loop to await each sendNotification call
        for (let subscription of subscriptions) {
            try {
                console.log('Subscription ID:', subscription.id);
                await webPush.sendNotification(subscription, payload);
            } catch (error) {
                console.error('Error sending notification', error);
            }
        }

        res.status(200).json({});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
