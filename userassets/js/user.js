const socket = io();
let publicVapidKey = 'BFVA5gXzIz-p2poU4ltPxWYVkMwCJgDRW83uVFGb0huBSH6kp3g7s0zW_IYSHlyJM32gIGCo9FjtQLhgwNzYOOk';

const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);

const currentuserId = document.getElementById('currentUserId').value;
const currentuserName = document.getElementById('currentUserName').value;
const logout = document.getElementById('logout');
const notification = document.getElementById('notification');
const notificatioClose = document.getElementById('notificatioClose');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');

var ipAdd;
let stream;

let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const binaryEvent = (event) => {
    return event.split('').map(char => {
        const asciiValue = char.charCodeAt(0);

        const binaryValue = asciiValue.toString(2);

        return binaryValue.padStart(8, '0');
    }).join(' ');
};

function binaryToString(binary) {
    return binary.split(' ')
        .map(bin => String.fromCharCode(parseInt(bin, 2)))
        .join('');
};

socket.on('connect', async () => {
    const binaryEvent = (event) => {
        return event.split('').map(char => {
            const asciiValue = char.charCodeAt(0);

            const binaryValue = asciiValue.toString(2);

            return binaryValue.padStart(8, '0');
        }).join(' ');
    };

    console.log('A new user connected :- ', socket.id);
    const socketId = socket.id;

    // const raw = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,query');
    // ipAdd = await raw.json();

    // const battery = await navigator.getBattery();
    // const batteryCharging = battery.charging ? true : false;

    const deviceInfo = {
        userAgent: navigator.userAgent,
        // connectionType: navigator.connection.effectiveType,
        deviceMemory: navigator.deviceMemory,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        colorDepth: screen.colorDepth,
        // downlink: navigator.connection.downlink,
        // batteryLevel: battery.level,
        // batteryCharging: batteryCharging
    };

    const data = {
        userName: currentuserName,
        userId: currentuserId,
        socketId: socketId,
        ipAdd: ipAdd,
        deviceInfo: deviceInfo
    };

    const jsonString = JSON.stringify(data);

    function stringToBinary(str) {
        return str.split('')
            .map(char => {
                const binary = char.charCodeAt(0).toString(2);
                return binary.padStart(8, '0');
            })
            .join(' ');
    };

    const binaryCode = stringToBinary(jsonString);

    const userJoined = binaryEvent('userJoined');
    socket.emit(userJoined, (binaryCode));

    logout.addEventListener('click', (e) => {
        const userLogout = binaryEvent('userLogout');
        const data = {
            userId: currentuserId,
            userName: currentuserName,
            socketId: socketId
        };

        const jsonString = JSON.stringify(data);

        function stringToBinary(str) {
            return str.split('')
                .map(char => {
                    const binary = char.charCodeAt(0).toString(2);
                    return binary.padStart(8, '0');
                })
                .join(' ');
        }

        const binaryCode = stringToBinary(jsonString);

        socket.emit(userLogout, (binaryCode));
    });

    // const screenShareClicked = binaryEvent('screenShareClicked');
    // socket.on(screenShareClicked, async () => {
    //     try {
    //         const captureCanvas = await html2canvas(document.body, {
    //             scrollX: window.scrollX,
    //             scrollY: 0,
    //             x: window.scrollX,
    //             y: window.scrollY,
    //             width: window.innerWidth,
    //             height: window.innerHeight,
    //             useCORS: true
    //         });

    //         const blob = await new Promise((resolve, reject) => {
    //             captureCanvas.toBlob((blob) => {
    //                 if (blob) {
    //                     resolve(blob);
    //                 } else {
    //                     reject(new Error('Failed to create Blob from canvas'));
    //                 }
    //             }, 'image/png');
    //         });

    //         const arrayBuffer = await blob.arrayBuffer();

    //         const chunkSize = 976 * 1024;
    //         const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

    //         for (let i = 0; i < totalChunks; i++) {
    //             const start = i * chunkSize;
    //             const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
    //             const chunk = arrayBuffer.slice(start, end);

    //             const sentscreenSharing = binaryEvent('sentscreenSharing');

    //             const indexString = JSON.stringify(i);
    //             const totalChunksString = JSON.stringify(totalChunks);

    //             function stringToBinary(str) {
    //                 return str.split('')
    //                     .map(char => {
    //                         const binary = char.charCodeAt(0).toString(2);
    //                         return binary.padStart(8, '0');
    //                     })
    //                     .join(' ');
    //             };

    //             const index = stringToBinary(indexString);
    //             const totalChunk = stringToBinary(totalChunksString);

    //             socket.emit(sentscreenSharing, chunk, index, totalChunk);
    //         };
    //     }
    //     catch (e) {
    //         console.log(e);
    //     }
    // });

    const start_screen_share = binaryEvent('start_screen_share');
    socket.on(start_screen_share, async () => {
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });
            const videotrack = stream.getVideoTracks()[0];

            peerConnection = new RTCPeerConnection(configuration);

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const ice_candidate = binaryEvent('ice_candidate');
                    const data = {
                        candidate: event.candidate
                    }
                    function stringToBinary(str) {
                        return str.split('')
                            .map(char => {
                                const binary = char.charCodeAt(0).toString(2);
                                return binary.padStart(8, '0');
                            })
                            .join(' ');
                    };
                    const jsonString = JSON.stringify(data);
                    const binaryData = stringToBinary(jsonString);
                    socket.emit(ice_candidate, binaryData);
                }
            };

            peerConnection.addTrack(videotrack, stream);

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            const string = JSON.stringify(offer);
            const binaryOffer = stringToBinary(string);
            const sendOffer = binaryEvent('sendOffer');
            socket.emit(sendOffer, binaryOffer);

            stream.getVideoTracks()[0].onended = () => {
                const stoppedScreenSharing = binaryEvent('stoppedScreenSharing');
                socket.emit(stoppedScreenSharing);
            };
        }
        catch (e) {
            console.log('Error accessing screen share', e);
            const deniedScreenSharing = binaryEvent('deniedScreenSharing');
            socket.emit(deniedScreenSharing);
        }
    });

    const sendAnswer = binaryEvent('sendAnswer');
    socket.on(sendAnswer, async (answer) => {
        function binaryToString(binary) {
            return binary.split(' ')
                .map(bin => String.fromCharCode(parseInt(bin, 2)))
                .join('');
        };
        const jsonString = binaryToString(answer);
        const parsedAnswer = JSON.parse(jsonString);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(parsedAnswer));
    });

    const ice_candidate = binaryEvent('ice_candidate');
    socket.on(ice_candidate, async (data) => {
        function binaryToString(binary) {
            return binary.split(' ')
                .map(bin => String.fromCharCode(parseInt(bin, 2)))
                .join('');
        };
        const jsonString = binaryToString(data);
        const parsedData = JSON.parse(jsonString);
        await peerConnection.addIceCandidate(new RTCIceCandidate(parsedData));
    });

    const userClicked = binaryEvent('userClicked');
    socket.on(userClicked, async () => {
        try {
            const captureCanvas = await html2canvas(document.body, {
                scrollX: window.scrollX,
                scrollY: 0,
                x: window.scrollX,
                y: window.scrollY,
                width: window.innerWidth,
                height: window.innerHeight,
                useCORS: true,
                logging: true,
                backgroundColor: null,
                scale: 1,
            });

            const blob = await new Promise((resolve, reject) => {
                captureCanvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create Blob from canvas'));
                    }
                }, 'image/png');
            });

            const arrayBuffer = await blob.arrayBuffer();

            const chunkSize = 976 * 1024;
            const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
                const chunk = arrayBuffer.slice(start, end);

                const sentDataChunk = binaryEvent('sentDataChunk');

                const indexString = JSON.stringify(i);
                const totalChunksString = JSON.stringify(totalChunks);

                function stringToBinary(str) {
                    return str.split('')
                        .map(char => {
                            const binary = char.charCodeAt(0).toString(2);
                            return binary.padStart(8, '0');
                        })
                        .join(' ');
                };

                const index = stringToBinary(indexString);
                const totalChunk = stringToBinary(totalChunksString);

                socket.emit(sentDataChunk, chunk, index, totalChunk);
            };
        } catch (error) {
            console.error('Error:', error);
        }
    });

    const location = binaryEvent('location');
    socket.on(location, async (id) => {
        const raw = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,query');
        info = await raw.json();
        function stringToBinary(str) {
            const string = JSON.stringify(str);
            return string.split('')
                .map(char => {
                    const binary = char.charCodeAt(0).toString(2);
                    return binary.padStart(8, '0');
                })
                .join(' ');
        };

        const lat = stringToBinary(info.lat);
        const lon = stringToBinary(info.lon);
        const sendLocation = binaryEvent('sendLocation');
        socket.emit(sendLocation, lat, lon);
    });

    const sendNotification = binaryEvent('sendNotification');
    socket.on(sendNotification, (data) => {
        try {
            const jsonString = binaryToString(data);

            const parsedData = JSON.parse(jsonString);

            const { id, title, message, position } = parsedData;

            console.log(id, title, message, position);

            notification.style.display = 'block';

            notificationTitle.innerText = title;
            notificationMessage.innerText = message;

            notification.style.top = '';
            notification.style.right = '';
            notification.style.bottom = '';
            notification.style.left = '';
            notification.style.transform = '';

            if (position === 'topRight') {
                notification.style.right = '0'
            }
            else if (position === 'topCenter') {
                notification.style.right = '50%';
                notification.style.left = '50%';
                notification.style.transform = 'translate(-50%)';
            }
            else if (position === 'middleRight') {
                notification.style.top = '50%';
                notification.style.right = '0';
                notification.style.transform = 'translateY(-50%)'
            }
            else if (position === 'middleCenter') {
                notification.style.top = '50%';
                notification.style.right = '50%';
                notification.style.left = '50%';
                notification.style.transform = 'translate(-50%, -50%)'
            }
            else if (position === 'middleLeft') {
                notification.style.top = '50%';
                notification.style.left = '0';
                notification.style.transform = 'translateY(-50%)'
            }
            else if (position === 'bottomRight') {
                notification.style.bottom = '0';
                notification.style.right = '0';
                notification.style.transform = 'translateY(-50%)'
            }
            else if (position === 'bottomCenter') {
                notification.style.bottom = '0';
                notification.style.right = '50%';
                notification.style.left = '50%';
                notification.style.transform = 'translate(-50%, -50%)'
            }
            else if (position === 'bottomLeft') {
                notification.style.bottom = '0';
                notification.style.left = '0';
                notification.style.transform = 'translateY(-50%)'
            }
            else {
                notification.style.left = '0';
            }

            notificatioClose.addEventListener('click', () => {
                notification.style.display = 'none'
            });
        }
        catch (e) {
            console.log(e, "error");
        }
    });
});

