const socket = io();

const ul = document.getElementById('ul');
const ssDiv = document.getElementById('ss');
const infoDiv = document.getElementById('info');
const div = document.createElement('div');
const h5 = document.getElementById('totalUser');
const dropdown = document.querySelectorAll('dropdown-menu');
const stopScreen = document.getElementById('stopScreen');
const screen_shot = document.getElementById('screen_shot');
const map = document.querySelector('.map');
const dataModel = document.getElementById('data');
const selectAllCheckBox = document.getElementById('selectAllCheckBox');
const userCheckBox = document.querySelectorAll('.userCheckBox');
const pushForm = document.getElementById('pushForm');
const notificationModel = document.getElementById('notificationModel');
var span = document.getElementsByClassName("close")[0];
const notificationForm = document.getElementById('notificationForm');
const currentUsers = document.getElementsByClassName('userName');
const currentUserLi = document.getElementsByClassName('active');

span.onclick = function () {
    notificationModel.style.display = "none";
};

let videoElement = document.createElement('video');

let receivedChunks = [];
let totalChunksExpected = 0;
let interValId;
let intervalLocation;
let userId;
let obj;

let usersubscriptionIds = [];

const demo = (id) => {
    const isCurrentlySelected = userId === id;

    if (!isCurrentlySelected) {
        dataModel.style.display = 'flex';
        userId = id;

        if (ssDiv.children[0]) {
            ssDiv.children[0].remove();
        }
        if (infoDiv.innerText) {
            infoDiv.style.display = 'none';
        }
        if (map.innerHTML) {
            clearInterval(intervalLocation);
            map.style.display = 'none';
        }
    } else {
        dataModel.style.display = dataModel.style.display === 'flex' ? 'none' : 'flex';
    }

    infoDiv.style.display = 'none';
    if (map.innerHTML) {
        map.style.display = 'none';
        clearInterval(intervalLocation);
    }
    if (ssDiv.children[0]) {
        ssDiv.children[0].remove();
    }
};

let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

selectAllCheckBox.addEventListener('change', () => {
    userCheckBox.forEach(checkbox => {
        checkbox.checked = selectAllCheckBox.checked;
    });
});

userCheckBox.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        if (!checkbox.checked) {
            selectAllCheckBox.checked = false;
        } else if (Array.from(userCheckBox).every(cb => cb.checked)) {
            selectAllCheckBox.checked = true;
        }
    });
});

userCheckBox.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            usersubscriptionIds.push(checkbox.value);
        }
        else {
            usersubscriptionIds = usersubscriptionIds.filter(item => item !== checkbox.value);
        }
        console.log(usersubscriptionIds);
    });
});

selectAllCheckBox.addEventListener('change', () => {
    userCheckBox.forEach(checkbox => {
        if (selectAllCheckBox.checked) {
            usersubscriptionIds.push(checkbox.value);
            usersubscriptionIds = usersubscriptionIds.filter((value, index, self) => self.indexOf(value) === index);
        }
        else {
            usersubscriptionIds = usersubscriptionIds.filter(item => item !== checkbox.value);
        }
        console.log(usersubscriptionIds);
    });
});

pushForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    var formData = new FormData(pushForm);
    const message = formData.get('pushMessage');
    const title = formData.get('pushTitle');

    await fetch('http://localhost:8070/admin/notification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ids: usersubscriptionIds,
            body: message,
            title: title
        })
    })
});

