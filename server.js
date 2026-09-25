require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// This sets up the app so it can handle browser requests and read JSON data.
app.use(cors()); // Lets the frontend talk to this API even if it is running on a different port.
app.use(express.json()); // Reads JSON data sent in requests.
app.use(express.static(__dirname)); // Serves the website files from this project folder.

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

// ----------------------------------------------------
// API routes
// ----------------------------------------------------

// Get all transactions, along with the matching category and account names.
app.get('/api/transactions', async (req, res) => {
    try {
        // Pull the transaction details together with category and account info so the front end gets a clearer result.
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

        // Return the data in the format DataTables expects.
        res.json({ data: rows });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching transactions' });
    }
});

// This gets the spending by category for the doughnut chart.
app.get('/api/summary/categories', async (req, res) => {
    try {
        const query = `
            SELECT c.name AS category, SUM(t.amount) AS total
            FROM TRANSACTIONS t
            JOIN CATEGORIES c ON t.category_id = c.id
            WHERE c.type = 'expense'
            GROUP BY c.name;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching category summary' });
    }
});

// This gets the monthly income and spending totals for the analytics charts.
app.get('/api/summary/monthly', async (req, res) => {
    try {
        const query = `
            SELECT
                TO_CHAR(DATE_TRUNC('month', t.date), 'Mon YYYY') AS month,
                DATE_TRUNC('month', t.date) AS month_date,
                COALESCE(SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
            FROM TRANSACTIONS t
            JOIN CATEGORIES c ON t.category_id = c.id
            GROUP BY month_date
            ORDER BY month_date ASC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching monthly summary' });
    }
});

// This gets the monthly cash flow for the line chart.
app.get('/api/summary/cashflow', async (req, res) => {
    try {
        const query = `
            SELECT 
                TO_CHAR(t.date, 'Mon') AS month,
                EXTRACT(MONTH FROM t.date) AS month_num,
                SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE -t.amount END) AS net_balance
            FROM TRANSACTIONS t
            JOIN CATEGORIES c ON t.category_id = c.id
            GROUP BY month, month_num
            ORDER BY month_num ASC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching cash flow summary' });
    }
});
// This gets the KPI numbers shown on the dashboard cards.
app.get('/api/summary/kpi', async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT SUM(balance) FROM ACCOUNTS) AS total_balance,
                (SELECT SUM(amount) FROM TRANSACTIONS t JOIN CATEGORIES c ON t.category_id = c.id WHERE c.type = 'income' AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS monthly_income,
                (SELECT SUM(amount) FROM TRANSACTIONS t JOIN CATEGORIES c ON t.category_id = c.id WHERE c.type = 'expense' AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS monthly_expenses
        `;
        const { rows } = await pool.query(query);
        res.json(rows[0]); // Send back the single row with the totals.
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching KPIs' });
    }
});

// Start the server so the dashboard can talk to it.
app.listen(port, () => {
    console.log(`Finance API is running on http://localhost:${port}`);
});