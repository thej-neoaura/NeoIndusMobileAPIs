const mysql = require('mysql2');

require('dotenv').config();

module.exports = mysql.createPool({
    connectionLimit : process.env.DB_CONNECTION_LIMIT,
    host : process.env.DB_HOST,
    user :  process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME
});
