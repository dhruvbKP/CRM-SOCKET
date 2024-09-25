const { Sequelize } = require('sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize('PushNotification', 'postgres', 'kp123', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
});

// Test the connection
sequelize.authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err));

module.exports = { sequelize }

