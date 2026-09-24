require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Set up the app middleware so the server can handle browser requests and JSON payloads.
app.use(cors()); // Allow the frontend to make requests to this API from a different origin.
app.use(express.json()); // Read JSON bodies sent in incoming requests.
app.use(express.static(__dirname)); // Serve the website files from this project folder.

// Create a shared PostgreSQL connection pool so the app can reuse database connections efficiently.
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Check that the database is reachable before the app starts handling requests.
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Successfully connected to the PostgreSQL database.');
    release();
});

// ----------------------------------------------------
// API routes
// ----------------------------------------------------

// Return every transaction, along with the linked category and account names.
app.get('/api/transactions', async (req, res) => {
    try {
        // Join the transactions table with the categories and accounts so the response is easier to read.
        const query = `
            SELECT 
                t.id, 
                t.date, 
                t.merchant, 
                t.amount, 
                t.status,
                c.name AS category, 
                a.name AS account
            FROM TRANSACTIONS t
            LEFT JOIN CATEGORIES c ON t.category_id = c.id
            LEFT JOIN ACCOUNTS a ON t.account_id = a.id
            ORDER BY t.date DESC;
        `;

        const { rows } = await pool.query(query);

        // Format the response in the structure that DataTables.js expects by default.
        res.json({ data: rows });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching transactions' });
    }
});

// Start the web server and listen for incoming requests.
app.listen(port, () => {
    console.log(`Finance API is running on http://localhost:${port}`);
});