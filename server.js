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
const { decryptData } = require('./keyDecrypt.js')

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

var users = {};

var screenShare = {};

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
        const parsedData = JSON.parse(stringData);
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
            users[obj.partnerId][obj.userId] = obj.socketId;

            // Query the database to check user status
            let [partnerid, name, secretkey] = decryptData(obj.partnerId);
            const schemaName = 'partner' + '_' + partnerid + '_' + name.replace(/\s+/g, match => '_'.repeat(match.length))
            const result = await connection.query(`
                update $1.register
                set status = true
                where user_id = $2;`, [schemaName, obj.userId]);

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

            const partnerId = partners[obj.partnerId];
            socket.to(partnerId).emit(userData, binaryCode);
        } catch (err) {
            console.error('Error during processing:', err);
        } finally {
            await connection.end();
        }
    });

    const userClicked = binaryEvent('userClicked');
    socket.on(userClicked, (data) => {
        const stringData = binaryToString(data);
        const parsedData = JSON.parse(stringData);
        const userSocketId = users[parsedData.partnerId][parsedData.id];
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
    socket.on(request_screen_share, (data) => {
        const stringData = binaryToString(data);
        const parsedData = JSON.parse(stringData);
        const userSocketId = users[parsedData.partnerId][parsedData.id];
        const start_screen_share = binaryEvent('start_screen_share');
        socket.to(userSocketId).emit(start_screen_share);
    });

    const ice_candidate = binaryEvent('ice_candidate');
    socket.on(ice_candidate, (data) => {
        const jsonString = binaryToString(data);
        const obj = JSON.parse(jsonString);
        if (obj.id) {
            const candidateString = obj.candidate;
            const binaryCandidate = stringToBinary(JSON.stringify(candidateString));
            const userSocket = users[obj.partnerKey][obj.id];
            const ice_candidate = binaryEvent('ice_candidate');
            socket.to(userSocket).emit(ice_candidate, binaryCandidate);
        }
        else {
            const partnersocket = partners[obj.partneKey];
            const ice_candidate = binaryEvent('ice_candidate');
            io.to(partnersocket).emit(ice_candidate, data);
        }
    });

    const sendOffer = binaryEvent('sendOffer');
    socket.on(sendOffer, (offer, partnerKey) => {
        const partnerID = binaryToString(partnerKey);
        const partnerSocket = partners[partnerID];
        socket.to(partnerSocket).emit(sendOffer, offer);
    });

    const sendAnswer = binaryEvent('sendAnswer');
    socket.on(sendAnswer, (answer, id, partnerKey) => {
        const userId = binaryToString(id);
        const partnerId = binaryToString(partnerKey);
        const userSocketId = users[partnerId][userId];
        screenShare[userId] = 1;
        socket.to(userSocketId).emit(sendAnswer, answer);
    });

    const sentDataChunk = binaryEvent('sentDataChunk');
    socket.on(sentDataChunk, (chunk, index, totalChunk, partnerKey) => {
        const partnerId = binaryToString(partnerKey);
        const partnerSocketId = partners[partnerId];
        const sendChunkData = binaryEvent('sendChunkData');
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
    socket.on(stoppedScreenSharing, (partnerKey) => {
        const partnerId = binaryToString(partnerKey);
        const partnerSocket = partners[partnerId];
        socket.to(partnerSocket).emit(stoppedScreenSharing);
    });

    const deniedScreenSharing = binaryEvent('deniedScreenSharing');
    socket.on(deniedScreenSharing, (partnerKey) => {
        const partnerId = binaryToString(partnerKey);
        const partnerSocket = partners[partnerId];
        socket.to(partnerSocket).emit(deniedScreenSharing);
    });

    const sendUserSubscription = binaryEvent('sendUserSubscription');
    socket.on(sendUserSubscription, async (binarySubscription, binaryId, binaryName, partnerKey) => {
        const connection = new Client(config);
        try {
            await connection.connect();
            const binarySubscriptionObj = binaryToString(binarySubscription);
            let parseSubscription = JSON.parse(binarySubscriptionObj)
            let keys = JSON.stringify(parseSubscription.keys);
            const userId = binaryToString(binaryId);
            const userName = binaryToString(binaryName);
            const partnerId = binaryToString(partnerKey);
            let [partnerid, name, secretkey] = decryptData(partnerId);
            const schemaName = 'partner' + '_' + partnerid + '_' + name.replace(/\s+/g, match => '_'.repeat(match.length))
            const data = await connection.query(`select public.insert_push_subscription($1,$2,$3,$4,$5)`, [schemaName, userId, parseSubscription.endpoint, parseSubscription.expirationTime, keys]);
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

        const jsonString = JSON.stringify(parsedData);

        const binaryData = stringToBinary(jsonString);

        const sendNotification = binaryEvent('sendNotification');
        parsedData.id.forEach(element => {
            const userSocketId = users[parsedData.partnerId][element];
            socket.to(userSocketId).emit(sendNotification, (binaryData));
        });
    });

    socket.on('disconnect', async () => {

        const findPartnerId = (obj, value) => {
            for (const [outerKey, innerObject] of Object.entries(obj)) {
                for (const innerValue of Object.values(innerObject)) {
                    if (innerValue === value) {
                        return outerKey;
                    }
                }
            }
            return null;  // Return null if value is not found
        };

        const partnerId = findPartnerId(users, socket.id);

        const adminSocket = partners[partnerId];

        function findKeyByValue(users, targetValue) {
            let targetKey = null;

            for (const userId in users) {
                const sockets = users[userId];
                for (const key in sockets) {
                    if (sockets[key] === targetValue) {
                        targetKey = key;
                        break;
                    }
                }
                if (targetKey) break;
            }

            return targetKey;
        }

        // Call the function and log the result
        const userId = findKeyByValue(users, socket.id);
        if (screenShare[userId] === 1) {
            screenShare[userId] = 0;
            const stoppedScreenSharing = binaryEvent('stoppedScreenSharing');
            socket.to(adminSocket).emit(stoppedScreenSharing);
        }

        const connection = new Client(config);
        try {
            if (userId) {
                await connection.connect();
                let [partnerid, name, secretkey] = decryptData(partnerId);
                const schemaName = 'partner' + '_' + partnerid + '_' + name.replace(/\s+/g, match => '_'.repeat(match.length))
                const result = await connection.query(`
                    update $1.register
                    set status = false
                    where user_id = $2;`, [schemaName, userId]);
                delete users[partnerId][userId];
                const activeUsers = Object.keys(users[partnerId]).length;
                const data = { activeUsers, userId: userId }
                const jsonstring = JSON.stringify(data);

                const binaryCode = stringToBinary(jsonstring);
                const userLogout = binaryEvent('userLogout');
                socket.to(adminSocket).emit(userLogout, (binaryCode));
            }
            for (const userId in users[partnerId]) {
                if (users[partnerId][userId] === socket.id) {
                    const userLogout = binaryEvent('userLogout');
                    const data = {
                        userId
                    };

                    const jsonString = JSON.stringify(data);

                    const binaryCode = stringToBinary(jsonString);

                    socket.to(adminSocket).emit(userLogout, (binaryCode));
                    delete users[partnerId][userId];
                    break;
                }
            }

        } catch (err) {
            console.error(err);
        } finally {
            await connection.end();
        }
    });
});

server.listen(process.env.PORT, (e) => {
    e ? console.log(e) : console.log('Server is running on port :- ', process.env.PORT);
});