const { Pool } = require('pg');
require('dotenv').config();

// This creates a shared PostgreSQL connection pool so the app can reuse database connections.
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Just checking that the database is reachable before the app starts serving requests.
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Successfully connected to the PostgreSQL database.');
    release();
});

module.exports = pool;