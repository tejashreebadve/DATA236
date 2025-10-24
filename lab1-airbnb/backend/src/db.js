// backend/src/db.js
const mysql = require('mysql2');                 // NOTE: not 'mysql2/promise'
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

// Export the *promise* wrapper so .query/.execute return promises
module.exports = pool.promise();
