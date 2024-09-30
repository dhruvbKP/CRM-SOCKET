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
const selectAllCurrentUser = document.getElementById('selectAllCurrentUser');
const userCheckBox = document.querySelectorAll('.userCheckBox');
let currentUserCheckBox = document.querySelectorAll('.currentUserCheckBox');
const pushForm = document.getElementById('pushForm');
const notificationModel = document.getElementById('notificationModel');
var span = document.getElementsByClassName("close")[0];
const notificationForm = document.getElementById('notificationForm');
const currentUsers = document.getElementsByClassName('userName');
const currentUserLi = document.getElementsByClassName('active');
const onSiteNotification = document.getElementById('onSiteNotification');
const closeScreenShot = document.getElementById('closeScreenShot');

span.onclick = function () {
    notificationModel.style.display = "none";
};

let videoElement = document.createElement('video');

const partnerKey = 'ckKyVx4WfJxPSOX3aRLCdntX2uDvOIwv1HqGOFlahBDNVc37gT9taviOa0zB1RGe4HQwuATfgMQpHYqGLEnV3g==';

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
            closeScreenShot.style.display = 'none';
        }
        if (infoDiv.innerText) {
            infoDiv.style.display = 'none';
            closeScreenShot.style.display = 'none';
        }
        if (map.innerHTML) {
            clearInterval(intervalLocation);
            map.style.display = 'none';
            closeScreenShot.style.display = 'none';
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
    });
});

selectAllCheckBox.addEventListener('change', () => {
    userCheckBox.forEach(checkbox => {
        checkbox.checked = selectAllCheckBox.checked;
    });

    userCheckBox.forEach(checkbox => {
        if (selectAllCheckBox.checked) {
            usersubscriptionIds.push(checkbox.value);
            usersubscriptionIds = usersubscriptionIds.filter((value, index, self) => self.indexOf(value) === index);
        }
        else {
            usersubscriptionIds = usersubscriptionIds.filter(item => item !== checkbox.value);
        }
    });
});

// Update notification visibility based on checked checkboxes
function updateNotificationDisplay() {
    if (Array.from(currentUserCheckBox).some(checkbox => checkbox.checked)) {
        onSiteNotification.style.display = 'block';
    } else {
        // If no checkboxes are checked, hide the notification
        onSiteNotification.style.display = 'none';
    }
}

let userOnsiteNotifyIds = [];
// Individual user checkboxes
currentUserCheckBox.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        // Update notification display

        // Update "Select All" checkbox based on individual checkboxes
        if (!checkbox.checked) {
            selectAllCurrentUser.checked = false;
        } else if (Array.from(currentUserCheckBox).every(cb => cb.checked)) {
            selectAllCurrentUser.checked = true;
        }

        // Update subscription IDs array
        if (checkbox.checked) {
            userOnsiteNotifyIds.push(checkbox.value);
        } else {
            userOnsiteNotifyIds = userOnsiteNotifyIds.filter(item => item !== checkbox.value);
        }

        updateNotificationDisplay();
    });
});

