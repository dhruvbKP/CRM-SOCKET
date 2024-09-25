const express = require('express');
// const { getUserdetail } = require('../controller/socketControl.js')
const { setUserdetail,loginUser, getUserdetail} = require('../controller/userControl.js')
const app = express();
app.use(express.json());


//create routes
const router = express.Router()

// router.get('/',userDataGet); 

// router.post('/userControl/registration',regitrstionUser);
// router.post('/userControl/login',loginUser);
// router.post('/userControl/setUserDetail',setUserdetail);
router.get('/userControl/getUserDetail/',getUserdetail);

module.exports = router;