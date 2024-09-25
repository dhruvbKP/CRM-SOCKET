const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const path = require('path')
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
// const vapidKeys = webpush.generateVAPIDKeys();
// const publicVapidKey = "BJxL572eTs5eqcKxEwrvKTd0KN_hi3W4_21b6hWAt0g2db9rYy4LrpEcHiE7GCRgw1EYMjVDcRsbzyzIP-hmL5c";
module.exports = { io };
// const privateVapidkey = "t6kpKZdC4yDXIg-jBMOLfH0uu6HwDQjd9d8iE-gtmTs";
const userRoutes = require('./routes/route.js');
const pushRoutes = require('./routes/pushRoute.js');
const PORT = 4545;
require('./controller/socketControl.js');
// const subscriptionModel = require('../models/subscriptionModel');
app.use(express.static(path.join(__dirname, 'client')))
app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.json())
app.use(express.json())


// webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapidkey);

app.use("/api", userRoutes);
app.use("/api2", pushRoutes);

// app.post('/subscribe', async (req, res) => {
//     const { subscription, name, message } = req.body;
//     console.log('Received subscription.');

//     if (!subscription.endpoint) {
//         console.error('Subscription is missing endpoint.');
//         return res.status(400).json({ error: 'Subscription must include an endpoint.' });
//     }

//     res.status(201).json({});
//     const payload = JSON.stringify({
//         "title": name,
//         "body": message,
//         "vibrate": [200, 100, 200],
//         "sound": `${path.join(__dirname, '/ringtone.mp3')}`,
//         "data": { url: "https://1c3a-103-251-16-214.ngrok-free.app " },
//         "timestamp": Date.now(),
//         "actions": [
//             {
//                 "action": "https://1c3a-103-251-16-214.ngrok-free.app ",
//                 "title": "View"
//             },
//             {
//                 "action": "dismiss",
//                 "title": "Dismiss"
//             }
//         ]
//     });

//     const subscriptions = await subscriptionModel.findAll();

//     subscriptions.forEach(subscription => {
//         webpush.sendNotification(subscription, payload)
//             .catch(err => console.error('Error sending notification', err));
//     });
// });
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public/index.html'))
// })

app.get('/notification', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/notification.html'))
})


server.listen(PORT, () => console.log(`app is running on :http://localhost:${PORT}/notification `))

