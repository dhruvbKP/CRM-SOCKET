const express = require('express');
const { validateToken } = require('../Config/token.js');

const routes = express.Router();

const userCtrl = require('../Controller/user.controller');

routes.get('/', userCtrl.loginPage);

routes.post('/login', userCtrl.login);

routes.get('/logout', userCtrl.logout);

routes.get('/registerPage', userCtrl.registerpage);

routes.post('/registration', userCtrl.registration);

routes.get('/home', validateToken, userCtrl.home);

module.exports = routes;