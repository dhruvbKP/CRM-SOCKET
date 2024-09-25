const express = require('express');
const pushRouter = express.Router();
const notificationController = require('../controller/notificationController.js');

pushRouter.post('/subscribe', notificationController.subscribe);
pushRouter.post('/notify', notificationController.notify);

module.exports = pushRouter;