socket.on('connect', async () => {
    console.log("user Connected :- ", socket.id);

    const binaryEvent = (event) => {
        return event.split('').map(char => {
            const asciiValue = char.charCodeAt(0);

            const binaryValue = asciiValue.toString(2);

            return binaryValue.padStart(8, '0');
        }).join(' ');
    };

    function stringToBinary(str) {
        return str.split('').map(char => {
            const asciiValue = char.charCodeAt(0);

            const binaryValue = asciiValue.toString(2);

            return binaryValue.padStart(8, '0');
        }).join(' ');
    };

    function binaryToString(binary) {
        return binary.split(' ')
            .map(bin => String.fromCharCode(parseInt(bin, 2)))
            .join('');
    }

    const socketId = stringToBinary(socket.id);

    const adminConnected = binaryEvent('adminConnected');
    socket.emit(adminConnected, socketId);

    const userData = binaryEvent('userData');
    socket.on(userData, (data) => {

        const jsonstring = binaryToString(data);

        const obj = JSON.parse(jsonstring);

        h5.innerHTML = obj.activeUsers;

        if (document.getElementById(obj.userId)) return;

        const li = document.createElement('li');
        const h3 = document.createElement('h3');

        li.classList.add('active');
        li.classList.add('has-sub');

        h3.classList.add('userName');

        // const nameDiv = document.createElement('div');
        // nameDiv.style.display = 'flex';
        // const checkBox = document.createElement('input');
        // checkBox.style.width = '20px';
        // checkBox.style.marginRight = '10px';

        // checkBox.type = 'checkBox';

        h3.innerHTML = `${obj.userName}`;
        h3.style.cursor = 'pointer';
        // nameDiv.appendChild(checkBox);
        // nameDiv.appendChild(h3);

        // document.getElementById('hr').style.display = 'block';
        // document.getElementById('selectAll').style.display = 'flex';

        // li.appendChild(nameDiv);
        li.appendChild(h3);
        li.setAttribute('id', obj.userId);
        li.style.marginBottom = '20px';

        h3.addEventListener('click', () => {
            const isCurrentlySelected = userId === li.id;

            if (!isCurrentlySelected) {
                dataModel.style.display = 'flex';
                userId = li.id;

                if (ssDiv.children[0]) {
                    ssDiv.children[0].remove();
                }
                if (infoDiv.innerText) {
                    infoDiv.style.display = 'none';
                }
                if (map.innerHTML) {
                    clearInterval(intervalLocation);
                    map.style.display = 'none';
                }
            } else {
                dataModel.style.display = dataModel.style.display === 'flex' ? 'none' : 'flex';
            }

            infoDiv.style.display = 'none';
            if (map.innerHTML) {
                map.style.display = 'none';
                clearInterval(intervalLocation);
            }
            if (ssDiv.children[0]) {
                ssDiv.children[0].remove();
            }
        });

        // ul.innerHTML = `<h2 style="margin: 10px 0 20px 0">Current users</h2>`
        ul.appendChild(li);

    });

    document.getElementById('screenShot').addEventListener('click', () => {
        infoDiv.style.display = 'none';
        clearInterval(intervalLocation);
        map.style.display = 'none';
        videoElement.remove();

        const id = stringToBinary(userId);
        const userClicked = binaryEvent('userClicked');
        socket.emit(userClicked, id);
    });

    document.getElementById('screenShare').addEventListener('click', () => {
        infoDiv.style.display = 'none';
        clearInterval(intervalLocation);
        map.style.display = 'none';
        if (ssDiv.children[0]) {
            ssDiv.children[0].remove();
        }

        const id = stringToBinary(userId);
        // const screenShareClicked = binaryEvent('screenShareClicked');

        // startScreenSharing(screenShareClicked, id);

        // stopScreen.style.display = 'block'

        const request_screen_share = binaryEvent('request_screen_share');
        socket.emit(request_screen_share, id);
    });

    document.getElementById('notification').addEventListener('click', () => {
        notificationModel.style.display = 'block';
    });

    document.getElementById('sendNotification').addEventListener('click', (e) => {
        e.preventDefault();

        const formData = new FormData(notificationForm);
        const notificationTitle = formData.get('notificationTitle');
        const notificationMessage = formData.get('notificationMessage');
        const notificationPosition = formData.get('notificationPosition');

        notificationTitle.text = '';
        notificationMessage.text = '';
        notificationPosition.text = '';

        notificationModel.style.display = 'none';

        const data = {
            id: userId,
            title: notificationTitle,
            message: notificationMessage,
            position: notificationPosition
        }

        const jsonString = JSON.stringify(data);

        const binaryData = stringToBinary(jsonString);

        const sendNotification = binaryEvent('sendNotification');
        socket.emit(sendNotification, binaryData);
    });

    const sendOffer = binaryEvent('sendOffer');
    socket.on(sendOffer, async (offer) => {
        const jsonString = binaryToString(offer);
        const parsedOffer = JSON.parse(jsonString);
        peerConnection = new RTCPeerConnection(configuration);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const ice_candidate = binaryEvent('ice_candidate');
                const data = {
                    candidate: event.candidate,
                    id: userId
                };
                const jsonString = JSON.stringify(data);
                const binaryData = stringToBinary(jsonString);
                socket.emit(ice_candidate, binaryData);
            }
        };

        peerConnection.ontrack = (event) => {
            if (event.streams[0]) {
                videoElement.srcObject = event.streams[0];
                videoElement.autoplay = true;
                videoElement.style.width = '100%';
                ssDiv.style.display = 'block';
                ssDiv.style.width = '100%';
                ssDiv.style.height = '100%';
                ssDiv.appendChild(videoElement);
            } else {
                console.error('No video stream received');
            }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(parsedOffer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        const string = JSON.stringify(answer);
        const binaryAnswer = stringToBinary(string);
        const id = stringToBinary(userId);
        const sendAnswer = binaryEvent('sendAnswer');
        socket.emit(sendAnswer, binaryAnswer, id);
    });

    const ice_candidate = binaryEvent('ice_candidate');
    socket.on(ice_candidate, async (data) => {
        const jsonString = binaryToString(data);
        const parsedData = JSON.parse(jsonString);
        await peerConnection.addIceCandidate(new RTCIceCandidate(parsedData.candidate));
    });

    // const startScreenSharing = (screenShareClicked, id) => {
    //     if (interValId) {
    //         clearInterval(interValId);
    //     }
    //     interValId = setInterval(() => {
    //         socket.emit(screenShareClicked, id);
    //     }, 500);
    // };

    // stopScreen.addEventListener('click', () => {
    //     if (interValId) {
    //         ssDiv.style.display = 'none';
    //         clearInterval(interValId);
    //         interValId = null;
    //         stopScreen.style.display = 'none';
    //     }
    // });

    document.getElementById('ipInfo').addEventListener('click', () => {
        const id = stringToBinary(userId);
        const ipInfo = binaryEvent('ipInfo');
        socket.emit(ipInfo, (id));
    });

    const sendIpInfo = binaryEvent('sendIpInfo');
    socket.on(sendIpInfo, (ip) => {
        const ipAdd = binaryToString(ip);
        infoDiv.style.display = 'block';
        ssDiv.style.display = 'none';
        map.style.display = 'none';
        clearInterval(intervalLocation);
        infoDiv.innerHTML = `<h3>Ip address :- ${ipAdd}</h3>`;
    });

    document.getElementById('deviceinfo').addEventListener('click', () => {
        // infoDiv.style.display = 'block';
        // ssDiv.style.display = 'none';
        // map.style.display = 'none';
        // clearInterval(intervalLocation);
        // infoDiv.innerHTML = `
        // <h3>Country :- ${obj.ipAdd.country}</h3>
        // <h3>Region :- ${obj.ipAdd.regionName}</h3>
        // <h3>City :- ${obj.ipAdd.city}</h3>
        // <h3>Latitude :- ${obj.ipAdd.lat}</h3>
        // <h3>longitude :- ${obj.ipAdd.lat}</h3>
        // <h3>Zip-code :- ${obj.ipAdd.zip}</h3>
        // <h3>Internet service provider :- ${obj.ipAdd.isp}</h3>
        // <h3>Device memory :- ${obj.deviceInfo.deviceMemory} GB</h3>
        // `

        const id = stringToBinary(userId);
        const deviceInfo = binaryEvent('deviceInfo');
        socket.emit(deviceInfo, (id));
    });

    const sendDeviceInfo = binaryEvent('sendDeviceInfo');
    socket.on(sendDeviceInfo, (deviceinfo, ip) => {
        const DeviceInfo = binaryToString(deviceinfo);
        const deviceInfo = JSON.parse(DeviceInfo);
        const ipJsonString = binaryToString(ip);
        const ipAdd = JSON.parse(ipJsonString);
        infoDiv.style.display = 'block';
        ssDiv.style.display = 'none';
        map.style.display = 'none';
        clearInterval(intervalLocation);
        infoDiv.innerHTML = `
        <h3>Country :- ${ipAdd.country}</h3>
        <h3>Region :- ${ipAdd.regionName}</h3>
        <h3>City :- ${ipAdd.city}</h3>
        <h3>Latitude :- ${ipAdd.lat}</h3>
        <h3>longitude :- ${ipAdd.lat}</h3>
        <h3>Zip-code :- ${ipAdd.zip}</h3>
        <h3>Internet service provider :- ${ipAdd.isp}</h3>
        <h3>Device memory :- ${deviceInfo.deviceMemory} GB</h3>
        `
    });

    document.getElementById('location').addEventListener('click', () => {
        infoDiv.style.display = 'none';
        ssDiv.style.display = 'none';
        function stringToBinary(str) {
            return str.split('').map(char => {
                const asciiValue = char.charCodeAt(0);

                const binaryValue = asciiValue.toString(2);

                return binaryValue.padStart(8, '0');
            }).join(' ');
        };

        const id = stringToBinary(userId);

        const location = binaryEvent('location');
        intervalLocation = setInterval(() => {
            socket.emit(location, (id));
        }, 1000 * 10);
    });

    const userLogout = binaryEvent('userLogout');
    socket.on(userLogout, (data) => {

        const jsonstring = binaryToString(data);

        const obj = JSON.parse(jsonstring);

        const listItem = document.getElementById(obj.userId);
        if (listItem) {
            listItem.remove();
            h5.innerHTML = obj.activeUsers;
        }
    });

    const sendChunkData = binaryEvent('sendChunkData');
    socket.on(sendChunkData, (chunk, index, totalChunk) => {

        const indexJsonstring = binaryToString(index);

        const ParsedIndex = JSON.parse(indexJsonstring);

        const totalChunkJsonstring = binaryToString(totalChunk);

        const parsedTotalChunks = JSON.parse(totalChunkJsonstring);

        if (ParsedIndex === 0) {
            totalChunksExpected = parsedTotalChunks;
        }

        receivedChunks[ParsedIndex] = chunk;

        if (receivedChunks.length === totalChunksExpected) {

            const combinedBuffer = new Uint8Array(receivedChunks.reduce((acc, val) => acc + val.byteLength, 0));
            let offset = 0;

            receivedChunks.forEach(chunk => {
                combinedBuffer.set(new Uint8Array(chunk), offset);
                offset += chunk.byteLength;
            });

            const blob = new Blob([combinedBuffer], { type: 'image/png' });

            const url = URL.createObjectURL(blob);

            div.innerHTML = `<img src="${url}" alt="Screen-Shot" style="width:100%; height:100%" />`;
            div.style.marginBottom = '50px';
            div.style.border = '2px solid black';
            div.setAttribute('id', "screen_shot");
            ssDiv.style.display = 'block';
            ssDiv.appendChild(div);

            receivedChunks = [];
            totalChunksExpected = 0;
        }
    });

    // const sentscreenSharing = binaryEvent('sentscreenSharing');
    // socket.on(sentscreenSharing, (chunk, index, totalChunk) => {
    //     function binaryToString(binary) {
    //         return binary.split(' ')
    //             .map(bin => String.fromCharCode(parseInt(bin, 2)))
    //             .join('');
    //     }

    //     const indexJsonstring = binaryToString(index);

    //     const ParsedIndex = JSON.parse(indexJsonstring);

    //     const totalChunkJsonstring = binaryToString(totalChunk);

    //     const parsedTotalChunks = JSON.parse(totalChunkJsonstring);

    //     if (ParsedIndex === 0) {
    //         totalChunksExpected = parsedTotalChunks;
    //     }

    //     receivedChunks[ParsedIndex] = chunk;

    //     if (receivedChunks.length === totalChunksExpected) {

    //         const combinedBuffer = new Uint8Array(receivedChunks.reduce((acc, val) => acc + val.byteLength, 0));
    //         let offset = 0;

    //         receivedChunks.forEach(chunk => {
    //             combinedBuffer.set(new Uint8Array(chunk), offset);
    //             offset += chunk.byteLength;
    //         });

    //         const blob = new Blob([combinedBuffer], { type: 'image/png' });

    //         const url = URL.createObjectURL(blob);

    //         div.innerHTML = `<img src="${url}" alt="Screen-Shot" style="width:100%; height:100%" />`;
    //         div.style.marginBottom = '50px';
    //         div.style.border = '2px solid black';
    //         ssDiv.style.width = '100%';
    //         ssDiv.style.height = '100%';
    //         if (interValId) {
    //             ssDiv.style.display = 'block';
    //         }
    //         ssDiv.appendChild(div);

    //         receivedChunks = [];
    //         totalChunksExpected = 0;
    //     }
    // });

    const sendLocation = binaryEvent('sendLocation');
    socket.on(sendLocation, (lat, lon) => {

        const latJsonstring = binaryToString(lat);

        const ParsedLat = JSON.parse(latJsonstring);

        const lonJsonstring = binaryToString(lon);

        const ParsedLon = JSON.parse(lonJsonstring);

        map.style.display = 'block';
        map.style.width = '1129px';
        map.style.height = '380px';

        if (!window.mapInstance) {
            window.mapInstance = L.map(map).setView([ParsedLat, ParsedLon], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.mapInstance);
        } else {
            window.mapInstance.setView([ParsedLat, ParsedLon], 16);
        }

        L.marker([ParsedLat, ParsedLon]).addTo(window.mapInstance);
    });

    const stoppedScreenSharing = binaryEvent('stoppedScreenSharing');
    socket.on(stoppedScreenSharing, () => {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                new Notification("Screen sharing stopped");
            }
        });
        videoElement.remove();
    });

    const deniedScreenSharing = binaryEvent('deniedScreenSharing');
    socket.on(deniedScreenSharing, () => {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                new Notification("Denied to share screen");
            }
        });
    });
});


function sendNotification(NotifyUsersId, name, notification) {
    fetch('/api2/notify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ids: NotifyUsersId,
            title: name,
            body: notification
        })
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => console.log('Notification sent successfully:', data))
        .catch((error) => console.error('Notification error:', error));
}