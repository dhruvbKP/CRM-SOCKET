self.addEventListener('push', (event) => {

    const data = event.data.json();
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'http://localhost:8070/img/logo-mini.png',
        data: data.data,
        vibrate: data.vibrate,
        timestamp: data.timestamp,
        actions: [
            {
                action: data.actions[0].action,
                title: data.actions[0].title,
                icon: data.actions[0].icon
            },
            {
                action: data.actions[1].action,
                title: data.actions[1].title
            }
        ]
    });

});

self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'dismiss') {
        notification.close();
    } else if (action === 'open') {
        clients.openWindow(notification.data.url);
    } else if (action === 'Explore Now') {
        clients.openWindow(notification.data.url);
    } else {
        clients.openWindow(notification.data.url);
    }
});

