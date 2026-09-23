require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests from your frontend
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.static(__dirname));

// PostgreSQL Database Connection Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test Database Connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Successfully connected to the PostgreSQL database.');
    release();
});

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Route 1: Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        // A simple JOIN query to get the transaction details along with the category and account names
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

        // Wrap the rows in a 'data' object. DataTables.js expects this exact structure by default.
        res.json({ data: rows });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching transactions' });
    }
});

// Start the Server
app.listen(port, () => {
    console.log(`Finance API is running on http://localhost:${port}`);
});