const express = require('express');
const { validateToken } = require('../Config/token.js');

const routes = express.Router

const { loginPage, login, logout, registerpage, registration, home } = require('../Controller/userControl.js');

routes.get('/', loginPage);

routes.post('/login', login);

routes.get('/logout', logout);

routes.get('/registerPage', registerpage);

routes.post('/registration', registration);

routes.get('/home', validateToken, home);

module.exports = routes;