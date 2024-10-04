const express = require('express');
const { validateAdminToken } = require('../Config/token.js');
const routes = express.Router();

const { home, login, loginPage, logout, notify, registration, registrationPage } = require('../Controller/adminControl.js');

routes.get('/', loginPage);

routes.post('/login', login);

routes.get('/logout', logout);

routes.get('/registrationPage', registrationPage);

routes.post('/registration', registration);

routes.get('/home', validateAdminToken, home);

routes.post('/notification', notify);

// routes.get('adminPannel/index',(req,res))

module.exports = routes;