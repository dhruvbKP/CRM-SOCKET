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
    socket.on(adminConnected, (adminId) => {
        adminSocket = binaryToString(adminId);
        console.log("Admin socket id :- ", adminSocket);
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
            userSocket[obj.userId] = obj.socketId;

            // Query the database to check user status
            const result = await connection.query(`SELECT ss_user_status($1)`, [obj.userId]);

            // Check the result of the query
            if (result.rows.length > 0 && result.rows[0].ss_user_status) {
                console.log("User activated");
            } else {
                console.log("User not activated");
            }

            // Get the active user count
            const activeUsers = Object.keys(userSocket).length;

            // Prepare the data to send
            const udata = {
                userName: obj.userName,
                userId: obj.userId,
                userSockets: userSocket,
                ipAdd: obj.ipAdd,
                deviceInfo: obj.deviceInfo,
                activeUsers: activeUsers
            };

            console.log(udata);

            // Convert data to JSON string and then to binary
            const jsonString = JSON.stringify(udata);
            const binaryCode = stringToBinary(jsonString);

            // Prepare and emit the event to admin socket
            const userData = binaryEvent('userData');
            socket.to(adminSocket).emit(userData, binaryCode);

        } catch (err) {
            console.error('Error during processing:', err);
        } finally {
            // Close the connection
            await connection.end();
        }
    });


    const userClicked = binaryEvent('userClicked');
    socket.on(userClicked, (id) => {
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        socket.to(userSocketId).emit(userClicked, (id));
    });

    const ipInfo = binaryEvent('ipInfo');
    socket.on(ipInfo, (id) => {
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        socket.to(userSocketId).emit(ipInfo);
    });

    const sendIpInfo = binaryEvent('sendIpInfo');
    socket.on(sendIpInfo, (ip) => {
        socket.to(adminSocket).emit(sendIpInfo, (ip));
    });

    const deviceInfo = binaryEvent('deviceInfo');
    socket.on(deviceInfo, (id) => {
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        const DeviceInfo = binaryEvent('DeviceInfo');
        socket.to(userSocketId).emit(DeviceInfo);
    });

    const sendDeviceInfo = binaryEvent('sendDeviceInfo');
    socket.on(sendDeviceInfo, (dInfo, ip) => {
        socket.to(adminSocket).emit(sendDeviceInfo, dInfo, ip);
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
    socket.on(sentDataChunk, (chunk, index, totalChunk) => {
        const sendChunkData = binaryEvent('sendChunkData');
        socket.to(adminSocket).emit(sendChunkData, chunk, index, totalChunk);
    });

    // const sentscreenSharing = binaryEvent('sentscreenSharing');
    // socket.on(sentscreenSharing, (chunk, index, totalChunk) => {
    //     const sentscreenSharing = binaryEvent('sentscreenSharing');
    //     io.to(adminSocket).emit(sentscreenSharing, chunk, index, totalChunk);
    // });

    const location = binaryEvent('location');
    socket.on(location, (id) => {
        userId = binaryToString(id);
        const userSocketId = userSocket[userId];
        socket.to(userSocketId).emit(location, id);
    });

    const sendLocation = binaryEvent('sendLocation');
    socket.on(sendLocation, (lat, lon) => {
        socket.to(adminSocket).emit(sendLocation, lat, lon);
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

        const parsedData = JSON.parse(obj);

        const userSocketId = userSocket[parsedData.id];

        const jsonString = JSON.stringify(parsedData);

        const binaryData = stringToBinary(jsonString);

        const sendNotification = binaryEvent('sendNotification');
        socket.to(userSocketId).emit(sendNotification, (binaryData));
    });

    socket.on('disconnect', async () => {
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