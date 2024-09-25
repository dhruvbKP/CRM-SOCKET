const express = require('express');
const { validateAdminToken } = require('../Config/token.js');
const routes = express.Router();

const adminCtrl = require('../Controller/admin.controller');

routes.get('/', adminCtrl.loginPage);

routes.post('/login', adminCtrl.login);

routes.get('/logout', adminCtrl.logout);

routes.get('/registrationPage', adminCtrl.registrationPage);

routes.post('/registration', adminCtrl.registration);

routes.get('/home', validateAdminToken, adminCtrl.home);

routes.post('/notification', adminCtrl.notify);

module.exports = routes;