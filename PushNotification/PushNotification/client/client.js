let publicVapidKey = 'BPxHa6Obs0YA_buOQPCK2VRp1X8s2qDJcLu672e99W6XWRD56TX--2mn-OMoLzIAB8nQvRq-FjAOk1-H4lgs2bA';

const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);
const socket = io();
const notificationForm = document.getElementById('notificationForm');
const userListBox = document.getElementById('userListBox');

let username = localStorage.getItem('name');

while (!username) {
    username = prompt('Enter your good name :');
    localStorage.setItem('name', username);
}

async function getUserDetail() {
    try {
        const response = await fetch(`/api/userControl/getUserDetail`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        console.log(result);

        if (result.error) {
            alert(result.message);
        } else {
            uiUserDetail(result.data);
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        alert('An error occurred while fetching user details.');
    }
}
getUserDetail();

function uiUserDetail(arr) {
    // if (arr[arr.length - 1]) {
    arr.forEach(element => {
        if (element.name != username) {
            let ele = `
                    <li class="userList" id='${element.id}' style="list-style: auto">
                        <span class="listSpan" style="  auto; display: flex; align-content: center; align-items: center;">
                            <input type='checkbox'>
                            <text class='' >${element.name}</text>
                        </span>
                    </li>`
            userListBox.innerHTML += ele;
        }
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

notificationForm.addEventListener('submit', (e) => {
    e.preventDefault()

    let NotifyUsers = getNotifyUsers();
    const formData = new FormData(notificationForm);
    let notification = formData.get('message')
    sendNotification(NotifyUsers, username, notification)
})

if ('serviceWorker' in navigator && 'PushManager' in window) {
    send().catch(err => {
        console.error(err)
    });
}

// Register SW, Register Push, Send Push
async function send() {

    console.log("Registering service worker...");
    const register = await navigator.serviceWorker.register("/worker.js", {
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

    await fetch("/api2/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription: subscription, username }),
        headers: {
            "content-type": "application/json"
        }
    });
    console.log("Push Sent...");
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
}

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
