let { io } = require('../index.js')

const onConnection = (socket) => {
    try {
        
        socket.on('join-room', (userId) => {
            socket.join(userId);
            console.log('Room joined:', userId);
        });
        socket.on('get-publicVapidKey',(id)=>{
            io.to(id).emit('send-publicVapidKey',publicVapidKey);
        })

        socket.on('send-notifyusers', (id, name, message) => {
            io.to(id).emit('send-notification', name, message);
        });
    }
    catch (err) { 
        console.log(err.message);

    }
};

io.on('connection', onConnection);
