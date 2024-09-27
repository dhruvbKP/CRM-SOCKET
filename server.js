const express = require('express');
const { createServer } = require('http');
const { Client } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cp = require('cookie-parser');
const { Server } = require('socket.io');
const { config } = require('./Config/db');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    cors: {
        origin: "*",
        // methods: ["GET", "POST"],
        // allowedHeaders: ["my-custom-header"],
        // credentials: true
    }
});

app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.json({ limit: '50mb', extended: true }));
app.use(cors());
app.use(cp());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.set('view engine', 'ejs');
app.set('Views', path.join(__dirname, 'Views'));

app.use(express.static(path.join(__dirname, 'userassets')));
app.use(express.static(path.join(__dirname, 'adminAssets')));

app.use('/', require('./routes/index'));
app.get('/api/', (req, res) => {
    res.status(200).send("Working API..!");
});

var adminSocket;

var userSocket = {};

var partners = {};

var users = {}

function binaryToString(binaryStr) {
    return binaryStr.split(' ').map(bin => {
        const asciiValue = parseInt(bin, 2);

        return String.fromCharCode(asciiValue);
    }).join('');
};

function stringToBinary(str) {
    return str.split('')
        .map(char => {
            const binary = char.charCodeAt(0).toString(2);
            return binary.padStart(8, '0');
        })
        .join(' ');
};

const binaryEvent = (event) => {
    return event.split('').map(char => {
        const asciiValue = char.charCodeAt(0);


        const binaryValue = asciiValue.toString(2);

        return binaryValue.padStart(8, '0');
    }).join(' ');
};