// "Select All" checkbox
selectAllCurrentUser.addEventListener('change', () => {
    // Update all checkboxes based on the "Select All" checkbox
    currentUserCheckBox = document.querySelectorAll('.currentUserCheckBox');
    currentUserCheckBox.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (!checkbox.checked) {
                selectAllCurrentUser.checked = false;
            } else if (Array.from(currentUserCheckBox).every(cb => cb.checked)) {
                selectAllCurrentUser.checked = true;
            }
        });
    });
    currentUserCheckBox.forEach(checkbox => {
        checkbox.checked = selectAllCurrentUser.checked;
    });

    // Update notification display based on the state of "Select All"
    updateNotificationDisplay();
    currentUserCheckBox.forEach(checkbox => {
        if (selectAllCurrentUser.checked) {
            userOnsiteNotifyIds.push(checkbox.value);
            // Remove duplicates
            userOnsiteNotifyIds = userOnsiteNotifyIds.filter((value, index, self) => self.indexOf(value) === index);
        } else {
            userOnsiteNotifyIds = userOnsiteNotifyIds.filter(item => item !== checkbox.value);
        }
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

    const data = {
        socketId: socket.id,
        partnerId: partnerKey
    }

    const binaryData = stringToBinary(JSON.stringify(data));

    const adminConnected = binaryEvent('adminConnected');
    socket.emit(adminConnected, binaryData);

    const userData = binaryEvent('userData');
    socket.on(userData, async (data) => {
        const jsonstring = binaryToString(data);
        const obj = JSON.parse(jsonstring);
        h5.innerHTML = obj.activeUsers;
        if (document.getElementById(obj.userId)) return;
        ul.innerHTML += await `<li class="active has-sub" id="${obj.userId}"
                                style="margin-bottom: 20px;">
                            <div style="display: flex;">
                                <input class="currentUserCheckBox" value="${obj.userId}" type="checkbox"
                                    style="margin-right: 10px; width: 20px;">
                                <h3 onclick="demo('${obj.userId}')" class="userName" style="cursor: pointer;">
                                    ${obj.userName}
                                </h3>
                            </div>
                        </li>`;
        currentUserCheckBox = document.querySelectorAll('.currentUserCheckBox');
        currentUserCheckBox.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                // Update notification display

                // Update "Select All" checkbox based on individual checkboxes
                if (!checkbox.checked) {
                    selectAllCurrentUser.checked = false;
                } else if (Array.from(currentUserCheckBox).every(cb => cb.checked)) {
                    selectAllCurrentUser.checked = true;
                }

                // Update subscription IDs array
                if (checkbox.checked) {
                    userOnsiteNotifyIds.push(checkbox.value);
                } else {
                    userOnsiteNotifyIds = userOnsiteNotifyIds.filter(item => item !== checkbox.value);
                }

                updateNotificationDisplay();
            });
        });
    });

    document.getElementById('screenShot').addEventListener('click', () => {
        infoDiv.style.display = 'none';
        clearInterval(intervalLocation);
        map.style.display = 'none';
        videoElement.remove();

        const data = {
            partnerId: partnerKey,
            id: userId
        }

        const binaryData = stringToBinary(JSON.stringify(data));

        const userClicked = binaryEvent('userClicked');
        socket.emit(userClicked, binaryData);
    });

    document.getElementById('screenShare').addEventListener('click', () => {
        infoDiv.style.display = 'none';
        closeScreenShot.style.display = 'none';
        clearInterval(intervalLocation);
        map.style.display = 'none';
        if (ssDiv.children[0]) {
            ssDiv.children[0].remove();
        }

        const data = {
            partnerId: partnerKey,
            id: userId
        }

        const binaryData = stringToBinary(JSON.stringify(data));

        const request_screen_share = binaryEvent('request_screen_share');
        socket.emit(request_screen_share, binaryData);
    });

    // document.getElementById('notification').addEventListener('click', () => {
    //     notificationModel.style.display = 'block';
    //     notificationModel.style.zIndex = '999';
    // });

    onSiteNotification.addEventListener('click', () => {
        notificationModel.style.display = 'block';
        notificationModel.style.zIndex = '999';
        closeScreenShot.style.display = 'none';
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
            id: userOnsiteNotifyIds,
            title: notificationTitle,
            message: notificationMessage,
            position: notificationPosition,
            partnerId: partnerKey
        }
        const jsonString = JSON.stringify(data);
        const binaryData = stringToBinary(jsonString);

        const sendNotification = binaryEvent('sendNotification');
        socket.emit(sendNotification, binaryData);
        currentUserCheckBox.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                selectAllCurrentUser.checked = false;
            }
        });
        userOnsiteNotifyIds.splice(0, userOnsiteNotifyIds.length)
        updateNotificationDisplay();
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
                    id: userId,
                    partnerKey: partnerKey
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
        const partnerID = stringToBinary(partnerKey);
        const sendAnswer = binaryEvent('sendAnswer');
        socket.emit(sendAnswer, binaryAnswer, id, partnerID);
    });

    const ice_candidate = binaryEvent('ice_candidate');
    socket.on(ice_candidate, async (data) => {
        const jsonString = binaryToString(data);
        const parsedData = JSON.parse(jsonString);
        await peerConnection.addIceCandidate(new RTCIceCandidate(parsedData.candidate));
    });

    document.getElementById('ipInfo').addEventListener('click', () => {
        const id = stringToBinary(userId);
        const partnerId = stringToBinary(partnerKey);
        const ipInfo = binaryEvent('ipInfo');
        socket.emit(ipInfo, partnerId, id);
    });

    const sendIpInfo = binaryEvent('sendIpInfo');
    socket.on(sendIpInfo, (ip) => {
        const ipAdd = binaryToString(ip);
        infoDiv.style.display = 'block';
        ssDiv.style.display = 'none';
        closeScreenShot.style.display = 'none';
        map.style.display = 'none';
        clearInterval(intervalLocation);
        infoDiv.innerHTML = `<h3>Ip address :- ${ipAdd}</h3>`;
    });

    document.getElementById('deviceinfo').addEventListener('click', () => {
        const partnerId = stringToBinary(partnerKey);
        const id = stringToBinary(userId);
        const deviceInfo = binaryEvent('deviceInfo');
        socket.emit(deviceInfo, partnerId, id);
    });

    const sendDeviceInfo = binaryEvent('sendDeviceInfo');
    socket.on(sendDeviceInfo, (deviceinfo, ip) => {
        const DeviceInfo = binaryToString(deviceinfo);
        const deviceInfo = JSON.parse(DeviceInfo);
        const ipJsonString = binaryToString(ip);
        const ipAdd = JSON.parse(ipJsonString);
        infoDiv.style.display = 'block';
        ssDiv.style.display = 'none';
        closeScreenShot.style.display = 'none';
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
        closeScreenShot.style.display = 'none';
        ssDiv.style.display = 'none';
        function stringToBinary(str) {
            return str.split('').map(char => {
                const asciiValue = char.charCodeAt(0);

                const binaryValue = asciiValue.toString(2);

                return binaryValue.padStart(8, '0');
            }).join(' ');
        };

        const id = stringToBinary(userId);
        const partnerID = stringToBinary(partnerKey);

        const location = binaryEvent('location');
        intervalLocation = setInterval(() => {
            socket.emit(location, id, partnerID);
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
            closeScreenShot.style.display = 'block';

            receivedChunks = [];
            totalChunksExpected = 0;
        }
    });

    closeScreenShot.addEventListener('click', () => {
        ssDiv.style.display = 'none';
        closeScreenShot.style.display = 'none';
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
        if (videoElement.srcObject) {
            Notification.requestPermission().then(perm => {
                if (perm === 'granted') {
                    new Notification("Screen sharing stopped");
                }
            });
            videoElement.remove();
        }
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