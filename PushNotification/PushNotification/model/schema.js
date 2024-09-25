const {sequelize} = require('../confing/dbConnection.js');
const { Sequelize } = require('sequelize');
// Define a model
const Users = sequelize.define('users', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password :{
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: true // Disable the automatic creation of createdAt and updatedAt columns
});

const Subscription = sequelize.define('subscription', {
    name : {
        type: Sequelize.STRING,
        allowNull: false
    },
    endpoint: {
        type: Sequelize.STRING,
        allowNull: false
    },
    expirationTime: {
        type: Sequelize.STRING,
        allowNull: true
    },
    keys: {
        type: Sequelize.JSON, // Use Sequelize.JSON for storing an object
        allowNull: false
    }
}, {
    timestamps: true // Enable the automatic creation of createdAt and updatedAt columns
});


// Sync the model with the database
sequelize.sync()
    .then(() => console.log('Database & tables created!'));

module.exports = { Users, Subscription };