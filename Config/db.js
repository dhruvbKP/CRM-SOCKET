const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    host: "45.92.9.232",
    port: 5432,
    user: "casi-demo",
    password: "wkN2gJu",
    database: "CRM"
});

module.exports = pool;