const { Users, Subscription } = require('../model/schema.js');

const { Op } = require('sequelize');

const setUserdetail = async (req, res) => {
    let response = {};
    try {
        const { name } = req.body;
        if (await Users.findOne({where: { name }})) {
            response.message = "User already exists.";
            response.status = 400;
            response.success = false;
            return;
        }
        const newUser = await Users.create({
            name,
            email,
            password
        });
        res.status(200).json({
            message: 'User is created',
            success : true,
            status : 200,
            data: newUser
        });

        newUser.password = '';
        response.message = "User registered successfully.";
        response.data = newUser;
        response.status = 200;
        response.success = true;
    } catch (err) {
        response.message = err.message;
        response.status = 400;
        response.success = false;
    } finally {
        // res.status(response.status).send(response);
    }
}

const loginUser = async (req, res) => {
    let response = {};
    try {
        let {email, password} = req.body;
        if (!await Users.findOne({where: { email }})) {
            response.message = "User didn't registered";
            response.status = 400;
            response.success = false;
            return;
        }
        const userData = await Users.findOne({
            where: {
                [Op.and]: [
                    { email: email },
                    { password: password }// Additional condition
                ]
            }
        });
        if (!userData) {
            response.message = "Password is incorrect";
            response.status = 400;
            response.success = false;
            return;
        }
        userData.password = '';
        response.message = "User is logged successfully.";
        response.data = userData;
        response.status = 200;
        response.success = true;

    } catch (err) {
        response.message = err.message;
        response.status = 400;
        response.success = false;
    } finally {
        res.status(response.status).send(response);
    }
}

const getUserdetail = async (req, res) => {
    let response = {}
    try {
        let db = await Subscription.findAll()        
        response.error = false;
        response.status = 200;
        response.data = db;
    } catch (err) {
        response.error = true;
        response.message = err.message; 
        response.status = 400;
    } finally {
        res.send(response);
    }
}

module.exports = { setUserdetail, loginUser, getUserdetail}


// const { Users } = require('../model/schema.js');

// //getall users
// const getUsers = async (req, res) => {
//     try {
//         let data = await Users.findAll()
//         res.status(200).json({
//             message: 'User is created',
//             success : true,
//             status : 200,
//             data
//         });
//     } catch (err) {
//         res.status(400).json(err.message);
//     }
// }

// //create new users
// const createUser = async (req, res) => {
//     try {
        
//     } catch (err) {
//         res.status(400).json({
//             error: err.message
//         });
//     }

// }

// //delete users
// const deleteUser = async (req, res) => {
//     try {
//         const id = parseInt(req.params.id);
//         const result = await Users.destroy({where: {id}});
//         res.status(200).json({
//             message: 'User deleted',
//             success: true,
//             status : 200,
//             delete : result
//         });
//     } catch (err) { 
//         res.status(400).json({
//             error: err.message
//         });
//     }
// }

// //update user
// const updateUser = async (req, res) => {
//     try {
//         const id = parseInt(req.params.id);
//         const { name, email } = req.body;

//         const data = await Users.update({ name, email }, { where: { id } });

//         res.status(200).json({
//             message: 'User is updated',
//             success: true,
//             status : 200,
//             update : data[0]
//         });

//     } catch (err) {
//         res.status(400).json({
//             error: err.message
//         });
//     }
// }

// //get 1 user
// const getOneUsers = async (req, res) => {
//     try {
//         const id = parseInt(req.params.id)
       
//         res.status(200).json( {
//             message: 'user find succesfully',
//             success: true,
//             status : 200,
//             user 
//         });
//     } catch (err) {
//         res.status(400).json({
//             error: err.message
//         });
//     }
// }

// // module.exports = { getUsers, createUser, deleteUser, updateUser, getOneUsers }