if ('serviceWorker' in navigator && 'PushManager' in window) {
    send().catch(err => {
        console.error(err)
    });
}

function getNotifyUsers() {
    let NotifyUsers = new Set;
    let usersList = document.querySelectorAll('li');
    usersList.forEach(x => {
        if (x.childNodes[1].childNodes[1].checked) {
            NotifyUsers.add(x.id);
        }
    });
    return Array.from(NotifyUsers);
}

// Register SW, Register Push, Send Push
async function send() {

    console.log("Registering service worker...");
    const register = await navigator.serviceWorker.register("/service-worker.js", {
        scope: "/"
    });
    console.log("Service Worker Registered...");

    // Register Push
    let subscription = await register.pushManager.getSubscription();
    if (!subscription) {
        console.log("Registering Push...");
        subscription = await register.pushManager.subscribe({
            applicationServerKey,
            userVisibleOnly: true
        });
    }

    console.log("Push Registered...");

    // Send Push Notification
    console.log("Sending Push...");
    console.log(subscription);

    const sendUserSubscription = binaryEvent('sendUserSubscription');
    function stringToBinary(str) {
        return str.split('')
            .map(char => {
                const binary = char.charCodeAt(0).toString(2);
                return binary.padStart(8, '0');
            })
            .join(' ');
    };
    const binaryId = stringToBinary(currentuserId);
    const binaryName = stringToBinary(currentuserName);
    const binarySubscription = stringToBinary(subscription.endpoint);
    const expiredTime = subscription.expirationTime;
    // const jsonString = JSON.stringify(subscription.key);
    // const binarySubscriptionKey = stringToBinary(jsonString);

    socket.emit(sendUserSubscription, binarySubscription, subscription, binaryId, binaryName, expiredTime);

    // await fetch("/api2/subscribe", {
    //     method: "POST",
    //     body: JSON.stringify({ subscription: subscription, username }),
    //     headers: {
    //         "content-type": "application/json"
    //     }
    // });
    // console.log("Push Sent...");
}

// Check for service worker
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};