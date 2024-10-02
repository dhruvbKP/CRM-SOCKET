const dotenv = require('dotenv');
dotenv.config();
const { Pool } = require("pg");

const pgClient = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

module.exports = pgClient;