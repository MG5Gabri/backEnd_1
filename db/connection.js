const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'b7eamy50bbcxxjw7rykv-mysql.services.clever-cloud.com',
    user: 'uatbaucz7lt3tyr1',
    password: 'hPmvnTOW0LeoDzMMUaYO',
    database: 'b7eamy50bbcxxjw7rykv'
});

db.connect((err) => {
  if (err) throw err;
  console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = db;