io.on('connection', async (socket) => {
    console.log('New user connected');

    const adminConnected = binaryEvent('adminConnected');
    socket.on(adminConnected, (data) => {
        const stringData = binaryToString(data);
        console.log(stringData);
        const parsedData = JSON.parse(stringData);
        console.log(parsedData);
        partners[parsedData.partnerId] = parsedData.socketId;
        console.log("Admin socket id :- ", parsedData.socketId);
    });

    const userJoined = binaryEvent('userJoined');
    socket.on(userJoined, async (data) => {
        const connection = new Client(config);
        try {
            await connection.connect();
            // Convert binary data to string, then parse to JSON
            const jsonstring = binaryToString(data);
            const obj = JSON.parse(jsonstring);

            // Store user socket info
            // userSocket[obj.userId] = obj.socketId;

            if (!users[obj.partnerId]) {
                users[obj.partnerId] = {};
            }

            console.log(obj);

            users[obj.partnerId][obj.userId] = obj.socketId;

            console.log(users);

            // Query the database to check user status
            const result = await connection.query(`SELECT ss_user_status($1)`, [obj.userId]);

            // Check the result of the query
            if (result.rows.length > 0 && result.rows[0].ss_user_status) {
                console.log("User activated");
            } else {
                console.log("User not activated");
            }
            const activeUsers = Object.keys(userSocket).length;
            const udata = {
                userName: obj.userName,
                userId: obj.userId,
                userSockets: userSocket,
                ipAdd: obj.ipAdd,
                deviceInfo: obj.deviceInfo,
                activeUsers: activeUsers
            };

            // Convert data to JSON string and then to binary
            const jsonString = JSON.stringify(udata);
            const binaryCode = stringToBinary(jsonString);
            const userData = binaryEvent('userData');
            socket.to(adminSocket).emit(userData, binaryCode);

        } catch (err) {
            console.error('Error during processing:', err);
        } finally {
            await connection.end();
        }
    });

    const userClicked = binaryEvent('userClicked');
    socket.on(userClicked, (data) => {
        const stringData = binaryToString(data);
        console.log(stringData);
        const parsedData = JSON.parse(stringData);
        console.log(parsedData, '--parsedData--');
        const userSocketId = users[parsedData.partnerId][parsedData.id];
        console.log(userSocketId, '--userSocketId--');
        socket.to(userSocketId).emit(userClicked);
    });

    const ipInfo = binaryEvent('ipInfo');
    socket.on(ipInfo, (partnerId, id) => {
        userId = binaryToString(id);
        partnerKey = binaryToString(partnerId);
        const userSocketId = users[partnerKey][userId];
        socket.to(userSocketId).emit(ipInfo);
    });

    const sendIpInfo = binaryEvent('sendIpInfo');
    socket.on(sendIpInfo, (partnerKey, ip) => {
        const partnerId = binaryToString(partnerKey);
        const partnerSocket = partners[partnerId];
        socket.to(partnerSocket).emit(sendIpInfo, (ip));
    });

    const deviceInfo = binaryEvent('deviceInfo');
    socket.on(deviceInfo, (partnerID, id) => {
        userId = binaryToString(id);
        partnerKey = binaryToString(partnerID);
        const userSocketId = users[partnerKey][userId];
        const DeviceInfo = binaryEvent('DeviceInfo');
        socket.to(userSocketId).emit(DeviceInfo);
    });

    const sendDeviceInfo = binaryEvent('sendDeviceInfo');
    socket.on(sendDeviceInfo, (dInfo, ip, partnerKey) => {
        const partnerId = binaryToString(partnerKey);
        const partnerSocket = partners[partnerId];
        socket.to(partnerSocket).emit(sendDeviceInfo, dInfo, ip);
    });

    // const screenShareClicked = binaryEvent('screenShareClicked');
    // socket.on(screenShareClicked, (id) => {
    //     function binaryToString(binaryStr) {
    //         return binaryStr.split(' ').map(bin => {
    //             const asciiValue = parseInt(bin, 2);

    //             return String.fromCharCode(asciiValue);
    //         }).join('');
    //     };
    //     userId = binaryToString(id);
    //     const userSocketId = userSocket[userId];
    //     io.to(userSocketId).emit(screenShareClicked, (id));
    // });

    const request_screen_share = binaryEvent('request_screen_share');
    socket.on(request_screen_share, (id) => {
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        const start_screen_share = binaryEvent('start_screen_share');
        socket.to(userSocketId).emit(start_screen_share);
    });

    const ice_candidate = binaryEvent('ice_candidate');
    socket.on(ice_candidate, (data) => {
        if (data.id) {
            const jsonString = binaryToString(data);
            const obj = JSON.parse(jsonString);
            const candidateString = JSON.parse(obj.candidate);
            const binaryCandidate = stringToBinary(candidateString);
            const ice_candidate = binaryEvent('ice_candidate');
            socket.to(obj.id).emit(ice_candidate, binaryCandidate);
        }
        else {
            const ice_candidate = binaryEvent('ice_candidate');
            io.to(adminSocket).emit(ice_candidate, data);
        }
    });

    const sendOffer = binaryEvent('sendOffer');
    socket.on(sendOffer, (offer) => {
        socket.to(adminSocket).emit(sendOffer, offer);
    });

    const sendAnswer = binaryEvent('sendAnswer');
    socket.on(sendAnswer, (answer, id) => {
        const idString = binaryToString(id);
        const parsedId = JSON.parse(idString);

        const userSocketId = userSocket[parsedId];
        socket.to(userSocketId).emit(sendAnswer, answer);
    });

    const sentDataChunk = binaryEvent('sentDataChunk');
    socket.on(sentDataChunk, (chunk, index, totalChunk, partnerKey) => {
        const partnerId = binaryToString(partnerKey);
        console.log(partnerId, '--partnerId--');
        const partnerSocketId = partners[partnerId];
        const sendChunkData = binaryEvent('sendChunkData');
        console.log(partners, '--partners--');
        console.log(partnerSocketId, '--partnerSocketId--');
        socket.to(partnerSocketId).emit(sendChunkData, chunk, index, totalChunk);
    });

    // const sentscreenSharing = binaryEvent('sentscreenSharing');
    // socket.on(sentscreenSharing, (chunk, index, totalChunk) => {
    //     const sentscreenSharing = binaryEvent('sentscreenSharing');
    //     io.to(adminSocket).emit(sentscreenSharing, chunk, index, totalChunk);
    // });

    const location = binaryEvent('location');
    socket.on(location, (id, partnerKey) => {
        userId = binaryToString(id);
        const partnerid = binaryToString(partnerKey);
        const userSocketId = users[partnerid][userId];
        socket.to(userSocketId).emit(location);
    });

    const sendLocation = binaryEvent('sendLocation');
    socket.on(sendLocation, (lat, lon, partnerkey) => {
        const partnerID = binaryToString(partnerkey);
        const partnerSocket = partners[partnerID];
        socket.to(partnerSocket).emit(sendLocation, lat, lon);
    });

    const stoppedScreenSharing = binaryEvent('stoppedScreenSharing');
    socket.on(stoppedScreenSharing, () => {
        socket.to(adminSocket).emit(stoppedScreenSharing);
    });

    const deniedScreenSharing = binaryEvent('deniedScreenSharing');
    socket.on(deniedScreenSharing, () => {
        socket.to(adminSocket).emit(deniedScreenSharing);
    });

    const sendUserSubscription = binaryEvent('sendUserSubscription');
    socket.on(sendUserSubscription, async (binarySubscription, binarySubscriptionKey, binaryId, binaryName, expiredTime) => {
        const connection = new Client(config);
        try {
            await connection.connect();
            // const parsedSubscriptionKey = JSON.parse(binarySubscriptionKey);
            // const subscriptionKey = binaryToString(parsedSubscriptionKey);
            const subscriptionEndpoint = binaryToString(binarySubscription);
            const userId = binaryToString(binaryId);
            const userName = binaryToString(binaryName);
            const data = await connection.query(`select insert_ss_user_subscription($1,$2,$3,$4,$5)`, [userId, subscriptionEndpoint, binarySubscriptionKey.keys, expiredTime, userName]);

        } catch (err) {
            console.log(err);

        } finally {
            await connection.end();
        }
    });

    const sendNotification = binaryEvent('sendNotification');
    socket.on(sendNotification, (data) => {
        const obj = binaryToString(data);

        const parsedData = JSON.parse(obj); ``

        const jsonString = JSON.stringify(parsedData);

        const binaryData = stringToBinary(jsonString);

        const sendNotification = binaryEvent('sendNotification');
        parsedData.id.forEach(element => {
            const userSocketId = users[parsedData.partnerId][element];
            socket.to(userSocketId).emit(sendNotification, (binaryData));
        });
    });

    socket.on('disconnect', async () => {
        const stoppedScreenSharing = binaryEvent('stoppedScreenSharing');
        socket.to(adminSocket).emit(stoppedScreenSharing);

        const connection = new Client(config);
        try {
            let offlineId = Object.keys(userSocket).filter(key => userSocket[key] === socket.id)[0];

            if (offlineId) {
                await connection.connect();
                const falseStatus = await connection.query(`select ss_user_logout($1)`, [offlineId]);
                await connection.end();

                delete userSocket[offlineId];
                const activeUsers = Object.keys(userSocket).length;
                const data = { activeUsers, userId: offlineId }
                const jsonstring = JSON.stringify(data);

                const binaryCode = stringToBinary(jsonstring);
                const userLogout = binaryEvent('userLogout');
                socket.to(adminSocket).emit(userLogout, (binaryCode));
            }
            for (const userId in userSocket) {
                if (userSocket[userId] === socket.id) {
                    const userLogout = binaryEvent('userLogout');
                    const data = {
                        userId
                    };

                    const jsonString = JSON.stringify(data);

                    const binaryCode = stringToBinary(jsonString);

                    socket.to(adminSocket).emit(userLogout, (binaryCode));
                    delete userSocket[userId];
                    break;
                }
            }

        } catch (err) {
            console.error(err);
        }
    });
});

server.listen(process.env.PORT, (e) => {
    e ? console.log(e) : console.log('Server is running on port :- ', process.env.PORT);
});