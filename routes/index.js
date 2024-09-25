const express = require('express');
const routes = express.Router();

const userRoutes = require('./user');
const adminRoutes = require('./admin');

routes.use('/', userRoutes);
routes.use('/admin', adminRoutes);

module.exports = routes;